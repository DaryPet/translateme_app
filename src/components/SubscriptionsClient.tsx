// src/components/SubscriptionsClient.tsx
'use client';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { useTranslations } from 'next-intl';
import { useTheme } from '@mui/material/styles';
import { useUser } from 'src/hooks/useUser';
// Импорт GenericDialog вместо прямых импортов Dialog из MUI
import GenericDialog from 'src/components/ConfirmationDialog';

// Импорт toast из react-hot-toast
import toast from 'react-hot-toast';

export default function SubscriptionsClient() {
  const t = useTranslations('Subscriptions');
  const tPath = useTranslations('YourPath');

  const router = useRouter();
  const theme = useTheme();
  const { user, loading: loadingUser } = useUser();
  const [isLoading, setIsLoading] = useState<'medium' | 'premium' | null>(null);

  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [planToCancel, setPlanToCancel] = useState<'medium' | 'premium' | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);

  const [showSwitchPlanModal, setShowSwitchPlanModal] = useState(false);
  const [switchPlanTarget, setSwitchPlanTarget] = useState<
    'medium' | 'premium' | null
  >(null);

  // === Блокировка смены тарифа при pending_plan ===
  const isSwitchLocked = !!(
    userSubscription &&
    userSubscription.plan &&
    userSubscription.pending_plan
  );

  useEffect(() => {
    if (!user) {
      setUserSubscription(null);
      setLoadingSubscription(false);
      return;
    }

    const fetchUserSubscription = async () => {
      setLoadingSubscription(true);
      try {
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select(
            'stripe_sub_id, user_id, status, plan, pending_plan, current_period_end',
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setUserSubscription(subscriptionData || null);
      } catch (error) {
        setUserSubscription(null);
        // ТОСТЕР: Ошибка при загрузке информации о подписке
        toast.error(tPath('activePlanBlock.fetchSubscriptionErrorToast'));
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

  if (loadingUser || loadingSubscription) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const isPlanActive = (planType: 'medium' | 'premium') => {
    return (
      userSubscription &&
      userSubscription.plan === planType &&
      userSubscription.status === 'active'
    );
  };

  const isPlanPendingCancel = (planType: 'medium' | 'premium') => {
    return (
      userSubscription &&
      userSubscription.plan === planType &&
      userSubscription.status === 'pending_cancel'
    );
  };

  const handleSwitchPlan = (targetPlan: 'medium' | 'premium') => {
    setSwitchPlanTarget(targetPlan);
    setShowSwitchPlanModal(true);
  };

  const handleSubscribe = async (type: 'medium' | 'premium') => {
    if (isPlanActive(type)) {
      setPlanToCancel(type);
      setOpenCancelDialog(true);
      // ТОСТЕР: Пользователь уже подписан на этот план
      toast.error(tPath('activePlanBlock.alreadySubscribedToast'));
      return;
    }
    if (isPlanPendingCancel(type)) {
      // ТОСТЕР: План уже в процессе отмены
      toast.error(tPath('alreadyPendingCancelToast'));
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      // ТОСТЕР: Требуется авторизация
      toast.error(tPath('authRequiredToast'));
      return;
    }
    setIsLoading(type);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: `subscription_${type}` }),
      });
      const { url } = await res.json();
      if (url) {
        // ТОСТЕР: Успешная генерация URL, перенаправление
        toast.success(tPath('activePlanBlock.redirectToCheckoutToast'));
        window.location.href = url;
      }
    } catch (error) {
      // ТОСТЕР: Ошибка при попытке подписки
      toast.error(tPath('activePlanBlock.subscribeErrorToast'));
    } finally {
      setIsLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!user || !userSubscription || !planToCancel) {
      handleCloseCancelDialog();
      // ТОСТЕР: Некорректные данные для отмены
      toast.error(tPath('activePlanBlock.invalidCancelDataToast'));
      return;
    }
    if (!isPlanActive(planToCancel)) {
      handleCloseCancelDialog();
      // ТОСТЕР: План не активен для отмены
      toast.success(tPath('activePlanBlock.planNotActiveForCancelToast'));
      return;
    }
    setOpenCancelDialog(false);
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.rpc(
        'cancel_subscription_at_period_end',
        {
          p_user_id: user.id,
          p_stripe_subscription_id: userSubscription.stripe_sub_id,
        },
      );

      if (error) {
        // ТОСТЕР: Ошибка при отмене подписки на сервере
        toast.error(tPath('activePlanBlock.cancelSubscriptionErrorToast'));
      } else {
        // ТОСТЕР: Успешное планирование отмены
        toast.success(tPath('activePlanBlock.cancelSuccess'));
        window.dispatchEvent(new Event('refresh-user-subscription'));
      }
    } catch (error) {
      // ТОСТЕР: Сетевая ошибка при отмене подписки
      toast.error(tPath('activePlanBlock.networkErrorCancelSubscriptionToast'));
    } finally {
      setIsCancelling(false);
      setPlanToCancel(null);
    }
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setPlanToCancel(null);
    // ТОСТЕР: Отмена операции по отписке
    toast.success(tPath('activePlanBlock.cancelOperationDismissed'));
  };

  const handleSwitchPlanConfirm = () => {
    setShowSwitchPlanModal(false);
    if (switchPlanTarget) {
      // ЛОКАЛЬНО устанавливаем pending_plan для мгновенного блокирования
      setUserSubscription((prev: any) => ({
        ...prev,
        pending_plan: switchPlanTarget,
      }));
      // === ЭТА СТРОКА ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ, КАК В ВАШЕМ ОРИГИНАЛЬНОМ КОДЕ ===
      handleSubscribe(switchPlanTarget);
      // ТОСТЕР: Запрос на смену тарифа принят (далее будет перенаправление на оплату, если логика handleSubscribe это подразумевает)
      toast.success(tPath('activePlanBlock.switchPlanInitiatedToast'));
      setSwitchPlanTarget(null);
    } else {
      // ТОСТЕР: Неверная цель для смены тарифа
      toast.error(tPath('activePlanBlock.invalidSwitchTargetToast'));
    }
  };

  const handleSwitchPlanCancel = () => {
    setShowSwitchPlanModal(false);
    setSwitchPlanTarget(null);
    // ТОСТЕР: Отмена операции по смене тарифа
    toast.success(tPath('activePlanBlock.switchPlanOperationDismissed'));
  };

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {t('title')}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mt={4}>
        {/* Medium Plan */}
        <Card
          sx={{
            flex: 1,
            bgcolor: 'white',
            opacity: isPlanActive('medium') ? 0.7 : 1,
            border: isPlanActive('medium')
              ? `1px solid ${theme.palette.success.main}`
              : '1px solid #e0e0e0',
            boxShadow: isPlanActive('medium')
              ? theme.shadows[8]
              : theme.shadows[1],
            transition: 'all 0.3s ease-in-out',
            color: 'text.primary',
            borderRadius: 4,
          }}
        >
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              {t('medium.title')}
            </Typography>
            <Typography variant="h3" component="div" gutterBottom>
              €5
              <Typography
                component="span"
                variant="body1"
                color="text.secondary"
              >
                /month
              </Typography>
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1} mb={3}>
              <Typography>✓ {t('medium.features.1')}</Typography>
            </Stack>
            <Button
              fullWidth
              variant={isPlanActive('medium') ? 'outlined' : 'contained'}
              color={
                isPlanActive('medium') || isPlanPendingCancel('medium')
                  ? 'inherit'
                  : 'primary'
              }
              onClick={() => {
                if (isPlanActive('medium') || isSwitchLocked) return;
                if (isPlanActive('premium')) {
                  handleSwitchPlan('medium');
                  return;
                }
                handleSubscribe('medium');
              }}
              disabled={
                isSwitchLocked ||
                isPlanActive('medium') ||
                isLoading === 'medium' ||
                isPlanPendingCancel('medium') ||
                (isPlanActive('medium') && isCancelling)
              }
              startIcon={
                isLoading === 'medium' || isCancelling ? (
                  <CircularProgress size={20} />
                ) : null
              }
              sx={{
                '&.Mui-disabled': {
                  opacity: 0.6,
                  ...((isPlanActive('medium') ||
                    isPlanPendingCancel('medium')) && {
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.85)',
                    },
                  }),
                },
              }}
            >
              {isLoading === 'medium' || isCancelling
                ? t('processing')
                : isPlanActive('medium')
                  ? t('alreadySubscribed')
                  : isPlanPendingCancel('medium')
                    ? t('pendingCancellation')
                    : t('medium.cta')}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card
          sx={{
            flex: 1,
            bgcolor: 'white',
            opacity: isPlanActive('premium') ? 0.7 : 1,
            border: isPlanActive('premium')
              ? `1px solid ${theme.palette.success.main}`
              : '1px solid #e0e0e0',
            boxShadow: isPlanActive('premium')
              ? theme.shadows[8]
              : theme.shadows[1],
            transition: 'all 0.3s ease-in-out',
            color: 'text.primary',
            borderRadius: 4,
          }}
        >
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              {t('premium.title')}
            </Typography>
            <Typography variant="h3" component="div" gutterBottom>
              €10
              <Typography
                component="span"
                variant="body1"
                color="text.secondary"
              >
                /month
              </Typography>
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1} mb={3}>
              <Typography>✓ {t('premium.features.1')}</Typography>
            </Stack>
            <Button
              fullWidth
              variant={isPlanActive('premium') ? 'outlined' : 'contained'}
              color={
                isPlanActive('premium') || isPlanPendingCancel('premium')
                  ? 'inherit'
                  : 'success'
              }
              onClick={() => {
                if (isPlanActive('premium') || isSwitchLocked) return;
                if (isPlanActive('medium')) {
                  handleSwitchPlan('premium');
                  return;
                }
                handleSubscribe('premium');
              }}
              disabled={
                isSwitchLocked ||
                isPlanActive('premium') ||
                isLoading === 'premium' ||
                isPlanPendingCancel('premium') ||
                (isPlanActive('premium') && isCancelling)
              }
              startIcon={
                isLoading === 'premium' || isCancelling ? (
                  <CircularProgress size={20} />
                ) : null
              }
              sx={{
                '&.Mui-disabled': {
                  opacity: 0.6,
                  ...((isPlanActive('premium') ||
                    isPlanPendingCancel('premium')) && {
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.85)',
                    },
                  }),
                },
              }}
            >
              {isLoading === 'premium' || isCancelling
                ? t('processing')
                : isPlanActive('premium')
                  ? t('alreadySubscribed')
                  : isPlanPendingCancel('premium')
                    ? t('pendingCancellation')
                    : t('premium.cta')}
            </Button>
          </CardContent>
        </Card>
      </Stack>

      {/* Сообщение о лимите смены тарифа */}
      {isSwitchLocked && (
        <Box
          sx={{
            mt: 3,
            mb: 2,
            px: 3,
            py: 2,
            borderRadius: 2,
            bgcolor: 'orange',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {t('switchLockedMessage', {
            date: userSubscription.current_period_end
              ? new Date(
                  userSubscription.current_period_end,
                ).toLocaleDateString()
              : '—',
          })}
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" align="center" mt={4}>
        {t('notice')}
      </Typography>

      {/* --- Модальное окно подтверждения отмены (Используем GenericDialog) --- */}
      <GenericDialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        title={t('confirmCancellationTitle')}
        description={t('confirmCancellationMessage')}
        confirmButtonText={t('yesButton')}
        cancelButtonText={t('noButton')}
        onConfirm={handleConfirmCancel}
        isConfirming={isCancelling}
        confirmButtonColor="error"
        dialogBackgroundColor="#7991c0ff"
      />

      {/* --- Модалка подтверждения перехода между тарифами (Используем GenericDialog) --- */}
      <GenericDialog
        open={showSwitchPlanModal}
        onClose={handleSwitchPlanCancel}
        title={t('switchPlanConfirmTitle')}
        description={t('switchPlanConfirmMessage')}
        confirmButtonText={t('yesButton')}
        cancelButtonText={t('noButton')}
        onConfirm={handleSwitchPlanConfirm}
        confirmButtonColor="success"
        dialogBackgroundColor="#7991c0ff"
      />
    </Box>
  );
}

// // src/components/SubscriptionsClient.tsx
// 'use client';

// import {
//   Button,
//   Card,
//   CardContent,
//   Typography,
//   Stack,
//   Box,
//   CircularProgress,
//   Divider,
// } from '@mui/material';
// import { useRouter } from 'next/navigation';
// import React, { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase/supabaseClient';
// import { useTranslations } from 'next-intl';
// import { useTheme } from '@mui/material/styles';
// import { useUser } from '@/hooks/useUser';
// import GenericDialog from '@/components/ConfirmationDialog';
// import toast from 'react-hot-toast';

// // Импорт useQuery, useMutation, useQueryClient из TanStack Query v5
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// // --- Определение типа Subscription (можно вынести в отдельный файл, например, src/types/supabase.ts) ---
// export interface Subscription {
//   stripe_sub_id: string;
//   user_id: string;
//   status: 'active' | 'pending_cancel' | 'cancelled' | 'trialing'; // Добавьте все возможные статусы
//   plan: 'medium' | 'premium';
//   pending_plan: 'medium' | 'premium' | null;
//   current_period_end: string; // ISO date string, например '2025-07-31T23:59:59Z'
// }
// // --- Конец определения типа ---

// export default function SubscriptionsClient() {
//   const t = useTranslations('Subscriptions');
//   const tPath = useTranslations('YourPath'); // Предполагается, что это путь для тостеров

//   const router = useRouter();
//   const theme = useTheme();
//   const { user, loading: loadingUser } = useUser(); // useUser должен возвращать user или null
//   const queryClient = useQueryClient();

//   // Состояния для модальных окон и переключения/отмены
//   const [openCancelDialog, setOpenCancelDialog] = useState(false);
//   const [planToCancel, setPlanToCancel] = useState<'medium' | 'premium' | null>(
//     null,
//   );
//   const [showSwitchPlanModal, setShowSwitchPlanModal] = useState(false);
//   const [switchPlanTarget, setSwitchPlanTarget] = useState<
//     'medium' | 'premium' | null
//   >(null);

//   // --- 1. useQuery для получения данных подписки ---
//   const {
//     data: userSubscription,
//     isLoading: loadingSubscription,
//     isError: isSubscriptionError,
//     error: subscriptionError, // Можно использовать для более детального отображения ошибки
//     refetch: refetchSubscription, // Функция для ручного обновления данных
//   } = useQuery<Subscription | null, Error>({
//     // Указываем ожидаемый тип данных и тип ошибки
//     queryKey: ['userSubscription', user?.id], // Ключ для кэша: зависит от ID пользователя
//     queryFn: async () => {
//       // Если пользователя нет, возвращаем null (запрос не должен выполняться)
//       if (!user) {
//         return null;
//       }

//       try {
//         const { data: subscriptionData, error } = await supabase
//           .from('subscriptions')
//           .select(
//             'stripe_sub_id, user_id, status, plan, pending_plan, current_period_end',
//           )
//           .eq('user_id', user.id)
//           .maybeSingle(); // Используем maybeSingle для случая, когда подписки нет

//         if (error && error.code !== 'PGRST116') {
//           // PGRST116 означает "No rows found"
//           throw error; // Перебрасываем ошибку для обработки useQuery
//         }
//         // Приводим данные к нашему интерфейсу Subscription
//         return (subscriptionData as Subscription) || null;
//       } catch (err: unknown) {
//         // Типизируем ошибку как unknown, а затем приводим к Error
//         const errorMessage = err instanceof Error ? err.message : String(err);
//         console.error('Ошибка загрузки подписки:', err);
//         toast.error(tPath('activePlanBlock.fetchSubscriptionErrorToast'));
//         throw new Error(errorMessage); // Важно перебросить, чтобы useQuery мог обработать 'isError'
//       }
//     },
//     enabled: !!user, // Запрос будет выполнен только если 'user' не null и не undefined
//     staleTime: 5 * 60 * 1000, // Данные считаются "свежими" в течение 5 минут
//     refetchOnWindowFocus: true, // Повторный запрос при фокусе на окне
//   });

//   // === Блокировка смены тарифа при pending_plan ===
//   // TypeScript теперь знает о свойствах userSubscription благодаря интерфейсу
//   const isSwitchLocked = !!(
//     userSubscription &&
//     userSubscription.plan &&
//     userSubscription.pending_plan
//   );

//   // --- 2. useMutation для подписки/чекаута ---
//   const subscribeMutation = useMutation<any, Error, 'medium' | 'premium'>({
//     mutationFn: async (type) => {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session) {
//         // Если нет сессии, перенаправляем на логин.
//         // Здесь мы выбрасываем ошибку, чтобы mutation.onError ее поймал и показал тост.
//         router.push('/login');
//         throw new Error(tPath('authRequiredToast'));
//       }

//       const res = await fetch('/api/checkout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${session.access_token}`,
//         },
//         body: JSON.stringify({ type: `subscription_${type}` }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to initiate checkout.');
//       }
//       return data;
//     },
//     onSuccess: (data) => {
//       if (data.url) {
//         toast.success(tPath('activePlanBlock.redirectToCheckoutToast'));
//         window.location.href = data.url; // Перенаправление на страницу оплаты
//       }
//       // После успешной подписки, инвалидируем кэш, чтобы обновить данные подписки
//       queryClient.invalidateQueries({
//         queryKey: ['userSubscription', user?.id],
//       });
//       // Если подписка влияет на отображение кредитов/статуса пользователя в других частях UI,
//       // также инвалидируем соответствующие ключи.
//       queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
//       queryClient.invalidateQueries({
//         queryKey: ['userCreditsDisplay', user?.id],
//       });
//     },
//     onError: (error) => {
//       console.error('Ошибка подписки:', error);
//       toast.error(
//         error.message || tPath('activePlanBlock.subscribeErrorToast'),
//       );
//     },
//   });

//   // --- 3. useMutation для отмены подписки ---
//   const cancelMutation = useMutation<
//     any,
//     Error,
//     { userId: string; stripeSubId: string }
//   >({
//     mutationFn: async ({ userId, stripeSubId }) => {
//       const { data, error } = await supabase.rpc(
//         'cancel_subscription_at_period_end',
//         {
//           p_user_id: userId,
//           p_stripe_subscription_id: stripeSubId,
//         },
//       );
//       if (error) {
//         throw error;
//       }
//       return data;
//     },
//     onSuccess: () => {
//       toast.success(tPath('activePlanBlock.cancelSuccess'));
//       // Инвалидируем кэш подписки, чтобы отразить статус "pending_cancel"
//       queryClient.invalidateQueries({
//         queryKey: ['userSubscription', user?.id],
//       });
//     },
//     onError: (error) => {
//       console.error('Ошибка отмены подписки:', error);
//       toast.error(
//         error.message || tPath('activePlanBlock.cancelSubscriptionErrorToast'),
//       );
//     },
//     onSettled: () => {
//       // Выполняется после успеха или ошибки мутации
//       setPlanToCancel(null);
//       setOpenCancelDialog(false);
//     },
//   });

//   useEffect(() => {
//     const handleSubscriptionRefresh = () => {
//       refetchSubscription(); // Вызываем refetch из useQuery
//     };
//     window.addEventListener(
//       'refresh-user-subscription',
//       handleSubscriptionRefresh,
//     );
//     return () => {
//       window.removeEventListener(
//         'refresh-user-subscription',
//         handleSubscriptionRefresh,
//       );
//     };
//   }, [refetchSubscription]); // Зависимость от функции refetchSubscription

//   // Определяем флаги загрузки для кнопок, используя состояния мутаций
//   const isSubscribingMedium =
//     subscribeMutation.isPending && subscribeMutation.variables === 'medium';
//   const isSubscribingPremium =
//     subscribeMutation.isPending && subscribeMutation.variables === 'premium';
//   const isCurrentlyCancelling = cancelMutation.isPending;

//   // Отображение загрузки при начальной загрузке пользователя или подписки
//   if (loadingUser || loadingSubscription) {
//     return (
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           minHeight: '200px',
//         }}
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   // Вспомогательные функции, теперь с правильной типизацией userSubscription
//   const isPlanActive = (planType: 'medium' | 'premium') => {
//     return (
//       userSubscription &&
//       userSubscription.plan === planType &&
//       userSubscription.status === 'active'
//     );
//   };

//   const isPlanPendingCancel = (planType: 'medium' | 'premium') => {
//     return (
//       userSubscription &&
//       userSubscription.plan === planType &&
//       userSubscription.status === 'pending_cancel'
//     );
//   };

//   const handleSwitchPlan = (targetPlan: 'medium' | 'premium') => {
//     setSwitchPlanTarget(targetPlan);
//     setShowSwitchPlanModal(true);
//   };

//   const handleSubscribeClick = (type: 'medium' | 'premium') => {
//     if (isPlanActive(type)) {
//       setPlanToCancel(type);
//       setOpenCancelDialog(true);
//       toast.error(tPath('activePlanBlock.alreadySubscribedToast'));
//       return;
//     }
//     if (isPlanPendingCancel(type)) {
//       toast.error(tPath('alreadyPendingCancelToast'));
//       return;
//     }
//     subscribeMutation.mutate(type);
//   };

//   const handleConfirmCancel = async () => {
//     if (!user || !userSubscription || !planToCancel) {
//       handleCloseCancelDialog();
//       toast.error(tPath('activePlanBlock.invalidCancelDataToast'));
//       return;
//     }
//     if (!isPlanActive(planToCancel)) {
//       handleCloseCancelDialog();
//       toast.success(tPath('activePlanBlock.planNotActiveForCancelToast'));
//       return;
//     }

//     cancelMutation.mutate({
//       userId: user.id,
//       stripeSubId: userSubscription.stripe_sub_id,
//     });
//   };

//   const handleCloseCancelDialog = () => {
//     setOpenCancelDialog(false);
//     setPlanToCancel(null);
//     toast.success(tPath('activePlanBlock.cancelOperationDismissed'));
//   };

//   const handleSwitchPlanConfirm = () => {
//     setShowSwitchPlanModal(false);
//     if (switchPlanTarget) {
//       queryClient.setQueryData(
//         ['userSubscription', user?.id],
//         (oldData: Subscription | null | undefined) => {
//           if (oldData) {
//             return {
//               ...oldData,
//               pending_plan: switchPlanTarget,
//             };
//           }
//           return oldData;
//         },
//       );

//       subscribeMutation.mutate(switchPlanTarget);
//       toast.success(tPath('activePlanBlock.switchPlanInitiatedToast'));
//       setSwitchPlanTarget(null);
//     } else {
//       toast.error(tPath('activePlanBlock.invalidSwitchTargetToast'));
//     }
//   };

//   const handleSwitchPlanCancel = () => {
//     setShowSwitchPlanModal(false);
//     setSwitchPlanTarget(null);
//     toast.success(tPath('activePlanBlock.switchPlanOperationDismissed'));
//   };

//   return (
//     <Box sx={{ maxWidth: 'md', mx: 'auto', py: 4, px: 2 }}>
//       <Typography variant="h4" component="h1" align="center" gutterBottom>
//         {t('title')}
//       </Typography>

//       <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mt={4}>
//         {/* Medium Plan */}
//         <Card
//           sx={{
//             flex: 1,
//             bgcolor: 'white',
//             opacity: isPlanActive('medium') ? 0.7 : 1,
//             border: isPlanActive('medium')
//               ? `1px solid ${theme.palette.success.main}`
//               : '1px solid #e0e0e0',
//             boxShadow: isPlanActive('medium')
//               ? theme.shadows[8]
//               : theme.shadows[1],
//             transition: 'all 0.3s ease-in-out',
//             color: 'text.primary',
//             borderRadius: 4,
//           }}
//         >
//           <CardContent>
//             <Typography variant="h5" component="h2" gutterBottom>
//               {t('medium.title')}
//             </Typography>
//             <Typography variant="h3" component="div" gutterBottom>
//               €5
//               <Typography
//                 component="span"
//                 variant="body1"
//                 color="text.secondary"
//               >
//                 /month
//               </Typography>
//             </Typography>
//             <Divider sx={{ my: 2 }} />
//             <Stack spacing={1} mb={3}>
//               <Typography>✓ {t('medium.features.1')}</Typography>
//             </Stack>
//             <Button
//               fullWidth
//               variant={isPlanActive('medium') ? 'outlined' : 'contained'}
//               color={
//                 isPlanActive('medium') || isPlanPendingCancel('medium')
//                   ? 'inherit'
//                   : 'primary'
//               }
//               onClick={() => {
//                 if (isPlanActive('medium') || isSwitchLocked) return;
//                 if (isPlanActive('premium')) {
//                   handleSwitchPlan('medium');
//                   return;
//                 }
//                 handleSubscribeClick('medium');
//               }}
//               // --- Исправленный пропс 'disabled' ---
//               disabled={
//                 !!isSwitchLocked || // Приводим к булеву
//                 !!isPlanActive('medium') || // Приводим к булеву
//                 !!isSubscribingMedium || // Приводим к булеву
//                 !!isPlanPendingCancel('medium') || // Приводим к булеву
//                 !!(isPlanActive('medium') && isCurrentlyCancelling) // Приводим к булеву
//               }
//               startIcon={
//                 isSubscribingMedium || isCurrentlyCancelling ? (
//                   <CircularProgress size={20} />
//                 ) : null
//               }
//               sx={{
//                 '&.Mui-disabled': {
//                   opacity: 0.6,
//                   ...(isPlanActive('medium') || isPlanPendingCancel('medium')
//                     ? {
//                         backgroundColor: 'black',
//                         color: 'white',
//                         '&:hover': {
//                           backgroundColor: 'rgba(0,0,0,0.85)',
//                         },
//                       }
//                     : {}),
//                 },
//               }}
//             >
//               {isSubscribingMedium || isCurrentlyCancelling
//                 ? t('processing')
//                 : isPlanActive('medium')
//                   ? t('alreadySubscribed')
//                   : isPlanPendingCancel('medium')
//                     ? t('pendingCancellation')
//                     : t('medium.cta')}
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Premium Plan */}
//         <Card
//           sx={{
//             flex: 1,
//             bgcolor: 'white',
//             opacity: isPlanActive('premium') ? 0.7 : 1,
//             border: isPlanActive('premium')
//               ? `1px solid ${theme.palette.success.main}`
//               : '1px solid #e0e0e0',
//             boxShadow: isPlanActive('premium')
//               ? theme.shadows[8]
//               : theme.shadows[1],
//             transition: 'all 0.3s ease-in-out',
//             color: 'text.primary',
//             borderRadius: 4,
//           }}
//         >
//           <CardContent>
//             <Typography variant="h5" component="h2" gutterBottom>
//               {t('premium.title')}
//             </Typography>
//             <Typography variant="h3" component="div" gutterBottom>
//               €10
//               <Typography
//                 component="span"
//                 variant="body1"
//                 color="text.secondary"
//               >
//                 /month
//               </Typography>
//             </Typography>
//             <Divider sx={{ my: 2 }} />
//             <Stack spacing={1} mb={3}>
//               <Typography>✓ {t('premium.features.1')}</Typography>
//             </Stack>
//             <Button
//               fullWidth
//               variant={isPlanActive('premium') ? 'outlined' : 'contained'}
//               color={
//                 isPlanActive('premium') || isPlanPendingCancel('premium')
//                   ? 'inherit'
//                   : 'success'
//               }
//               onClick={() => {
//                 if (isPlanActive('premium') || isSwitchLocked) return;
//                 if (isPlanActive('medium')) {
//                   handleSwitchPlan('premium');
//                   return;
//                 }
//                 handleSubscribeClick('premium');
//               }}
//               // --- Исправленный пропс 'disabled' ---
//               disabled={
//                 !!isSwitchLocked || // Приводим к булеву
//                 !!isPlanActive('premium') || // Приводим к булеву
//                 !!isSubscribingPremium || // Приводим к булеву
//                 !!isPlanPendingCancel('premium') || // Приводим к булеву
//                 !!(isPlanActive('premium') && isCurrentlyCancelling) // Приводим к булеву
//               }
//               startIcon={
//                 isSubscribingPremium || isCurrentlyCancelling ? (
//                   <CircularProgress size={20} />
//                 ) : null
//               }
//               sx={{
//                 '&.Mui-disabled': {
//                   opacity: 0.6,
//                   ...(isPlanActive('premium') || isPlanPendingCancel('premium')
//                     ? {
//                         backgroundColor: 'black',
//                         color: 'white',
//                         '&:hover': {
//                           backgroundColor: 'rgba(0,0,0,0.85)',
//                         },
//                       }
//                     : {}),
//                 },
//               }}
//             >
//               {isSubscribingPremium || isCurrentlyCancelling
//                 ? t('processing')
//                 : isPlanActive('premium')
//                   ? t('alreadySubscribed')
//                   : isPlanPendingCancel('premium')
//                     ? t('pendingCancellation')
//                     : t('premium.cta')}
//             </Button>
//           </CardContent>
//         </Card>
//       </Stack>

//       {/* Сообщение о лимите смены тарифа */}
//       {isSwitchLocked && userSubscription && (
//         <Box
//           sx={{
//             mt: 3,
//             mb: 2,
//             px: 3,
//             py: 2,
//             borderRadius: 2,
//             bgcolor: 'orange',
//             color: 'white',
//             fontWeight: 'bold',
//             textAlign: 'center',
//           }}
//         >
//           {t('switchLockedMessage', {
//             date: userSubscription.current_period_end
//               ? new Date(
//                   userSubscription.current_period_end,
//                 ).toLocaleDateString()
//               : '—',
//           })}
//         </Box>
//       )}

//       <Typography variant="body2" color="text.secondary" align="center" mt={4}>
//         {t('notice')}
//       </Typography>

//       {/* --- Модальное окно подтверждения отмены (Используем GenericDialog) --- */}
//       <GenericDialog
//         open={openCancelDialog}
//         onClose={handleCloseCancelDialog}
//         title={t('confirmCancellationTitle')}
//         description={t('confirmCancellationMessage')}
//         confirmButtonText={t('yesButton')}
//         cancelButtonText={t('noButton')}
//         onConfirm={handleConfirmCancel}
//         isConfirming={isCurrentlyCancelling}
//         confirmButtonColor="error"
//         dialogBackgroundColor="#7991c0ff"
//       />

//       {/* --- Модалка подтверждения перехода между тарифами (Используем GenericDialog) --- */}
//       <GenericDialog
//         open={showSwitchPlanModal}
//         onClose={handleSwitchPlanCancel}
//         title={t('switchPlanConfirmTitle')}
//         description={t('switchPlanConfirmMessage')}
//         confirmButtonText={t('yesButton')}
//         cancelButtonText={t('noButton')}
//         onConfirm={handleSwitchPlanConfirm}
//         confirmButtonColor="success"
//         dialogBackgroundColor="#7991c0ff"
//       />
//     </Box>
//   );
// }
