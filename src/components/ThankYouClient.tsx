'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const ThankYouClient = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cards, setCards] = useState<number | null>(null);

  useEffect(() => {
    const cardsParam = searchParams.get('cards');
    const parsed = Number(cardsParam);
    if (!isNaN(parsed) && parsed > 0) {
      setCards(parsed);
    }

    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: 'white',
        p: 4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        ✅ {t('thankYouTitle')}
      </Typography>

      <Typography sx={{ mb: 2 }}>
        {cards ? t('thankYouCards', { count: cards }) : t('thankYouAuto')}
      </Typography>

      <Typography sx={{ fontSize: '14px', color: '#888', mb: 3 }}>
        {t('thankYouRedirect')}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push('/')}
      >
        {t('thankYouGoNow')}
      </Button>
    </Box>
  );
};

export default ThankYouClient;
