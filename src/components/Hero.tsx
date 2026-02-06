'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import BoltIcon from '@mui/icons-material/Bolt';
import { keyframes } from '@emotion/react';

/* ===== Animations ===== */

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,.3); }
  50% { box-shadow: 0 0 45px rgba(99,102,241,.6); }
`;

export const HeroSection = () => {
  const t = useTranslations('Hero');

  const scrollToDemo = () => {
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
        overflow: 'hidden',
        px: { xs: 1.5, md: 2 },
      }}
    >
      {/* ===== Background effects ===== */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 80%, rgba(99,102,241,.15), transparent 50%)',
          animation: `${floatAnimation} 20s ease-in-out infinite alternate`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          filter: 'blur(50px)',
          background:
            'radial-gradient(circle, rgba(236,72,153,.2), transparent 70%)',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* SEO title */}
        <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          {t('seoTitle')}
        </h1>

        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* ===== Badge ===== */}
          <Chip
            icon={<BoltIcon />}
            label="AI POWERED TRANSLATION"
            sx={{
              px: 2,
              py: 1,
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: '1px',
              color: 'white',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              animation: `${glowPulse} 2s ease-in-out infinite`,
            }}
          />

          {/* ===== Title ===== */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: '-1px',
                fontSize: {
                  xs: '2.4rem',
                  sm: '3.2rem',
                  md: '4rem',
                },
                background:
                  'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('title')}
            </Typography>
          </motion.div>

          {/* ===== Subtitle ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#94a3b8',
                maxWidth: 720,
                fontWeight: 500,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              {t('subtitle')}
            </Typography>
          </motion.div>

          {/* ===== CTA buttons ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                href="https://chromewebstore.google.com"
                target="_blank"
                sx={{
                  px: 5,
                  py: 1.8,
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  fontSize: '1.05rem',
                  color: 'white',
                  background:
                    'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)',
                    transform: 'translateX(-100%)',
                  },
                  '&:hover::before': {
                    transform: 'translateX(100%)',
                    transition: 'transform .6s',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 20px 40px rgba(99,102,241,.45)',
                  },
                }}
              >
                {t('installButton')}
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={scrollToDemo}
                sx={{
                  px: 5,
                  py: 1.8,
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: 'white',
                  borderRadius: 3,
                  borderColor: 'rgba(255,255,255,.25)',
                  backdropFilter: 'blur(6px)',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255,255,255,.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {t('demoButton')}
              </Button>
            </Stack>
          </motion.div>

          {/* ===== Footnote ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              {t('freeTrial')}
            </Typography>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};
