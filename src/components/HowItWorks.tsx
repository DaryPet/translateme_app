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
// import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';
// import PlayArrowIcon from '@mui/icons-material/PlayArrow';
// import TranslateIcon from '@mui/icons-material/Translate';
// import BoltIcon from '@mui/icons-material/Bolt';
// import { keyframes } from '@emotion/react';

// /* ===== Animations ===== */

// const floatAnimation = keyframes`
//   0%, 100% { transform: translateY(0px); }
//   50% { transform: translateY(-10px); }
// `;

// const glowPulse = keyframes`
//   0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,.25); }
//   50% { box-shadow: 0 0 40px rgba(99,102,241,.5); }
// `;

// export const HowItWorks = () => {
//   const t = useTranslations('HowItWorks');

//   const steps = [
//     {
//       icon: <InstallDesktopIcon />,
//       color: '#6366f1',
//       title: t('step1.title'),
//       description: t('step1.description'),
//     },
//     {
//       icon: <PlayArrowIcon />,
//       color: '#10b981',
//       title: t('step2.title'),
//       description: t('step2.description'),
//     },
//     {
//       icon: <TranslateIcon />,
//       color: '#8b5cf6',
//       title: t('step3.title'),
//       description: t('step3.description'),
//     },
//   ];

//   return (
//     <Box
//       id="how-it-works"
//       sx={{
//         position: 'relative',
//         py: { xs: 8, md: 12 },
//         px: { xs: 1.5, md: 2 },
//         background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Background light */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: '20%',
//           left: '10%',
//           width: 300,
//           height: 300,
//           borderRadius: '50%',
//           background:
//             'radial-gradient(circle, rgba(99,102,241,.18), transparent 70%)',
//           filter: 'blur(50px)',
//           animation: `${floatAnimation} 18s ease-in-out infinite`,
//         }}
//       />

//       {/* ===== Header ===== */}
//       <Box sx={{ textAlign: 'center', mb: 8, position: 'relative', zIndex: 1 }}>
//         <Chip
//           icon={<BoltIcon />}
//           label="HOW IT WORKS"
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

//       {/* ===== Steps ===== */}
//       <Grid
//         container
//         spacing={4}
//         justifyContent="center"
//         sx={{ position: 'relative', zIndex: 1 }}
//       >
//         {steps.map((step, index) => (
//           <Grid item xs={12} md={4} key={index}>
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: index * 0.15 }}
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
//                     borderColor: step.color,
//                     boxShadow: `0 25px 50px -12px ${step.color}55`,
//                   },
//                   '&::before': {
//                     content: '""',
//                     position: 'absolute',
//                     inset: 0,
//                     background: `linear-gradient(135deg, ${step.color}22, transparent)`,
//                     opacity: 0.6,
//                   },
//                 }}
//               >
//                 <CardContent
//                   sx={{
//                     position: 'relative',
//                     zIndex: 1,
//                     textAlign: 'center',
//                     p: 4,
//                   }}
//                 >
//                   {/* Icon */}
//                   <Avatar
//                     sx={{
//                       mx: 'auto',
//                       mb: 3,
//                       width: 72,
//                       height: 72,
//                       bgcolor: `${step.color}22`,
//                       border: `2px solid ${step.color}55`,
//                       color: step.color,
//                       animation: `${floatAnimation} 4s ease-in-out infinite`,
//                     }}
//                   >
//                     {step.icon}
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
//                     {step.title}
//                   </Typography>

//                   {/* Description */}
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: '#cbd5e1',
//                       opacity: 0.9,
//                       fontSize: '0.95rem',
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     {step.description}
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
  InstallDesktop,
  PlayArrow,
  Translate,
  Bolt,
} from '@mui/icons-material';


import { ParticlesBG } from './ui/ParticlesBG';
import { ConnectingLines } from './ui/ConnectingLines';
import { colors, gradients } from './ui/themeTokens';
import { GlowCard } from './ui/GlowCard';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');

  const steps = [
    {
      icon: <InstallDesktop />,
      color: colors.primary,
      key: 'step1',
    },
    {
      icon: <PlayArrow />,
      color: colors.success,
      key: 'step2',
    },
    {
      icon: <Translate />,
      color: colors.secondary,
      key: 'step3',
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        py: { xs: 8, md: 12 },
        px: 2,
        background: 'linear-gradient(135deg, #0a0e1a, #141825)',
        overflow: 'hidden',
      }}
    >
      <ParticlesBG />
      <ConnectingLines />

      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 8, position: 'relative', zIndex: 1 }}>
        <Chip
          icon={<Bolt />}
          label="HOW IT WORKS"
          sx={{
            mb: 3,
            px: 2,
            py: 1,
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: 1,
            color: 'white',
            background: gradients.primary,
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

      {/* Steps */}
      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
        {steps.map((step, i) => (
          <Grid item xs={12} md={4} key={step.key}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <GlowCard>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Avatar
                    sx={{
                      mb: 3,
                      mx: 'auto',
                      width: 64,
                      height: 64,
                      bgcolor: `${step.color}22`,
                      color: step.color,
                      border: `2px solid ${step.color}55`,
                    }}
                  >
                    {step.icon}
                  </Avatar>

                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: 'white', mb: 1.5 }}
                  >
                    {t(`${step.key}.title`)}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: colors.textSecondary, lineHeight: 1.6 }}
                  >
                    {t(`${step.key}.description`)}
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
