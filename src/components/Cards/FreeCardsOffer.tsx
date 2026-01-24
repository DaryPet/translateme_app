'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useUser } from 'src/hooks/useUser';

export const FreeCardsOffer = () => {
  const { user, loading } = useUser();
  const router = useRouter();
  const t = useTranslations();

  if (loading || user) return null;

  return (
    <Box
      sx={{
        mt: 6,
        mb: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      {/* Текст над кнопкой */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Typography
          variant="h4"
          sx={{
            color: '#EDE4F5',
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          {t('signupNowToUnlock_part1')}{' '}
          <span
            style={{
              color: '#86b9b0',
              fontWeight: 800,
              fontSize: '1.6em',
              fontFamily: 'Cinzel, serif',
              textShadow: '0 0 6px rgba(191, 205, 138, 0.6)',
            }}
          >
            {t('signupNowToUnlock_digit')}
          </span>{' '}
          <span style={{ color: '#86b9b0', fontWeight: 700 }}>
            {t('signupNowToUnlock_highlight')}
          </span>{' '}
          {t('signupNowToUnlock_part2')}
        </Typography>
      </motion.div>

      {/* Кнопка */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <Button
          variant="contained"
          onClick={() => router.push('/register')}
          sx={{
            borderRadius: '30px',
            px: 5,
            py: 2.5,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            textTransform: 'none',
            background:
              'linear-gradient(90deg, #9b59b6 0%, #F1E7DF 50%, #9b59b6 100%)',
            backgroundSize: '200% 200%',
            boxShadow:
              '0 4px 16px rgba(0,0,0,0.4), 0 0 24px rgba(125,44,191,0.6)',
            color: '#FFFFFF',
            fontWeight: 700,
            '&:hover': {
              boxShadow:
                '0 6px 24px rgba(0,0,0,0.5), 0 0 32px rgba(125,44,191,0.7)',
            },
          }}
        >
          {t.rich('offerShort', {
            highlight: (chunks) => (
              <span
                style={{
                  marginLeft: '0.5rem',
                  color: '#051827',
                  textTransform: 'uppercase',
                }}
              >
                {chunks}
              </span>
            ),
          })}
        </Button>
      </motion.div>
    </Box>
  );
};
