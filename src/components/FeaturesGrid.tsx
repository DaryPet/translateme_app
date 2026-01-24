'use client';

import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import LanguageIcon from '@mui/icons-material/Language';
import SpeedIcon from '@mui/icons-material/Speed';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import DevicesIcon from '@mui/icons-material/Devices';
import SecurityIcon from '@mui/icons-material/Security';

export const FeaturesGrid = () => {
  const t = useTranslations('Features');

  const features = [
    {
      icon: <LanguageIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
      title: t('languages.title'),
      description: t('languages.description')
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: '#10b981' }} />,
      title: t('speed.title'),
      description: t('speed.description')
    },
    {
      icon: <VolumeUpIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      title: t('volume.title'),
      description: t('volume.description')
    },
    {
      icon: <TranslateIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      title: t('quality.title'),
      description: t('quality.description')
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40, color: '#ef4444' }} />,
      title: t('platforms.title'),
      description: t('platforms.description')
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#06b6d4' }} />,
      title: t('privacy.title'),
      description: t('privacy.description')
    }
  ];

  return (
    <Box sx={{ py: 10, px: 2, backgroundColor: 'rgba(0,0,0,0.2)' }}>
      <Typography variant="h3" align="center" sx={{ mb: 8, fontWeight: 700 }}>
        {t('title')}
      </Typography>
      
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card sx={{ 
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                '&:hover': {
                  transform: 'translateY(-5px)',
                  transition: 'transform 0.3s ease',
                  borderColor: 'rgba(99, 102, 241, 0.5)'
                }
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};