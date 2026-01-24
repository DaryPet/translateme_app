'use client';
import { Box, Container, Typography, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export const FreeTarotComponent = () => {
  const t = useTranslations();
  
  return (
    <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 4 }}>
      {/* SEO H1 (скрытый для поисковиков) */}
      <h1 style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        margin: '-1px', 
        border: 0, 
        padding: 0, 
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap'
      }}>
        {t('free_tarot_seo_title')}
      </h1>

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
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            letterSpacing: 1,
            lineHeight: 1.2,
            textAlign: 'center',
            background: '#D8B7DD',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}
        >
          {t('free_tarot_title')}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            fontSize: '1.2rem', 
            lineHeight: 1.6,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.9)'
          }}
        >
          {t('free_tarot_description')}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            mb: 6, 
            fontSize: '1.1rem', 
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.8)'
          }}
        >
          {t('free_tarot_content')}
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => window.location.href = '/'}
            sx={{
              fontSize: '1.2rem',
              py: 2,
              px: 4,
              borderRadius: '25px',
              background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
              '&:hover': {
                background: 'linear-gradient(45deg, #B39BC8, #D8B7DD)',
              }
            }}
          >
            {t('start_free_reading_button')}
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};