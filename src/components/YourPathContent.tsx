'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Divider,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { useUser } from 'src/hooks/useUser';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { redirectToStripe } from 'src/lib/checkout/redirectToStripe';
import SubscriptionsClient from './SubscriptionsClient';
import PurchaseModal from './PurchaseModal'; // Убедитесь, что путь верный, если вы изменили его

export default function YourPathContent() {
  const t = useTranslations('YourPath');
  const format = useFormatter();
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showConfirmResumeModal, setShowConfirmResumeModal] = useState(false);
  const locale = useLocale();
  useEffect(() => {
    if (!user) {
      setCredits(null);
      return;
    }

    const fetchCredits = async () => {
      setLoadingCredits(true);
      try {
        const { data } = await supabase
          .from('card_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();
        setCredits(data?.credits ?? 0);
      } catch (error) {
        console.error('Ошибка при загрузке кредитов:', error);
        setCredits(0);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();

    const handleRefresh = () => fetchCredits();
    window.addEventListener('refresh-card-credits', handleRefresh);
    return () => {
      window.removeEventListener('refresh-card-credits', handleRefresh);
    };
  }, [user]);
  useEffect(() => {
    if (!user) {
      setUserSubscription(null);
      return;
    }

    const fetchUserSubscription = async () => {
      setLoadingSubscription(true);
      try {
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select(
            'stripe_sub_id, user_id, status, plan, pending_plan, current_period_end, is_cancellation_pending',
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setUserSubscription(subscriptionData || null);
      } catch (error) {
        console.error('Ошибка при загрузке подписки пользователя:', error);
        toast.error(t('fetchDataError'));
        setUserSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchUserSubscription();

    const handleSubscriptionRefresh = () => fetchUserSubscription();
    window.addEventListener(
      'refresh-user-subscription',
      handleSubscriptionRefresh,
    );
    return () => {
      window.removeEventListener(
        'refresh-user-subscription',
        handleSubscriptionRefresh,
      );
    };
  }, [user]);

  // --- Общая логика загрузки компонента ---
  useEffect(() => {
    if (!loadingUser && !loadingSubscription) {
      setLoadingContent(false);
    }
  }, [loadingUser, loadingSubscription]);

  // --- Функция для ПОДТВЕРЖДЕННОЙ отмены подписки (вызывается из модалки) ---
  const confirmCancelSubscription = async () => {
    setShowConfirmCancelModal(false); // Закрываем модалку подтверждения
    if (!user || !userSubscription?.stripe_sub_id) {
      toast.error(t('noActiveSubscriptionToCancelToast'));
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          pendingPlan: userSubscription.pending_plan || null, // Передаем, даже если null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.error(t('activePlanBlock.cancelSuccess'));
        setUserSubscription((prev: any) => ({
          ...prev,
          status: 'pending_cancel', // Этот статус по-прежнему используется локально
          is_cancellation_pending: true, // Устанавливаем флаг, что отмена ожидается
          pending_plan: null, // Обнуляем pending_plan локально
        }));
        window.dispatchEvent(new Event('refresh-user-subscription'));
      } else {
        toast.error(t('cancelSubscriptionErrorToast'));
      }
    } catch (error) {
      console.error('Ошибка сети при отмене подписки:', error);
      toast.error(t('networkErrorCancelSubscriptionToast'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelSubscriptionClick = () => {
    setShowConfirmCancelModal(true);
  };

  const confirmResumeSubscription = async () => {
    setShowConfirmResumeModal(false);

    if (!user || !userSubscription || !userSubscription.stripe_sub_id) {
      toast.error(t('activePlanBlock.noSubscriptionToResumeToast'));
      setIsResuming(false);
      return;
    }

    setIsResuming(true);

    try {
      const apiEndpoint = '/api/stripe/resume-subscription';

      const requestBody = {
        userId: user.id,
        stripeSubscriptionId: userSubscription.stripe_sub_id,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('activePlanBlock.resumeSuccessGeneric'));
        setUserSubscription((prev: any) => ({
          ...prev,
          is_cancellation_pending: false,
        }));
        window.dispatchEvent(new Event('refresh-user-subscription'));
      } else {
        toast.error(t('activePlanBlock.resumeSubscriptionErrorToast'));
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error(t('activePlanBlock.networkErrorResumeSubscriptionToast'));
    } finally {
      setIsResuming(false);
    }
  };
  // const handleGoBackToReadings = () => {
  //   router.push('/');
  // };
  const handleGoBackToReadings = () => {
    router.push(`/${locale}/`); // Перенаправляем на главную страницу с текущей локалью
  };
  if (loadingUser || loadingContent || loadingSubscription) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const showCancelOption =
    userSubscription?.stripe_sub_id &&
    (userSubscription.status === 'active' ||
      userSubscription.status === 'trialing') &&
    !userSubscription.is_cancellation_pending;
  const showResumeOption =
    userSubscription?.stripe_sub_id && userSubscription.is_cancellation_pending;
  const formatPeriodEndDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format.dateTime(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasActiveSubscriptionToShow =
    userSubscription &&
    userSubscription.plan &&
    userSubscription.plan !== 'none';

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', py: 4, px: 2 }}>
      <Typography
        variant="h2"
        component="h1"
        align="center"
        gutterBottom
        sx={{ color: 'white', mb: 4 }}
      >
        {t('title')}
      </Typography>
      <Button
        variant="outlined"
        onClick={handleGoBackToReadings}
        sx={{
          mb: 4, // Отступ снизу
          color: 'white',
          borderColor: 'rgba(255,255,255,0.4)',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        {t('backToReadings')} {/* Используем ключ перевода */}
      </Button>

      <Stack direction="column" spacing={4} mt={4}>
        <Card
          sx={{
            flex: 1,
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            borderRadius: theme.shape.borderRadius * 2,
            boxShadow: theme.shadows[5],
            p: 3,
          }}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ color: 'white', fontWeight: 'bold' }}
              align="center"
            >
              {t('activePlanBlock.title')}
            </Typography>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
            {hasActiveSubscriptionToShow ? (
              <Box sx={{ mb: 3, color: 'white' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {t('activePlanBlock.yourCurrentPlan')}:{' '}
                  <strong>{userSubscription.plan}</strong>
                </Typography>
                {userSubscription.is_cancellation_pending ? (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: theme.palette.warning.light || 'orange',
                    }}
                  >
                    {t('activePlanBlock.subscriptionWillBeCanceledOn')}{' '}
                    {userSubscription.current_period_end
                      ? formatPeriodEndDate(userSubscription.current_period_end)
                      : t('activePlanBlock.atEndOfCurrentPeriod')}
                  </Typography>
                ) : (
                  userSubscription.status === 'active' && (
                    <Typography variant="body2" color="text.secondary">
                      {t('activePlanBlock.renews')}:{' '}
                      {userSubscription.current_period_end
                        ? ` ${formatPeriodEndDate(userSubscription.current_period_end)}`
                        : t('activePlanBlock.infoUnavailable')}
                    </Typography>
                  )
                )}

                {userSubscription.pending_plan && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: theme.palette.warning.light || 'orange',
                    }}
                  >
                    {t('activePlanBlock.willBeTransferredToPlan')}{' '}
                    <strong>{userSubscription.pending_plan}</strong>{' '}
                    {userSubscription.current_period_end
                      ? `${t('activePlanBlock.startingFrom')} ${formatPeriodEndDate(userSubscription.current_period_end)}`
                      : t('activePlanBlock.atEndOfCurrentPeriod')}
                    .
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body1" mb={3} color="text.secondary">
                {t('noPlanBlock.description')}
              </Typography>
            )}

            <SubscriptionsClient />
            {showResumeOption && !isResuming && (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => setShowConfirmResumeModal(true)}
                disabled={isResuming || !userSubscription?.stripe_sub_id}
                sx={{ mt: 3 }}
              >
                {isResuming
                  ? t('activePlanBlock.resuming')
                  : t('activePlanBlock.resumeSubscriptionButton')}{' '}
              </Button>
            )}
            {showCancelOption && !isCancelling && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleCancelSubscriptionClick}
                disabled={isCancelling || !userSubscription?.stripe_sub_id}
                sx={{ mt: 3 }}
              >
                {isCancelling
                  ? t('activePlanBlock.cancelling')
                  : t('activePlanBlock.cancelSubscriptionButton')}
              </Button>
            )}
          </CardContent>
        </Card>
        {user ? (
          <Card
            sx={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              borderRadius: theme.shape.borderRadius * 2,
              boxShadow: theme.shadows[5],
              p: 3,
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{ color: 'white', fontWeight: 'bold' }}
                align="center"
              >
                {t('oneTimePurchaseBlock.title')}{' '}
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
              <Typography variant="body1" sx={{ color: 'white' }}>
                {t('oneTimePurchaseBlock.needsMoreCards')}{' '}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  my: 1,
                  color: 'white',
                }}
              >
                {loadingCredits ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `${credits ?? 0} ${t('cards')}`
                )}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setShowModal(true)}
                disabled={loadingCredits}
                color="success"
                sx={{ mt: 2 }}
              >
                {loadingCredits
                  ? t('processing')
                  : t('creditsBlock.getMoreCardsButton')}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
      <PurchaseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onPurchase={async (count) => {
          setShowModal(false);
          await redirectToStripe(count);
        }}
      />
      <Dialog
        open={showConfirmCancelModal}
        onClose={() => setShowConfirmCancelModal(false)}
        aria-labelledby="confirm-cancel-subscription-dialog-title"
        aria-describedby="confirm-cancel-subscription-dialog-description"
      >
        <DialogTitle id="confirm-cancel-subscription-dialog-title">
          {t('confirmCancelModal.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-cancel-subscription-dialog-description">
            {t('confirmCancelModal.description')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmCancelModal(false)}
            color="primary"
          >
            {t('confirmCancelModal.buttonNo')}
          </Button>
          <Button onClick={confirmCancelSubscription} color="error" autoFocus>
            {t('confirmCancelModal.buttonYes')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showConfirmResumeModal}
        onClose={() => setShowConfirmResumeModal(false)}
        aria-labelledby="confirm-resume-subscription-dialog-title"
        aria-describedby="confirm-resume-subscription-dialog-description"
      >
        <DialogTitle id="confirm-resume-subscription-dialog-title">
          {t('activePlanBlock.confirmResumeModal.title')}{' '}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-resume-subscription-dialog-description">
            {t('activePlanBlock.confirmResumeModal.message', {
              planName: userSubscription?.plan,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmResumeModal(false)}
            color="secondary"
          >
            {t('activePlanBlock.confirmResumeModal.cancelButton')}{' '}
          </Button>
          <Button onClick={confirmResumeSubscription} color="primary" autoFocus>
            {t('activePlanBlock.confirmResumeModal.confirmButton')}{' '}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
