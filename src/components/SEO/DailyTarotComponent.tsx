// 'use client';

// import React from 'react';
// import { Box, Container, Typography, Button, Stack, Divider } from '@mui/material';
// import { motion } from 'framer-motion';
// import { useTranslations } from 'next-intl';

// import { CardSpotlight } from '../daily/CardSpotlight';
// import { FocusRitual } from '../daily/FocusRitual';
// import { Compass } from '../daily/Compass';
// import { ActionGenerator } from '../daily/ActionGenerator';
// import { WeekConstellation } from '../daily/WeekConstellation';
// import { Journal } from '../daily/Journal';
// import { AffirmationPoster } from '../daily/AffirmationPoster';
// import { Faq } from '../daily/Faq';
// import { useTodayCard } from '../daily/useTodayCard';

// export const DailyTarotComponent = () => {
//   const t = useTranslations('Daily');
//   const { todayCard, isLoading } = useTodayCard();

//   return (
//     <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 10 }}>
//       {/* SEO H1 (скрытый для скринридеров) */}
//       <h1 style={{
//         position: 'absolute', width: 1, height: 1, margin: -1, border: 0, padding: 0,
//         overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
//       }}>
//         {t('seo_h1', { default: 'Daily Tarot — focus mode' })}
//       </h1>

//       {/* HERO */}
//       <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
//         <Typography
//           variant="h2"
//           fontWeight="bold"
//           gutterBottom
//           sx={{
//             fontSize: { xs: '2.5rem', sm: '3.5rem' },
//             letterSpacing: 1,
//             lineHeight: 1.2,
//             textAlign: 'center',
//             background: '#D8B7DD',
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent',
//             mb: 2,
//           }}
//         >
//           {t('title', { default: 'Карта дня: ясность и один шаг вперёд' })}
//         </Typography>

//         <Typography
//           variant="body1"
//           sx={{
//             mb: 3,
//             fontSize: '1.1rem',
//             lineHeight: 1.7,
//             textAlign: 'center',
//             color: 'rgba(255,255,255,0.9)',
//           }}
//         >
//           {t('intro', { default: 'Фокус на уже выбранной карте: символы, действие 1%, ритуал внимания и трекинг прогресса.' })}
//         </Typography>

//         <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
//           <Button
//             variant="contained"
//             onClick={() => {
//               const el = document.getElementById('spotlight');
//               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }}
//             sx={{
//               py: 1.5, px: 3, borderRadius: '24px',
//               background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)'
//             }}
//           >
//             {t('cta_go_to_reading', { default: 'Перейти к чтению' })}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={() => {
//               const el = document.getElementById('ritual');
//               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }}
//             sx={{ py: 1.5, px: 3, borderRadius: '24px', borderColor: 'rgba(216,183,221,.6)', color: '#fff' }}
//           >
//             {t('cta_focus_ritual', { default: '30-сек ритуал фокуса' })}
//           </Button>

//           <Button
//             variant="text"
//             onClick={() => (window.location.href = '/')}
//             sx={{ py: 1.5, px: 3, borderRadius: '24px', color: '#D8B7DD' }}
//           >
//             {t('cta_back_home', { default: 'На главную за картой' })}
//           </Button>
//         </Stack>
//       </motion.div>

//       {/* EMPTY STATE if no card */}
//       {!isLoading && !todayCard && (
//         <Box sx={{ textAlign: 'center', p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
//           <Typography sx={{ mb: 2, color: 'rgba(255,255,255,0.9)' }}>
//             {t('empty_text', { default: 'Сегодня карта ещё не выбрана. Выберите её на главной странице.' })}
//           </Typography>
//           <Button variant="contained" onClick={() => (window.location.href = '/')}>
//             {t('empty_cta', { default: 'Перейти на главную' })}
//           </Button>
//         </Box>
//       )}

//       {/* CONTENT when we have a card */}
//       {todayCard && (
//         <>
//           <Box id="spotlight" sx={{ mt: 4 }}>
//             <CardSpotlight card={todayCard} />
//           </Box>

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <Box id="compass">
//             <Compass card={todayCard} />
//           </Box>

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <ActionGenerator card={todayCard} />

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <Box id="ritual">
//             <FocusRitual />
//           </Box>

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <WeekConstellation />

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <Journal />

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <AffirmationPoster card={todayCard} />

//           <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

//           <Faq />
//         </>
//       )}
//     </Container>
//   );
// };

'use client';

import React from 'react';
import { Box, Container, Typography, Button, Stack, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { CardSpotlight } from '../daily/CardSpotlight';
import { FocusRitual } from '../daily/FocusRitual';
import { Compass } from '../daily/Compass';
import { ActionGenerator } from '../daily/ActionGenerator';
import { WeekConstellation } from '../daily/WeekConstellation';
import { Journal } from '../daily/Journal';
import { AffirmationPoster } from '../daily/AffirmationPoster';
import { Faq } from '../daily/Faq';
import { useAutoCard } from '../daily/useAutoCard';

export const DailyTarotComponent = () => {
  const t = useTranslations('Daily');
const { card: todayCard, isLoading } = useAutoCard();

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 10 }}>
      <h1 style={{
        position: 'absolute', width: 1, height: 1, margin: -1, border: 0, padding: 0,
        overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
      }}>
        {t('seo_h1')}
      </h1>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            letterSpacing: 1,
            lineHeight: 1.2,
            textAlign: 'center',
            background: '#D8B7DD',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          {t('title')}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            fontSize: '1.1rem',
            lineHeight: 1.7,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {t('intro')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          <Button
            variant="contained"
            onClick={() => document.getElementById('spotlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            sx={{ py: 1.5, px: 3, borderRadius: '24px', background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)' }}
          >
            {t('cta_go_to_reading')}
          </Button>

          <Button
            variant="outlined"
            onClick={() => document.getElementById('ritual')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            sx={{ py: 1.5, px: 3, borderRadius: '24px', borderColor: 'rgba(216,183,221,.6)', color: '#fff' }}
          >
            {t('cta_focus_ritual')}
          </Button>

          <Button
            variant="text"
            onClick={() => (window.location.href = '/')}
            sx={{ py: 1.5, px: 3, borderRadius: '24px', color: '#D8B7DD' }}
          >
            {t('cta_back_home')}
          </Button>
        </Stack>
      </motion.div>

      {!isLoading && !todayCard && (
        <Box sx={{ textAlign: 'center', p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography sx={{ mb: 2, color: 'rgba(255,255,255,0.9)' }}>
            {t('empty_text')}
          </Typography>
          <Button variant="contained" onClick={() => (window.location.href = '/')}>
            {t('empty_cta')}
          </Button>
        </Box>
      )}

      {todayCard && (
        <>
          <Box id="spotlight" sx={{ mt: 4 }}>
            <CardSpotlight card={todayCard} />
          </Box>

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Box id="compass">
            <Compass card={todayCard} />
          </Box>

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <ActionGenerator card={todayCard} />

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Box id="ritual">
            <FocusRitual />
          </Box>

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <WeekConstellation />

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Journal />

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <AffirmationPoster card={todayCard} />

          <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Faq />
        </>
      )}
    </Container>
  );
};
