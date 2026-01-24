'use client';

import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TranslateIcon from '@mui/icons-material/Translate';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');

  const steps = [
    {
      icon: <InstallDesktopIcon sx={{ fontSize: 50, color: '#6366f1' }} />,
      title: t('step1.title'),
      description: t('step1.description')
    },
    {
      icon: <PlayArrowIcon sx={{ fontSize: 50, color: '#10b981' }} />,
      title: t('step2.title'),
      description: t('step2.description')
    },
    {
      icon: <TranslateIcon sx={{ fontSize: 50, color: '#8b5cf6' }} />,
      title: t('step3.title'),
      description: t('step3.description')
    }
  ];

  return (
    <Box sx={{ py: 10, px: 2 }}>
      <Typography variant="h3" align="center" sx={{ mb: 8, fontWeight: 700 }}>
        {t('title')}
      </Typography>
      
      <Grid container spacing={4} justifyContent="center">
        {steps.map((step, index) => (
          <Grid item xs={12} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
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
                  transition: 'transform 0.3s ease'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    {step.description}
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