'use client';

import { AppBar, Toolbar, Typography, Box, Button, IconButton } from '@mui/material';
import Link from 'next/link';
import TranslateIcon from '@mui/icons-material/Translate';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header = () => {
  const t = useTranslations('Header');

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Полупрозрачный тёмный
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Логотип */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TranslateIcon sx={{ color: '#6366f1' }} />
          <Link href="/" passHref style={{ textDecoration: 'none' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'white',
                '&:hover': { color: '#a5b4fc' },
              }}
            >
              TranslateMe
            </Typography>
          </Link>
        </Box>

        {/* Правая часть */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Кнопки навигации (только на десктопе) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button
              component={Link}
              href="#features"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('features')}
            </Button>
            <Button
              component={Link}
              href="#pricing"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('pricing')}
            </Button>
            <Button
              component={Link}
              href="#how-it-works"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('howItWorks')}
            </Button>
          </Box>

          {/* Кнопка установки */}
          <Button
            variant="contained"
            href="https://chromewebstore.google.com" // Замените на реальную ссылку
            target="_blank"
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              px: 3,
            }}
          >
            {t('install')}
          </Button>

          {/* Переключатель языка */}
          <LanguageSwitcher />
        </Box>
      </Toolbar>
    </AppBar>
  );
};