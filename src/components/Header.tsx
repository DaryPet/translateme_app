'use client';

import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';

export const Header = () => {
  const t = useTranslations('Header');

  // Функция для плавного скролла к якорю
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        top: 0,
        zIndex: 1100,
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
            {/* <Button
              onClick={() => scrollToSection('features')}
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('features')}
            </Button> */}
            <Button
              component={Link}
              href="/#features"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('features')}
            </Button>
            <Button
              component={Link}
              href="/subscriptions"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('pricing')}
            </Button>
            {/* <Button
              onClick={() => scrollToSection('how-it-works')}
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('howItWorks')}
            </Button> */}
            <Button
              component={Link}
              href="/#how-it-works"
              sx={{ color: 'white', '&:hover': { color: '#a5b4fc' } }}
            >
              {t('howItWorks')}
            </Button>
          </Box>

          {/* Кнопка установки */}
          <Button
            variant="contained"
            href="https://chromewebstore.google.com"
            target="_blank"
            sx={{
              display: { xs: 'none', sm: 'none', md: 'inline-flex'},
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              px: 3,
            }}
          >
            {t('install')}
          </Button>

          {/* Переключатель языка */}
          <LanguageSwitcher />
          {/* Бургер-меню (только на мобильных) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <MobileMenu />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
