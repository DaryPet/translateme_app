// 'use client';
// import React from 'react';
// import {
//   Box,
//   Container,
//   Typography,
//   Button,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
//   Chip,
//   Tooltip,
// } from '@mui/material';
// import { useTranslations } from 'next-intl';
// import { motion, type Variants, useInView } from 'framer-motion';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// // --- Вспомогательные компоненты (как у тебя было) ---

// // Стилизованный разделитель
// const ThemedDivider = () => (
//   <Divider sx={{
//     my: 6,
//     borderColor: 'rgba(255,255,255,0.1)',
//     '&::before, &::after': { borderColor: 'rgba(255,255,255,0.2)' },
//   }}>
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(216,183,221,0.6)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
//   </Divider>
// );

// // Стилизованный элемент списка с иконкой
// const ThemedListItem = ({ text }: { text: string }) => (
//   <ListItem sx={{ py: 0.5, px: 0 }}>
//     <ListItemIcon sx={{ minWidth: '32px', color: '#D8B7DD' }}>
//       <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
//     </ListItemIcon>
//     <ListItemText primary={text} sx={{ '& .MuiTypography-root': { lineHeight: 1.6 } }} />
//   </ListItem>
// );

// // ========================
// // ИНТЕРАКТИВНАЯ КАРТА (i18n + прод-фикс)
// // ========================
// type MapLabels = {
//   past: string;
//   present: string;
//   decision: string;
//   future: string;
//   advice: string;
//   hidden: string;
// };

// const ConstellationMap: React.FC<{ title: string; labels: MapLabels }> = ({ title, labels }) => {
//   const width = 1000;  // SVG viewBox ширина
//   const height = 360;  // SVG viewBox высота

//   // один наблюдатель на весь блок (устойчиво для Safari/прода)
//   const ref = React.useRef<HTMLDivElement | null>(null);
//   const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

//   // уникальные id для <defs>, чтобы не конфликтовали после SSR
//   const uid = React.useId();

//   const lineVariants: Variants = {
//     hidden: { pathLength: 0, opacity: 1 },
//     visible: (i: number) => ({
//       pathLength: 1,
//       opacity: 1,
//       transition: { duration: 1.1, ease: 'easeOut', delay: i * 0.08 }
//     })
//   };

//   const nodeVariants: Variants = {
//     hidden: { opacity: 0, scale: 0.85 },
//     visible: (i: number) => ({
//       opacity: 1,
//       scale: 1,
//       transition: { delay: 0.25 + i * 0.05 }
//     })
//   };

//   // Фиксированные координаты — подписи приходят из локали
//   const nodes = [
//     { id: 'past',    label: labels.past,    x: 8,  y: 38 },
//     { id: 'present', label: labels.present, x: 28, y: 22 },
//     { id: 'decision',label: labels.decision,x: 48, y: 45 },
//     { id: 'future',  label: labels.future,  x: 72, y: 28 },
//     { id: 'advice',  label: labels.advice,  x: 88, y: 54 },
//     { id: 'hidden',  label: labels.hidden,  x: 58, y: 70 },
//   ] as const;

//   const links: Array<[typeof nodes[number]['id'], typeof nodes[number]['id']]> = [
//     ['past','present'], ['present','decision'], ['decision','future'],
//     ['future','advice'], ['decision','hidden'], ['present','hidden']
//   ];

//   // Обёртка карты
//   const CardBox: React.FC<{children: React.ReactNode}> = ({ children }) => (
//     <Box sx={{
//       p: { xs: 2, sm: 3 },
//       borderRadius: 3,
//       background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.18))',
//       border: '1px solid rgba(216,183,221,.25)',
//     }}>
//       {children}
//     </Box>
//   );

//   return (
//     <CardBox>
//       <Typography
//         variant="h5"
//         component="h3"
//         sx={{
//           mb: 2,
//           fontWeight: 800,
//           letterSpacing: .4,
//           background: 'linear-gradient(90deg,#fff,#D8B7DD)',
//           WebkitBackgroundClip: 'text',
//           WebkitTextFillColor: 'transparent'
//         }}
//       >
//         {title}
//       </Typography>

//       <Box ref={ref}>
//         <svg
//           viewBox={`0 0 ${width} ${height}`}
//           style={{ width: '100%', height: 'auto', display: 'block' }}
//         >
//           <defs>
//             <radialGradient id={`star-${uid}`} cx="50%" cy="50%" r="50%">
//               <stop offset="0%" stopColor="#fff" stopOpacity="1" />
//               <stop offset="100%" stopColor="#D8B7DD" stopOpacity="0.15" />
//             </radialGradient>
//             <filter id={`glow-${uid}`}>
//               <feGaussianBlur stdDeviation="4" result="coloredBlur" />
//               <feMerge>
//                 <feMergeNode in="coloredBlur" />
//                 <feMergeNode in="SourceGraphic" />
//               </feMerge>
//             </filter>
//           </defs>

//           {/* лёгкая «туманность» */}
//           <g opacity="0.65">
//             <motion.circle cx={200} cy={140} r={110} fill={`url(#star-${uid})`}
//               animate={{ r: [100,115,100] }}
//               transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
//             <motion.circle cx={700} cy={220} r={90}  fill={`url(#star-${uid})`}
//               animate={{ r: [80,100,80]  }}
//               transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
//           </g>

//           {/* связи */}
//           <g>
//             {links.map(([a,b], idx) => {
//               const A = nodes.find(n => n.id===a)!;
//               const B = nodes.find(n => n.id===b)!;
//               const x1 = (A.x/100)*width, y1=(A.y/100)*height;
//               const x2 = (B.x/100)*width, y2=(B.y/100)*height;
//               return (
//                 <motion.line
//                   key={idx}
//                   x1={x1} y1={y1} x2={x2} y2={y2}
//                   stroke="rgba(216,183,221,.65)" strokeWidth={1.8} strokeLinecap="round"
//                   variants={lineVariants}
//                   initial="hidden"
//                   animate={isInView ? 'visible' : 'hidden'}
//                   custom={idx}
//                   style={{ filter: `url(#glow-${uid})` }}
//                 />
//               );
//             })}
//           </g>

//           {/* узлы */}
//           <g>
//             {nodes.map((n, i) => {
//               const cx = (n.x/100)*width, cy=(n.y/100)*height;
//               return (
//                 <Tooltip
//                   key={n.id}
//                   title={
//                     <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
//                       <AutoAwesomeIcon fontSize="inherit" />
//                       <span>{n.label}</span>
//                     </Box>
//                   }
//                 >
//                   <motion.g
//                     variants={nodeVariants}
//                     initial="hidden"
//                     animate={isInView ? 'visible' : 'hidden'}
//                     custom={i}
//                   >
//                     <motion.circle cx={cx} cy={cy} r={8} fill="#fff" opacity={.9}
//                       animate={{ r: [7.6,9.2,7.6] }}
//                       transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
//                     <circle cx={cx} cy={cy} r={18} fill={`url(#star-${uid})`} opacity={.55} />
//                     <text x={cx+14} y={cy+4} fontSize={14} fill="rgba(255,255,255,.85)" style={{ fontWeight: 700, letterSpacing: .2 }}>
//                       {n.label}
//                     </text>
//                   </motion.g>
//                 </Tooltip>
//               );
//             })}
//           </g>
//         </svg>
//       </Box>

//       {/* легенда */}
//       <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mt:1 }}>
//         <Chip size="small" label={labels.past} />
//         <Chip size="small" label={labels.present} />
//         <Chip size="small" label={labels.decision} />
//         <Chip size="small" label={labels.future} />
//         <Chip size="small" label={labels.advice} />
//         <Chip size="small" label={labels.hidden} />
//       </Box>
//     </CardBox>
//   );
// };

// // --- Основной Компонент ---

// export const TarotAIComponent = () => {
//   const t = useTranslations('TarotAIPage');

//   // Настройки анимации как у тебя
//   const blockVariants: Variants = {
//     hidden: { opacity: 0, y: 30 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.8,
//         ease: "easeOut"
//       }
//     }
//   };

//   // Локализация для карты
//   const mapLabels = React.useMemo(() => ({
//     past:     t('map.labels.past'),
//     present:  t('map.labels.present'),
//     decision: t('map.labels.decision'),
//     future:   t('map.labels.future'),
//     advice:   t('map.labels.advice'),
//     hidden:   t('map.labels.hidden'),
//   }), [t]);

//   return (
//     <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 8, color: 'rgba(255, 255, 255, 0.95)' }}>
//       {/* SEO H1 (не трогаем) */}
//       <h1 style={{ position: 'absolute', width: '1px', height: '1px', margin: '-1px', border: 0, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
//         {t('seo_title')}
//       </h1>

//       {/* --- БЛОК 1: ВВЕДЕНИЕ --- */}
//       <motion.div initial="hidden" animate="visible" variants={blockVariants}>
//         <Typography component="h2" variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.5rem', sm: '3.5rem' }, textAlign: 'center', background: '#D8B7DD', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 2, textShadow: '0 0 15px rgba(216,183,221,0.3)' }}>
//           {t('title')}
//         </Typography>
//         <Typography variant="h5" component="h3" sx={{ mb: 4, fontSize: '1.4rem', lineHeight: 1.6, textAlign: 'center', fontWeight: 'bold' }}>
//           {t('block1_intro.title')}
//         </Typography>
//         <Typography variant="body1" sx={{ mb: 6, fontSize: '1.2rem', lineHeight: 1.8 }}>
//           {t('block1_intro.text')}
//         </Typography>
//       </motion.div>
//         <Box sx={{ textAlign: 'center', mt: 6 }}>
//           <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom>{t('block5_cta.title')}</Typography>
//           <Button
//             variant="contained"
//             size="large"
//             onClick={() => (window.location.href = '/')}
//             sx={{ fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px', background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)', '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' }, transition: 'all 0.3s ease-in-out' }}
//           >
//             {t('button_text')}
//           </Button>
//         </Box>

//       {/* === СЕКЦИЯ: ИНТЕРАКТИВНАЯ КАРТА СМЫСЛА === */}
//       <Box component={motion.div} initial="hidden" animate="visible" variants={blockVariants} transition={{ delay: 0.15 }} sx={{ mb: 6 }}>
//         <ConstellationMap title={t('map.title')} labels={mapLabels} />
//       </Box>

//       {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
//       <Box component={motion.div} initial="hidden" animate="visible" variants={blockVariants} transition={{ delay: 0.3 }}>

//         <ThemedDivider />

//         {/* --- БЛОК 2: ИСКУССТВО ВОПРОСА --- */}
//         <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>{t('block2_art_of_asking.title')}</Typography>
//         <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>{t('block2_art_of_asking.text_intro')}</Typography>
//         <Box sx={{ p: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 2, mb: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
//           <Typography variant="h5" component="h3" sx={{ mb: 2, fontStyle: 'italic', fontWeight: 'bold' }}>{t('block2_art_of_asking.deeper_dive_title')}</Typography>
//           <Typography variant="body1" sx={{ lineHeight: 1.8 }}>{t('block2_art_of_asking.deeper_dive_text')}</Typography>
//         </Box>
//         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h6" component="h4" sx={{ mb: 1, color: '#ff8a80' }}>{t('block2_art_of_asking.bad_examples_title')}</Typography>
//             <List dense>
//               {t.raw('block2_art_of_asking.bad_examples').map((item: string) => <ThemedListItem key={item} text={item} />)}
//             </List>
//           </Box>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h6" component="h4" sx={{ mt: { xs: 2, md: 0 }, mb: 1, color: '#b9f6ca' }}>{t('block2_art_of_asking.good_examples_title')}</Typography>
//             <List dense>
//               {t.raw('block2_art_of_asking.good_examples').map((item: string) => <ThemedListItem key={item} text={item} />)}
//             </List>
//           </Box>
//         </Box>

//         <ThemedDivider />

//         {/* --- БЛОК 3: ПУТЬ К ЯСНОСТИ (ШАГИ) --- */}
//         <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>{t('block3_journey.title')}</Typography>
//         <Box>
//             {[1, 2, 3, 4].map(i => (
//                 <Box key={i} component={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={blockVariants} sx={{ mb: 3, p: 2, background: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
//                     <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', color: '#D8B7DD' }}>{t(`block3_journey.step${i}_title`)}</Typography>
//                     <Typography variant="body1" sx={{ lineHeight: 1.8, pl: '2px' }}>{t(`block3_journey.step${i}_text`)}</Typography>
//                 </Box>
//             ))}
//         </Box>

//         <ThemedDivider />

//         {/* --- БЛОК 4: CASE STUDY --- */}
//         <Box sx={{ p: 3, background: 'linear-gradient(135deg, rgba(216, 183, 221, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)', borderRadius: 3, border: '1px solid rgba(216, 183, 221, 0.2)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
//           <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>{t('block_case_study.title')}</Typography>
//           <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', lineHeight: 1.8 }}>{t('block_case_study.story')}</Typography>
//           <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', color: '#D8B7DD' }}>{t('block_case_study.outcome_title')}</Typography>
//           <Typography variant="body1" sx={{ lineHeight: 1.8 }}>{t('block_case_study.outcome_text')}</Typography>
//         </Box>

//         <ThemedDivider />

//         {/* --- БЛОК 5: FAQ (АККОРДЕОН) --- */}
//         <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>{t('block4_faq.title')}</Typography>
//         <Box>
//             {[1, 2, 3, 4, 5].map(i => (
//                 <Accordion key={i} sx={{ background: 'rgba(0,0,0,0.2)', color: 'white', '&:before': { display: 'none' }, mb: 1, borderRadius: 2, '&.Mui-expanded': { margin: '8px 0' } }}>
//                     <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#D8B7DD' }} />} >
//                         <Typography sx={{ fontWeight: 'bold' }}>{t(`block4_faq.q${i}`)}</Typography>
//                     </AccordionSummary>
//                     <AccordionDetails>
//                         <Typography sx={{ lineHeight: 1.8 }}>{t(`block4_faq.a${i}`)}</Typography>
//                     </AccordionDetails>
//                 </Accordion>
//             ))}
//         </Box>

//         <ThemedDivider />

//         {/* --- БЛОК 6: ФИНАЛЬНЫЙ CTA --- */}
//         <Box sx={{ textAlign: 'center', mt: 6 }}>
//           <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom>{t('block5_cta.title')}</Typography>
//           <Button
//             variant="contained"
//             size="large"
//             onClick={() => (window.location.href = '/')}
//             sx={{ fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px', background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)', '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' }, transition: 'all 0.3s ease-in-out' }}
//           >
//             {t('button_text')}
//           </Button>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

'use client';
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TarotConstellation } from './TarotConstellation';

// 🔽 добавили импорт готовой обёртки для карты


// --- Вспомогательные компоненты (как у тебя было) ---

// Стилизованный разделитель
const ThemedDivider = () => (
  <Divider sx={{
    my: 6,
    borderColor: 'rgba(255,255,255,0.1)',
    '&::before, &::after': { borderColor: 'rgba(255,255,255,0.2)' },
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(216,183,221,0.6)">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
    </svg>
  </Divider>
);

// Стилизованный элемент списка с иконкой
const ThemedListItem = ({ text }: { text: string }) => (
  <ListItem sx={{ py: 0.5, px: 0 }}>
    <ListItemIcon sx={{ minWidth: '32px', color: '#D8B7DD' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
    </ListItemIcon>
    <ListItemText primary={text} sx={{ '& .MuiTypography-root': { lineHeight: 1.6 } }} />
  </ListItem>
);

// --- Основной Компонент ---

export const TarotAIComponent = () => {
  const t = useTranslations('TarotAIPage');

  // Настройки анимации как у тебя
  const blockVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 8, color: 'rgba(255, 255, 255, 0.95)' }}>
      {/* SEO H1 (не трогаем) */}
      <h1 style={{
        position: 'absolute', width: '1px', height: '1px', margin: '-1px',
        border: 0, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
      }}>
        {t('seo_title')}
      </h1>

      {/* --- БЛОК 1: ВВЕДЕНИЕ --- */}
      <motion.div initial="hidden" animate="visible" variants={blockVariants}>
        <Typography
          component="h2" variant="h2" fontWeight="bold" gutterBottom
          sx={{
            fontSize: { xs: '2.5rem', sm: '3.5rem' }, textAlign: 'center',
            background: '#D8B7DD', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            mb: 2, textShadow: '0 0 15px rgba(216,183,221,0.3)'
          }}
        >
          {t('title')}
        </Typography>
        <Typography variant="h5" component="h3" sx={{ mb: 4, fontSize: '1.4rem', lineHeight: 1.6, textAlign: 'center', fontWeight: 'bold' }}>
          {t('block1_intro.title')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 6, fontSize: '1.2rem', lineHeight: 1.8 }}>
          {t('block1_intro.text')}
        </Typography>
      </motion.div>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom>{t('block5_cta.title')}</Typography>
        <Button
          variant="contained" size="large" onClick={() => (window.location.href = '/')}
          sx={{
            fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px',
            background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
            '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          {t('button_text')}
        </Button>
      </Box>

      {/* === СЕКЦИЯ: ИНТЕРАКТИВНАЯ КАРТА СМЫСЛА === */}
      <Box
        component={motion.div}
        initial="hidden"
        animate="visible"
        variants={blockVariants}
        transition={{ delay: 0.15 }}
        sx={{ mb: 6 }}
      >
        {/* ⬇️ тут раньше был локальный <ConstellationMap .../> */}
        <TarotConstellation />
      </Box>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <Box component={motion.div} initial="hidden" animate="visible" variants={blockVariants} transition={{ delay: 0.3 }}>
        <ThemedDivider />

        {/* --- БЛОК 2: ИСКУССТВО ВОПРОСА --- */}
        <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          {t('block2_art_of_asking.title')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
          {t('block2_art_of_asking.text_intro')}
        </Typography>

        <Box sx={{ p: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 2, mb: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h5" component="h3" sx={{ mb: 2, fontStyle: 'italic', fontWeight: 'bold' }}>
            {t('block2_art_of_asking.deeper_dive_title')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {t('block2_art_of_asking.deeper_dive_text')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h4" sx={{ mb: 1, color: '#ff8a80' }}>
              {t('block2_art_of_asking.bad_examples_title')}
            </Typography>
            <List dense>
              {t.raw('block2_art_of_asking.bad_examples').map((item: string) => (
                <ThemedListItem key={item} text={item} />
              ))}
            </List>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h4" sx={{ mt: { xs: 2, md: 0 }, mb: 1, color: '#b9f6ca' }}>
              {t('block2_art_of_asking.good_examples_title')}
            </Typography>
            <List dense>
              {t.raw('block2_art_of_asking.good_examples').map((item: string) => (
                <ThemedListItem key={item} text={item} />
              ))}
            </List>
          </Box>
        </Box>

        <ThemedDivider />

        {/* --- БЛОК 3: ПУТЬ К ЯСНОСТИ (ШАГИ) --- */}
        <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
          {t('block3_journey.title')}
        </Typography>
        <Box>
          {[1, 2, 3, 4].map(i => (
            <Box
              key={i}
              component={motion.div}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={blockVariants}
              sx={{ mb: 3, p: 2, background: 'rgba(0,0,0,0.1)', borderRadius: 2 }}
            >
              <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', color: '#D8B7DD' }}>
                {t(`block3_journey.step${i}_title`)}
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, pl: '2px' }}>
                {t(`block3_journey.step${i}_text`)}
              </Typography>
            </Box>
          ))}
        </Box>

        <ThemedDivider />

        {/* --- БЛОК 4: CASE STUDY --- */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(216, 183, 221, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)',
            borderRadius: 3,
            border: '1px solid rgba(216, 183, 221, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}
        >
          <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            {t('block_case_study.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', lineHeight: 1.8 }}>
            {t('block_case_study.story')}
          </Typography>
          <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', color: '#D8B7DD' }}>
            {t('block_case_study.outcome_title')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {t('block_case_study.outcome_text')}
          </Typography>
        </Box>

        <ThemedDivider />

        {/* --- БЛОК 5: FAQ (АККОРДЕОН) --- */}
        <Typography component="h2" variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          {t('block4_faq.title')}
        </Typography>
        <Box>
          {[1, 2, 3, 4, 5].map(i => (
            <Accordion
              key={i}
              sx={{
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                '&:before': { display: 'none' },
                mb: 1,
                borderRadius: 2,
                '&.Mui-expanded': { margin: '8px 0' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#D8B7DD' }} />} >
                <Typography sx={{ fontWeight: 'bold' }}>{t(`block4_faq.q${i}`)}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ lineHeight: 1.8 }}>{t(`block4_faq.a${i}`)}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <ThemedDivider />

        {/* --- БЛОК 6: ФИНАЛЬНЫЙ CTA --- */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom>
            {t('block5_cta.title')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => (window.location.href = '/')}
            sx={{
              fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px',
              background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
              '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {t('button_text')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
