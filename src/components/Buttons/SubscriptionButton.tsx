'use client';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { useTranslations } from 'next-intl';

export default function SubscriptionsClient() {
  const t = useTranslations('Subscriptions');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<'medium' | 'premium' | null>(null);

  const handleSubscribe = async (type: 'medium' | 'premium') => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setIsLoading(type);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: `subscription_${type}` }),
      });

      if (!res.ok) {
        console.error('Failed to create checkout session');
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        {t('title')}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mt={4}>
        <Card sx={{ flex: 1, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              {t('medium.title')}
            </Typography>
            <Typography variant="h3" component="div" gutterBottom>
              €5
              <Typography
                component="span"
                variant="body1"
                color="text.secondary"
              >
                /month
              </Typography>
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1} mb={3}>
              <Typography>✓ {t('medium.features.1')}</Typography>
              <Typography>✓ {t('medium.features.2')}</Typography>
              <Typography>✓ {t('medium.features.3')}</Typography>
            </Stack>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleSubscribe('medium')}
              disabled={isLoading === 'medium'}
              startIcon={
                isLoading === 'medium' ? <CircularProgress size={20} /> : null
              }
            >
              {isLoading === 'medium' ? t('processing') : t('medium.cta')}
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              {t('premium.title')}
            </Typography>
            <Typography variant="h3" component="div" gutterBottom>
              €10
              <Typography
                component="span"
                variant="body1"
                color="text.secondary"
              >
                /month
              </Typography>
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1} mb={3}>
              <Typography>✓ {t('premium.features.1')}</Typography>
              <Typography>✓ {t('premium.features.2')}</Typography>
              <Typography>✓ {t('premium.features.3')}</Typography>
              <Typography>✓ {t('premium.features.4')}</Typography>
            </Stack>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              onClick={() => handleSubscribe('premium')}
              disabled={isLoading === 'premium'}
              startIcon={
                isLoading === 'premium' ? <CircularProgress size={20} /> : null
              }
            >
              {isLoading === 'premium' ? t('processing') : t('premium.cta')}
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Typography variant="body2" color="text.secondary" align="center" mt={4}>
        {t('notice')}
      </Typography>
    </Box>
  );
}
