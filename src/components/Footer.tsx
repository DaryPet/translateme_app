import React from 'react';
import { Typography, Box, Link, Stack } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import NextLink from 'next/link';

export const Footer = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Box
      sx={{
        backgroundColor: '#5f43b2',
        padding: '20px 0',
        textAlign: 'center',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Link
          component={NextLink}
          href={`/${locale}/privacy-policy`}
          target="_blank"
          rel="noopener noreferrer"
          color="white"
          underline="hover"
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            letterSpacing: '0.5px',
            '&:hover': { color: '#ffe082' },
          }}
        >
          {t('privacyPolicy')}
        </Link>
        {/* Если добавишь Terms Of Use */}
        <Link
          component={NextLink}
          href={`/${locale}/terms`}
          target="_blank"
          rel="noopener noreferrer"
          color="white"
          underline="hover"
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            letterSpacing: '0.5px',
            '&:hover': { color: '#ffe082' },
          }}
        >
          {t('termsOfUse')}
        </Link>
      </Stack>
      <Typography variant="body2" color="white">
        {t('allRights')}
      </Typography>
    </Box>
  );
};
