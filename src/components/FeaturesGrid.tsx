// 'use client';

// import {
//   Box,
//   Grid,
//   Typography,
//   Card,
//   CardContent,
//   Avatar,
//   Chip,
// } from '@mui/material';
// import { useTranslations } from 'next-intl';
// import { motion } from 'framer-motion';
// import LanguageIcon from '@mui/icons-material/Language';
// import SpeedIcon from '@mui/icons-material/Speed';
// import VolumeUpIcon from '@mui/icons-material/VolumeUp';
// import TranslateIcon from '@mui/icons-material/Translate';
// import DevicesIcon from '@mui/icons-material/Devices';
// import SecurityIcon from '@mui/icons-material/Security';
// import StarsIcon from '@mui/icons-material/Stars';
// import { keyframes } from '@emotion/react';

// /* ===== Animations ===== */

// const floatAnimation = keyframes`
//   0%, 100% { transform: translateY(0px); }
//   50% { transform: translateY(-10px); }
// `;

// const glowPulse = keyframes`
//   0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,.25); }
//   50% { box-shadow: 0 0 45px rgba(99,102,241,.5); }
// `;

// export const FeaturesGrid = () => {
//   const t = useTranslations('Features');

//   const features = [
//     {
//       icon: <LanguageIcon />,
//       color: '#6366f1',
//       title: t('languages.title'),
//       description: t('languages.description'),
//     },
//     {
//       icon: <SpeedIcon />,
//       color: '#10b981',
//       title: t('speed.title'),
//       description: t('speed.description'),
//     },
//     {
//       icon: <VolumeUpIcon />,
//       color: '#8b5cf6',
//       title: t('volume.title'),
//       description: t('volume.description'),
//     },
//     {
//       icon: <TranslateIcon />,
//       color: '#f59e0b',
//       title: t('quality.title'),
//       description: t('quality.description'),
//     },
//     {
//       icon: <DevicesIcon />,
//       color: '#ef4444',
//       title: t('platforms.title'),
//       description: t('platforms.description'),
//     },
//     {
//       icon: <SecurityIcon />,
//       color: '#06b6d4',
//       title: t('privacy.title'),
//       description: t('privacy.description'),
//     },
//   ];

//   return (
//     <Box
//       sx={{
//         position: 'relative',
//         py: { xs: 8, md: 12 },
//         px: { xs: 1.5, md: 2 },
//         background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Background glow */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: '10%',
//           right: '10%',
//           width: 350,
//           height: 350,
//           borderRadius: '50%',
//           filter: 'blur(60px)',
//           background:
//             'radial-gradient(circle, rgba(139,92,246,.18), transparent 70%)',
//           animation: `${floatAnimation} 20s ease-in-out infinite`,
//         }}
//       />

//       {/* ===== Header ===== */}
//       <Box sx={{ textAlign: 'center', mb: 8, position: 'relative', zIndex: 1 }}>
//         <Chip
//           icon={<StarsIcon />}
//           label="FEATURE HIGHLIGHTS"
//           sx={{
//             mb: 3,
//             px: 2,
//             py: 1,
//             fontWeight: 900,
//             fontSize: 11,
//             letterSpacing: '1px',
//             color: 'white',
//             background: 'linear-gradient(135deg, #6366f1, #ec4899)',
//             animation: `${glowPulse} 2s ease-in-out infinite`,
//           }}
//         />

//         <Typography
//           variant="h3"
//           sx={{
//             fontWeight: 900,
//             letterSpacing: '-0.5px',
//             fontSize: { xs: '2rem', md: '2.8rem' },
//             background:
//               'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent',
//           }}
//         >
//           {t('title')}
//         </Typography>
//       </Box>

//       {/* ===== Grid ===== */}
//       <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
//         {features.map((feature, index) => (
//           <Grid item xs={12} sm={6} md={4} key={index}>
//             <motion.div
//               initial={{ opacity: 0, y: 35 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: index * 0.08 }}
//               viewport={{ once: true }}
//             >
//               <Card
//                 sx={{
//                   height: '100%',
//                   borderRadius: 4,
//                   background:
//                     'linear-gradient(135deg, rgba(30,41,59,.9), rgba(15,23,42,.9))',
//                   border: '1px solid rgba(99,102,241,.25)',
//                   backdropFilter: 'blur(20px)',
//                   position: 'relative',
//                   overflow: 'hidden',
//                   transition: 'all .35s ease',

//                   '&:hover': {
//                     transform: 'translateY(-10px)',
//                     borderColor: feature.color,
//                     boxShadow: `0 25px 50px -12px ${feature.color}55`,
//                   },

//                   '&::before': {
//                     content: '""',
//                     position: 'absolute',
//                     inset: 0,
//                     background: `linear-gradient(135deg, ${feature.color}22, transparent)`,
//                     opacity: 0.6,
//                   },
//                 }}
//               >
//                 <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
//                   {/* Icon */}
//                   <Avatar
//                     sx={{
//                       mb: 3,
//                       width: 64,
//                       height: 64,
//                       bgcolor: `${feature.color}22`,
//                       border: `2px solid ${feature.color}55`,
//                       color: feature.color,
//                       animation: `${floatAnimation} 4s ease-in-out infinite`,
//                     }}
//                   >
//                     {feature.icon}
//                   </Avatar>

//                   {/* Title */}
//                   <Typography
//                     variant="h5"
//                     sx={{
//                       fontWeight: 900,
//                       color: 'white',
//                       mb: 1.5,
//                       letterSpacing: '-0.3px',
//                     }}
//                   >
//                     {feature.title}
//                   </Typography>

//                   {/* Description */}
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: '#cbd5e1',
//                       opacity: 0.9,
//                       lineHeight: 1.6,
//                       fontSize: '0.95rem',
//                     }}
//                   >
//                     {feature.description}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// };


'use client';

import {
  Box,
  Grid,
  Typography,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Language,
  Speed,
  VolumeUp,
  Translate,
  Devices,
  Security,
  Stars,
} from '@mui/icons-material';

import { GlowCard } from './ui/GlowCard';
import { ParticlesBG } from './ui/ParticlesBG';
import { ConnectingLines } from './ui/ConnectingLines';
import { colors, gradients } from './ui/themeTokens';

export const FeaturesGrid = () => {
  const t = useTranslations('Features');

  const features = [
    { icon: <Language />, color: colors.primary, key: 'languages' },
    { icon: <Speed />, color: colors.success, key: 'speed' },
    { icon: <VolumeUp />, color: colors.secondary, key: 'volume' },
    { icon: <Translate />, color: colors.warning, key: 'quality' },
    { icon: <Devices />, color: colors.danger, key: 'platforms' },
    { icon: <Security />, color: colors.info, key: 'privacy' },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        py: { xs: 8, md: 12 },
        px: 2,
        background: colors.bgDark,
        overflow: 'hidden',
      }}
    >
      <ParticlesBG />
      <ConnectingLines />

      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 8, position: 'relative', zIndex: 1 }}>
        <Chip
          icon={<Stars />}
          label="FEATURES"
          sx={{
            mb: 3,
            px: 2,
            py: 1,
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: 1,
            color: 'white',
            background: gradients.accent,
          }}
        />

        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            letterSpacing: '-0.5px',
            background:
              'linear-gradient(135deg, #ffffff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('title')}
        </Typography>
      </Box>

      {/* Grid */}
      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
        {features.map((f, i) => (
          <Grid item xs={12} sm={6} md={4} key={f.key}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <GlowCard>
                <CardContent sx={{ p: 4 }}>
                  <Avatar
                    sx={{
                      mb: 3,
                      width: 60,
                      height: 60,
                      bgcolor: `${f.color}22`,
                      color: f.color,
                      border: `2px solid ${f.color}55`,
                    }}
                  >
                    {f.icon}
                  </Avatar>

                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: 'white', mb: 1.5 }}
                  >
                    {t(`${f.key}.title`)}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: colors.textSecondary, lineHeight: 1.6 }}
                  >
                    {t(`${f.key}.description`)}
                  </Typography>
                </CardContent>
              </GlowCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
