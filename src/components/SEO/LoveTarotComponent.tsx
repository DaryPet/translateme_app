'use client';

import React, { useMemo, useState } from 'react';
import {
  Box, Container, Typography, Button, Divider
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion, Variants } from 'framer-motion';
import { LoveSpreadPicker } from './LoveSpreadPicker';
// import { HeartAtlas } from './LoveHeartAtlas';
import { LoveGlossary } from './LoveGlossary';
import { HeartAtlas } from './LoveHeartAtlas';

const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };
  return (
    <Box
      component={motion.div}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
      sx={{ mb: 8 }}
    >
      {children}
    </Box>
  );
};

export const LoveTarotComponent = () => {
  const t = useTranslations('LoveTarot');

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 8 }}>
      {/* SEO H1 (скрытый, не трогаем стиль сайта) */}
      <h1 style={{
        position: 'absolute', width: '1px', height: '1px', margin: '-1px',
        border: 0, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap'
      }}>
        {t('seo_h1')}
      </h1>

      {/* Hero-интро */}
      <AnimatedSection>
        <Typography
          variant="h2"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            textAlign: 'center',
            background: '#D8B7DD',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          {t('main_title')}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            fontSize: '1.2rem',
            lineHeight: 1.6,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.9)'
          }}
        >
          {t('intro_p1')}
        </Typography>

        <Typography
          variant="h3"
          component="h2"
          sx={{
            fontSize: '1.5rem',
            textAlign: 'center',
            mb: 3,
            fontWeight: 'bold',
            color: '#D8B7DD'
          }}
        >
          {t('intro_subtitle')}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            fontSize: '1.1rem',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center'
          }}
        >
          {t.rich('intro_p2', { b: (chunks) => <strong>{chunks}</strong> })}
        </Typography>

        {/* Верхний CTA — кнопка в вашем стиле */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            {t('final_cta_title')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => (window.location.href = '/')}
            sx={{
              fontSize: '1.2rem',
              py: 2, px: 4, mt: 2,
              borderRadius: '25px',
              background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
              '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {t('cta_ask_question')}
          </Button>
        </Box>
      </AnimatedSection>

      {/* Этичный бейджик */}
      <AnimatedSection>
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          px: 2.5, py: 1.25,
          borderRadius: 999,
          border: '1px solid rgba(216,183,221,0.35)',
          background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.15))',
          mx: 'auto'
        }}>
          <span role="img" aria-label="privacy">🔒</span>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('ethics_badge')}
          </Typography>
        </Box>
      </AnimatedSection>

      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* 3 популярных расклада с копированием вопросов */}
      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>
          {t('spreads_title')}
        </Typography>
        <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
          {t('spreads_intro')}
        </Typography>
        <LoveSpreadPicker />
      </AnimatedSection>

      {/* Heart Atlas — новая карта сердца */}
      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>
          {t('map_title')}
        </Typography>
        <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
          {t('map_intro')}
        </Typography>
        <HeartAtlas />
      </AnimatedSection>

      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Глоссарий карт — локализованные названия + описания из i18n */}
      <AnimatedSection>
        <LoveGlossary />
      </AnimatedSection>

      {/* Нижний CTA */}
      <AnimatedSection>
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            {t('final_cta_title')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => (window.location.href = '/')}
            sx={{
              fontSize: '1.2rem',
              py: 2, px: 4, mt: 2,
              borderRadius: '25px',
              background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
              '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {t('cta_ask_question')}
          </Button>
        </Box>
      </AnimatedSection>
    </Container>
  );
};
