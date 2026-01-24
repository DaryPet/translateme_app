'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Card } from 'src/hooks/useTarotAI';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Props {
  card: Card;
}

export const CardDisplay: React.FC<Props> = ({ card }) => {
  const t = useTranslations();

  return (
    <Box sx={{ mt: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {t('yourCard')}
      </Typography>

      <Box
        sx={{
          position: 'relative',
          width: 250,
          aspectRatio: '5 / 8',
          mx: 'auto',
        }}
      >
        <Image
          src={`/cards/${card.file}`}
          alt={card.name}
          fill
          sizes="(max-width: 600px) 90vw, 250px"
          loading="lazy"
          style={{ objectFit: 'contain' }}
        />
      </Box>

      <Typography
        variant="subtitle1"
        sx={{ mt: 1, fontFamily: 'Cormorant Garamond, sans-serif' }}
      >
        {card.name}
      </Typography>
    </Box>
  );
};
