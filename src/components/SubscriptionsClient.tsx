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
// import { supabase } from 'src/lib/supabase/supabaseClient';
// import { useTranslations } from 'next-intl';
// import { useTheme } from '@mui/material/styles';
// import { useUser } from 'src/hooks/useUser';
// // Импорт GenericDialog вместо прямых импортов Dialog из MUI
// import GenericDialog from 'src/components/ConfirmationDialog';

// // Импорт toast из react-hot-toast
// import toast from 'react-hot-toast';

// export default function SubscriptionsClient() {
//   const t = useTranslations('Subscriptions');
//   const tPath = useTranslations('YourPath');

//   const router = useRouter();
//   const theme = useTheme();
//   const { user, loading: loadingUser } = useUser();
//   const [isLoading, setIsLoading] = useState<'medium' | 'premium' | null>(null);

//   const [userSubscription, setUserSubscription] = useState<any | null>(null);
//   const [loadingSubscription, setLoadingSubscription] = useState(true);

//   const [openCancelDialog, setOpenCancelDialog] = useState(false);
//   const [planToCancel, setPlanToCancel] = useState<'medium' | 'premium' | null>(
//     null,
//   );
//   const [isCancelling, setIsCancelling] = useState(false);

//   const [showSwitchPlanModal, setShowSwitchPlanModal] = useState(false);
//   const [switchPlanTarget, setSwitchPlanTarget] = useState<
//     'medium' | 'premium' | null
//   >(null);

//   // === Блокировка смены тарифа при pending_plan ===
//   const isSwitchLocked = !!(
//     userSubscription &&
//     userSubscription.plan &&
//     userSubscription.pending_plan
//   );

//   useEffect(() => {
//     if (!user) {
//       setUserSubscription(null);
//       setLoadingSubscription(false);
//       return;
//     }

//     const fetchUserSubscription = async () => {
//       setLoadingSubscription(true);
//       try {
//         const { data: subscriptionData, error } = await supabase
//           .from('subscriptions')
//           .select(
//             'stripe_sub_id, user_id, status, plan, pending_plan, current_period_end',
//           )
//           .eq('user_id', user.id)
//           .maybeSingle();

//         if (error && error.code !== 'PGRST116') {
//           throw error;
//         }

//         setUserSubscription(subscriptionData || null);
//       } catch (error) {
//         setUserSubscription(null);
//         // ТОСТЕР: Ошибка при загрузке информации о подписке
//         toast.error(tPath('activePlanBlock.fetchSubscriptionErrorToast'));
//       } finally {
//         setLoadingSubscription(false);
//       }
//     };

//     fetchUserSubscription();

//     const handleSubscriptionRefresh = () => fetchUserSubscription();
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
//   }, [user]);

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

//   const handleSubscribe = async (type: 'medium' | 'premium') => {
//     if (isPlanActive(type)) {
//       setPlanToCancel(type);
//       setOpenCancelDialog(true);
//       // ТОСТЕР: Пользователь уже подписан на этот план
//       toast.error(tPath('activePlanBlock.alreadySubscribedToast'));
//       return;
//     }
//     if (isPlanPendingCancel(type)) {
//       // ТОСТЕР: План уже в процессе отмены
//       toast.error(tPath('alreadyPendingCancelToast'));
//       return;
//     }
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();
//     if (!session) {
//       router.push('/login');
//       // ТОСТЕР: Требуется авторизация
//       toast.error(tPath('authRequiredToast'));
//       return;
//     }
//     setIsLoading(type);
//     try {
//       const res = await fetch('/api/checkout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${session.access_token}`,
//         },
//         body: JSON.stringify({ type: `subscription_${type}` }),
//       });
//       const { url } = await res.json();
//       if (url) {
//         // ТОСТЕР: Успешная генерация URL, перенаправление
//         toast.success(tPath('activePlanBlock.redirectToCheckoutToast'));
//         window.location.href = url;
//       }
//     } catch (error) {
//       // ТОСТЕР: Ошибка при попытке подписки
//       toast.error(tPath('activePlanBlock.subscribeErrorToast'));
//     } finally {
//       setIsLoading(null);
//     }
//   };

//   const handleConfirmCancel = async () => {
//     if (!user || !userSubscription || !planToCancel) {
//       handleCloseCancelDialog();
//       // ТОСТЕР: Некорректные данные для отмены
//       toast.error(tPath('activePlanBlock.invalidCancelDataToast'));
//       return;
//     }
//     if (!isPlanActive(planToCancel)) {
//       handleCloseCancelDialog();
//       // ТОСТЕР: План не активен для отмены
//       toast.success(tPath('activePlanBlock.planNotActiveForCancelToast'));
//       return;
//     }
//     setOpenCancelDialog(false);
//     setIsCancelling(true);
//     try {
//       const { data, error } = await supabase.rpc(
//         'cancel_subscription_at_period_end',
//         {
//           p_user_id: user.id,
//           p_stripe_subscription_id: userSubscription.stripe_sub_id,
//         },
//       );

//       if (error) {
//         // ТОСТЕР: Ошибка при отмене подписки на сервере
//         toast.error(tPath('activePlanBlock.cancelSubscriptionErrorToast'));
//       } else {
//         // ТОСТЕР: Успешное планирование отмены
//         toast.success(tPath('activePlanBlock.cancelSuccess'));
//         window.dispatchEvent(new Event('refresh-user-subscription'));
//       }
//     } catch (error) {
//       // ТОСТЕР: Сетевая ошибка при отмене подписки
//       toast.error(tPath('activePlanBlock.networkErrorCancelSubscriptionToast'));
//     } finally {
//       setIsCancelling(false);
//       setPlanToCancel(null);
//     }
//   };

//   const handleCloseCancelDialog = () => {
//     setOpenCancelDialog(false);
//     setPlanToCancel(null);
//     // ТОСТЕР: Отмена операции по отписке
//     toast.success(tPath('activePlanBlock.cancelOperationDismissed'));
//   };

//   const handleSwitchPlanConfirm = () => {
//     setShowSwitchPlanModal(false);
//     if (switchPlanTarget) {
//       // ЛОКАЛЬНО устанавливаем pending_plan для мгновенного блокирования
//       setUserSubscription((prev: any) => ({
//         ...prev,
//         pending_plan: switchPlanTarget,
//       }));
//       // === ЭТА СТРОКА ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ, КАК В ВАШЕМ ОРИГИНАЛЬНОМ КОДЕ ===
//       handleSubscribe(switchPlanTarget);
//       // ТОСТЕР: Запрос на смену тарифа принят (далее будет перенаправление на оплату, если логика handleSubscribe это подразумевает)
//       toast.success(tPath('activePlanBlock.switchPlanInitiatedToast'));
//       setSwitchPlanTarget(null);
//     } else {
//       // ТОСТЕР: Неверная цель для смены тарифа
//       toast.error(tPath('activePlanBlock.invalidSwitchTargetToast'));
//     }
//   };

//   const handleSwitchPlanCancel = () => {
//     setShowSwitchPlanModal(false);
//     setSwitchPlanTarget(null);
//     // ТОСТЕР: Отмена операции по смене тарифа
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
//               €19
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
//               <Typography>✓ {t('medium.features.2')}</Typography>
//               <Typography>✓ {t('medium.features.3')}</Typography>
//               <Typography>✓ {t('medium.features.4')}</Typography>
//               <Typography>✓ {t('medium.features.5')}</Typography>
//               <Typography>✓ {t('medium.features.6')}</Typography>
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
//                 handleSubscribe('medium');
//               }}
//               disabled={
//                 isSwitchLocked ||
//                 isPlanActive('medium') ||
//                 isLoading === 'medium' ||
//                 isPlanPendingCancel('medium') ||
//                 (isPlanActive('medium') && isCancelling)
//               }
//               startIcon={
//                 isLoading === 'medium' || isCancelling ? (
//                   <CircularProgress size={20} />
//                 ) : null
//               }
//               sx={{
//                 '&.Mui-disabled': {
//                   opacity: 0.6,
//                   ...((isPlanActive('medium') ||
//                     isPlanPendingCancel('medium')) && {
//                     backgroundColor: 'black',
//                     color: 'white',
//                     '&:hover': {
//                       backgroundColor: 'rgba(0,0,0,0.85)',
//                     },
//                   }),
//                 },
//               }}
//             >
//               {isLoading === 'medium' || isCancelling
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
//               €34
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
//               <Typography>✓ {t('premium.features.2')}</Typography>
//               <Typography>✓ {t('premium.features.3')}</Typography>
//               <Typography>✓ {t('premium.features.4')}</Typography>
//               <Typography>✓ {t('premium.features.5')}</Typography>
//               <Typography>✓ {t('premium.features.6')}</Typography>
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
//                 handleSubscribe('premium');
//               }}
//               disabled={
//                 isSwitchLocked ||
//                 isPlanActive('premium') ||
//                 isLoading === 'premium' ||
//                 isPlanPendingCancel('premium') ||
//                 (isPlanActive('premium') && isCancelling)
//               }
//               startIcon={
//                 isLoading === 'premium' || isCancelling ? (
//                   <CircularProgress size={20} />
//                 ) : null
//               }
//               sx={{
//                 '&.Mui-disabled': {
//                   opacity: 0.6,
//                   ...((isPlanActive('premium') ||
//                     isPlanPendingCancel('premium')) && {
//                     backgroundColor: 'black',
//                     color: 'white',
//                     '&:hover': {
//                       backgroundColor: 'rgba(0,0,0,0.85)',
//                     },
//                   }),
//                 },
//               }}
//             >
//               {isLoading === 'premium' || isCancelling
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
//       {isSwitchLocked && (
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
//         isConfirming={isCancelling}
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
  Chip,
  Paper,
  useMediaQuery,
  Avatar,
  Badge,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { useTranslations } from 'next-intl';
import { useTheme } from '@mui/material/styles';
import { useUser } from 'src/hooks/useUser';
import GenericDialog from 'src/components/ConfirmationDialog';
import toast from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarsIcon from '@mui/icons-material/Stars';
import BoltIcon from '@mui/icons-material/Bolt';
import DiamondIcon from '@mui/icons-material/Diamond';
import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanguageIcon from '@mui/icons-material/Language';
import { keyframes } from '@emotion/react';

const pulseGradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const glowEffect = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
  }
`;

export default function SubscriptionsClient() {
  const t = useTranslations('Subscriptions');
  const tPath = useTranslations('YourPath');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, loading: loadingUser } = useUser();
  const [isLoading, setIsLoading] = useState<'medium' | 'premium' | null>(null);
  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [planToCancel, setPlanToCancel] = useState<'medium' | 'premium' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSwitchPlanModal, setShowSwitchPlanModal] = useState(false);
  const [switchPlanTarget, setSwitchPlanTarget] = useState<'medium' | 'premium' | null>(null);
  
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
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
        }}
      >
        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ 
              color: '#6366f1',
              animation: `${glowEffect} 2s ease-in-out infinite`
            }} 
          />
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              color: '#94a3b8',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Loading your subscription...
          </Typography>
        </Box>
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
      toast.error(tPath('activePlanBlock.alreadySubscribedToast'));
      return;
    }
    if (isPlanPendingCancel(type)) {
      toast.error(tPath('alreadyPendingCancelToast'));
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
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
        toast.success(tPath('activePlanBlock.redirectToCheckoutToast'));
        window.location.href = url;
      }
    } catch (error) {
      toast.error(tPath('activePlanBlock.subscribeErrorToast'));
    } finally {
      setIsLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!user || !userSubscription || !planToCancel) {
      handleCloseCancelDialog();
      toast.error(tPath('activePlanBlock.invalidCancelDataToast'));
      return;
    }
    if (!isPlanActive(planToCancel)) {
      handleCloseCancelDialog();
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
        toast.error(tPath('activePlanBlock.cancelSubscriptionErrorToast'));
      } else {
        toast.success(tPath('activePlanBlock.cancelSuccess'));
        window.dispatchEvent(new Event('refresh-user-subscription'));
      }
    } catch (error) {
      toast.error(tPath('activePlanBlock.networkErrorCancelSubscriptionToast'));
    } finally {
      setIsCancelling(false);
      setPlanToCancel(null);
    }
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setPlanToCancel(null);
    toast.success(tPath('activePlanBlock.cancelOperationDismissed'));
  };

  const handleSwitchPlanConfirm = () => {
    setShowSwitchPlanModal(false);
    if (switchPlanTarget) {
      setUserSubscription((prev: any) => ({
        ...prev,
        pending_plan: switchPlanTarget,
      }));
      handleSubscribe(switchPlanTarget);
      toast.success(tPath('activePlanBlock.switchPlanInitiatedToast'));
      setSwitchPlanTarget(null);
    } else {
      toast.error(tPath('activePlanBlock.invalidSwitchTargetToast'));
    }
  };

  const handleSwitchPlanCancel = () => {
    setShowSwitchPlanModal(false);
    setSwitchPlanTarget(null);
    toast.success(tPath('activePlanBlock.switchPlanOperationDismissed'));
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
      py: { xs: 2, md: 6 },
      px: { xs: 1, md: 2 }
    }}>
      {/* Animated Background Elements */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
        zIndex: 0,
        animation: `${floatAnimation} 20s ease-in-out infinite alternate`
      }} />
      
      <Box sx={{ 
        position: 'fixed',
        top: '20%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: 0,
        animation: `${pulseGradient} 15s ease infinite`
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: { xs: 3, md: 6 },
          position: 'relative'
        }}>
          <Chip
            icon={<BoltIcon />}
            label="CHOOSE YOUR POWER"
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              color: 'white',
              fontWeight: 900,
              fontSize: '10px',
              letterSpacing: '1px',
              mb: 3,
              px: 2,
              py: 1,
              animation: `${glowEffect} 2s ease-in-out infinite`
            }}
          />
          
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
              letterSpacing: '-0.5px'
            }}
          >
            {t('title')}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#94a3b8',
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 500,
              fontSize: { xs: '0.9rem', md: '1.1rem' }
            }}
          >
            Unlock the future of translation with AI-powered real-time subtitles and voice synthesis
          </Typography>
        </Box>

        {/* Plans Grid */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={4} 
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 6 }}
        >
          {/* Medium Plan */}
          <Box sx={{ 
            position: 'relative',
            width: { xs: '100%', md: '320px' },
            transform: isPlanActive('medium') ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)'
            }
          }}>
            {isPlanActive('medium') && (
              <Box sx={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                px: 3,
                py: 0.5,
                borderRadius: 20,
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                zIndex: 2,
                animation: `${glowEffect} 2s ease-in-out infinite`
              }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CheckCircleIcon fontSize="small" />
                  <span>ACTIVE PLAN</span>
                </Stack>
              </Box>
            )}
            
            <Card
              sx={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: `2px solid ${isPlanActive('medium') ? '#10b981' : 'rgba(99, 102, 241, 0.3)'}`,
                borderRadius: 4,
                overflow: 'visible',
                boxShadow: isPlanActive('medium') 
                  ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)' 
                  : '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.05))',
                  borderRadius: 4,
                  zIndex: 1,
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2, p: { xs: 2.5, md: 3 } }}>
                {/* Plan Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(99, 102, 241, 0.2)',
                    border: '2px solid rgba(99, 102, 241, 0.5)'
                  }}>
                    <BoltIcon sx={{ color: '#6366f1' }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {t('medium.title')}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#94a3b8',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                      }}
                    >
                      Essential AI Translation
                    </Typography>
                  </Box>
                </Stack>

                {/* Price */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={0.5}>
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '3rem', md: '3.5rem' },
                        lineHeight: 1
                      }}
                    >
                      €19
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#94a3b8',
                        fontWeight: 600
                      }}
                    >
                      /month
                    </Typography>
                  </Stack>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      display: 'block',
                      mt: 0.5,
                      fontWeight: 600
                    }}
                  >
                    billed monthly • cancel anytime
                  </Typography>
                </Box>

                <Divider sx={{ 
                  my: 3, 
                  background: 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), transparent)',
                  height: '2px'
                }} />

                {/* Features */}
                <Stack spacing={2} mb={4}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <Stack key={num} direction="row" spacing={2} alignItems="flex-start">
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: '18px', mt: 0.25, flexShrink: 0 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#cbd5e1',
                          fontWeight: 500,
                          fontSize: '0.9rem'
                        }}
                      >
                        {t(`medium.features.${num}`)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* CTA Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={
                    isSwitchLocked ||
                    isPlanActive('medium') ||
                    isLoading === 'medium' ||
                    isPlanPendingCancel('medium')
                  }
                  onClick={() => {
                    if (isPlanActive('medium') || isSwitchLocked) return;
                    if (isPlanActive('premium')) {
                      handleSwitchPlan('medium');
                      return;
                    }
                    handleSubscribe('medium');
                  }}
                  startIcon={
                    isLoading === 'medium' ? (
                      <CircularProgress size={20} />
                    ) : isPlanActive('medium') ? (
                      <CheckCircleIcon />
                    ) : null
                  }
                  sx={{
                    background: isPlanActive('medium') 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '15px',
                    letterSpacing: '0.5px',
                    py: 1.5,
                    borderRadius: 3,
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: '0.5s'
                    },
                    '&:hover::before': {
                      left: '100%'
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)'
                    },
                    '&.Mui-disabled': {
                      background: '#334155',
                      color: '#94a3b8',
                      opacity: 0.8
                    }
                  }}
                >
                  {isLoading === 'medium'
                    ? 'PROCESSING...'
                    : isPlanActive('medium')
                      ? 'ACTIVE PLAN'
                      : isPlanPendingCancel('medium')
                        ? 'PENDING CANCELLATION'
                        : 'GET STARTED'}
                </Button>

                {isPlanPendingCancel('medium') && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'center',
                      mt: 1,
                      color: '#f59e0b',
                      fontWeight: 600
                    }}
                  >
                    Cancels at end of billing period
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Premium Plan */}
          <Box sx={{ 
            position: 'relative',
            width: { xs: '100%', md: '350px' },
            transform: isPlanActive('premium') ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-10px) scale(1.05)'
            }
          }}>
            {/* Popular Badge */}
            <Paper
              sx={{
                position: 'absolute',
                top: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                color: 'white',
                px: 4,
                py: 1,
                borderRadius: 20,
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '1px',
                zIndex: 2,
                animation: `${floatAnimation} 3s ease-in-out infinite`,
                boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <StarsIcon fontSize="small" />
                <span>MOST POPULAR</span>
              </Stack>
            </Paper>

            {isPlanActive('premium') && (
              <Box sx={{
                position: 'absolute',
                top: 25,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                px: 3,
                py: 0.5,
                borderRadius: 20,
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                zIndex: 2,
                animation: `${glowEffect} 2s ease-in-out infinite`
              }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CheckCircleIcon fontSize="small" />
                  <span>ACTIVE PLAN</span>
                </Stack>
              </Box>
            )}

            <Card
              sx={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: `3px solid ${isPlanActive('premium') ? '#10b981' : 'rgba(236, 72, 153, 0.5)'}`,
                borderRadius: 4,
                overflow: 'visible',
                boxShadow: isPlanActive('premium')
                  ? '0 30px 60px -12px rgba(16, 185, 129, 0.3)' 
                  : '0 30px 60px -12px rgba(236, 72, 153, 0.4)',
                backdropFilter: 'blur(20px)',
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.1))',
                  borderRadius: 4,
                  zIndex: 1,
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 3.5 } }}>
                {/* Plan Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(236, 72, 153, 0.2)',
                    border: '2px solid rgba(236, 72, 153, 0.5)'
                  }}>
                    <DiamondIcon sx={{ color: '#ec4899' }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {t('premium.title')}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#94a3b8',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                      }}
                    >
                      Ultimate AI Experience
                    </Typography>
                  </Box>
                </Stack>

                {/* Price */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))',
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(to right, transparent, #ec4899, transparent)',
                    animation: `${pulseGradient} 2s ease-in-out infinite`
                  }} />
                  <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={0.5}>
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '3.5rem', md: '4rem' },
                        lineHeight: 1
                      }}
                    >
                      €34
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#94a3b8',
                        fontWeight: 600
                      }}
                    >
                      /month
                    </Typography>
                  </Stack>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      display: 'block',
                      mt: 0.5,
                      fontWeight: 600
                    }}
                  >
                    billed monthly • cancel anytime
                  </Typography>
                </Box>

                <Divider sx={{ 
                  my: 3, 
                  background: 'linear-gradient(to right, transparent, rgba(236, 72, 153, 0.4), transparent)',
                  height: '2px'
                }} />

                {/* Features */}
                <Stack spacing={2} mb={4}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <Stack key={num} direction="row" spacing={2} alignItems="flex-start">
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: '18px', mt: 0.25, flexShrink: 0 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#cbd5e1',
                          fontWeight: 500,
                          fontSize: '0.9rem'
                        }}
                      >
                        {t(`premium.features.${num}`)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* CTA Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={
                    isSwitchLocked ||
                    isPlanActive('premium') ||
                    isLoading === 'premium' ||
                    isPlanPendingCancel('premium')
                  }
                  onClick={() => {
                    if (isPlanActive('premium') || isSwitchLocked) return;
                    if (isPlanActive('medium')) {
                      handleSwitchPlan('premium');
                      return;
                    }
                    handleSubscribe('premium');
                  }}
                  startIcon={
                    isLoading === 'premium' ? (
                      <CircularProgress size={20} />
                    ) : isPlanActive('premium') ? (
                      <CheckCircleIcon />
                    ) : null
                  }
                  sx={{
                    background: isPlanActive('premium')
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'linear-gradient(135deg, #ec4899, #d946ef)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '16px',
                    letterSpacing: '0.5px',
                    py: 1.8,
                    borderRadius: 3,
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      transition: '0.5s'
                    },
                    '&:hover::before': {
                      left: '100%'
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 25px 50px rgba(236, 72, 153, 0.5)'
                    },
                    '&.Mui-disabled': {
                      background: '#334155',
                      color: '#94a3b8',
                      opacity: 0.8
                    }
                  }}
                >
                  {isLoading === 'premium'
                    ? 'PROCESSING...'
                    : isPlanActive('premium')
                      ? 'ACTIVE PLAN'
                      : isPlanPendingCancel('premium')
                        ? 'PENDING CANCELLATION'
                        : 'GO PREMIUM'}
                </Button>

                {isPlanPendingCancel('premium') && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'center',
                      mt: 1,
                      color: '#f59e0b',
                      fontWeight: 600
                    }}
                  >
                    Cancels at end of billing period
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>

        {/* Feature Highlights */}
        <Box sx={{ 
          maxWidth: '800px', 
          mx: 'auto', 
          mt: 8,
          mb: 4 
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 900,
              color: 'white',
              mb: 4,
              fontSize: { xs: '1.3rem', md: '1.8rem' },
              letterSpacing: '-0.5px'
            }}
          >
            Why Choose Translateme?
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3} 
            justifyContent="center"
          >
            {[
              { icon: <TranslateIcon />, title: 'Real-time AI', desc: 'Instant translation as you speak' },
              { icon: <SubtitlesIcon />, title: 'Smart Subtitles', desc: 'Adaptive font & positioning' },
              { icon: <VolumeUpIcon />, title: 'Voice Cloning', desc: 'Natural AI-generated voices' },
              { icon: <AccessTimeIcon />, title: 'No Limits', desc: '24/7 translation available' },
              { icon: <LanguageIcon />, title: '50+ Languages', desc: 'Global coverage' }
            ].map((feature, index) => (
              <Paper
                key={index}
                sx={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 3,
                  p: 2.5,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    boxShadow: '0 15px 30px rgba(99, 102, 241, 0.2)'
                  }
                }}
              >
                <Box sx={{ 
                  display: 'inline-flex',
                  p: 1.5,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
                  mb: 2
                }}>
                  <Box sx={{ 
                    color: '#6366f1',
                    fontSize: '24px'
                  }}>
                    {feature.icon}
                  </Box>
                </Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 900,
                    color: 'white',
                    mb: 0.5
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontWeight: 500
                  }}
                >
                  {feature.desc}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Switch Lock Message */}
        {isSwitchLocked && (
          <Box
            sx={{
              maxWidth: '600px',
              mx: 'auto',
              mt: 4,
              mb: 3,
              px: 3,
              py: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontWeight: 'bold',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            ⚠️ Plan switch in progress. Your new plan will activate on {userSubscription.current_period_end
              ? new Date(userSubscription.current_period_end).toLocaleDateString()
              : 'the next billing cycle'}.
          </Box>
        )}

        {/* Footer Note */}
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            color: '#64748b',
            maxWidth: '600px',
            mx: 'auto',
            mt: 4,
            fontWeight: 500,
            fontSize: '0.85rem'
          }}
        >
          All plans include a 14-day money-back guarantee. No long-term contracts, cancel anytime.
          *Usage limits apply per calendar month.
        </Typography>
      </Box>

      {/* Modal Dialogs */}
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