'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const CancelClient = () => {
  const router = useRouter();

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
        ❌ Оплата отменена
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Вы закрыли окно оплаты или отменили процесс. Деньги не списаны.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push('/')}
      >
        Вернуться к раскладам
      </Button>
    </Box>
  );
};

export default CancelClient;
