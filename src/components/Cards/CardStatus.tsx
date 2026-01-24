'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

interface Props {
  totalUsed: number;
  paidCredits: number;
  freeLimit?: number;
}

const CardStatus: React.FC<Props> = ({
  totalUsed,
  paidCredits,
  freeLimit = 3,
}) => {
  const t = useTranslations();
  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        backgroundColor: '#111',
        border: '1px solid #444',
        borderRadius: 2,
      }}
    >
      <Typography sx={{ fontSize: '16px', color: '#ccc' }}>
        <strong>
          {Math.min(totalUsed, freeLimit)} / {freeLimit}
        </strong>{' '}
        🆓 {t('usedFree')}
      </Typography>
      <Typography sx={{ fontSize: '16px', color: '#ccc' }}>
        💳 {t('purchasedCards')}: <strong>{paidCredits}</strong>
      </Typography>
    </Box>
  );
};

export default CardStatus;
