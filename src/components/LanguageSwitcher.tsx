'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Languages } from '../enums/languages';

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLanguage, setSelectedLanguage] = useState<Languages>(
    Languages.EN,
  );

  // Устанавливаем язык по url
  useEffect(() => {
    const locale = (pathname.split('/')[1] as Languages) || Languages.EN;
    setSelectedLanguage(locale);
  }, [pathname]);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value as Languages;
    // Заменяем только первый сегмент пути (язык)
    const pathSegments = pathname.split('/');
    pathSegments[1] = newLanguage;
    const newPath = pathSegments.join('/') || '/';
    router.push(newPath, { scroll: false });
    localStorage.setItem('selectedLanguage', newLanguage);
    setSelectedLanguage(newLanguage);
  };

  return (
    <Select
      value={selectedLanguage}
      onChange={handleLanguageChange}
      sx={{
        color: 'white',
        backgroundColor: 'secondary.main',
        height: '38px',
        marginRight: '10px',
        borderRadius: '6px',
        bgcolor: '#6366f1',
        '&:hover': { bgcolor: '#4f46e5' },
      }}
    >
      <MenuItem value="en">EN</MenuItem>
      <MenuItem value="uk">UK</MenuItem>
      <MenuItem value="ru">RU</MenuItem>
      <MenuItem value="es">ES</MenuItem>
    </Select>
  );
};
