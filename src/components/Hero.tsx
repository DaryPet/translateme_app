// components/home/HeroSection.tsx
'use client';

import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';

export const HeroSection = () => {
  const t = useTranslations('Hero');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pt: { xs: 8, sm: 12 },
        pb: { xs: 6, sm: 10 },
        minHeight: '80vh',
      }}
    >
      <Container maxWidth="md">
        {/* SEO заголовок (скрытый) */}
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', margin: '-1px', border: 0, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
          {t('seoTitle')}
        </h1>
        
        {/* Анимированный заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Typography
            variant="h2"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              letterSpacing: 1,
              lineHeight: 1.2,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            {t('title')}
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              mb: 6,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {t('subtitle')}
          </Typography>
        </motion.div>

        {/* Кнопки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              sx={{
                bgcolor: '#6366f1',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { bgcolor: '#4f46e5' }
              }}
              href="https://chromewebstore.google.com" // Замените на реальную ссылку
              target="_blank"
            >
              {t('installButton')}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<PlayCircleOutlineIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
              href="#demo" // Якорь к демо-секции
            >
              {t('demoButton')}
            </Button>
          </Stack>
        </motion.div>

        {/* Подпись под кнопками */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mt: 4,
              opacity: 0.7,
              fontSize: '0.9rem'
            }}
          >
            {t('freeTrial')}
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
};