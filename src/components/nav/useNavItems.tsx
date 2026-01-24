'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

export type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
};

export const useNavItems = () => {
  const t = useTranslations('Nav');
  const locale = useLocale();

  const items: NavItem[] = [
    { key: 'home', href: `/${locale}`, label: t('items.home'), icon: <HomeRoundedIcon /> },
    { key: 'daily', href: `/${locale}/daily-tarot`, label: t('items.daily'), icon: <AutoAwesomeRoundedIcon /> },
    { key: 'love', href: `/${locale}/love-tarot-ai`, label: t('items.love'), icon: <FavoriteRoundedIcon /> },
    { key: 'career', href: `/${locale}/career-tarot`, label: t('items.career'), icon: <EditNoteRoundedIcon /> },
    { key: 'ai', href: `/${locale}/tarot-ai`, label: t('items.ai'), icon: <HubRoundedIcon /> },
    // { key: 'faq', href: `/${locale}/daily-tarot#faq`, label: t('items.faq'), icon: <HelpOutlineRoundedIcon /> },
  ];

  return { items };
};
