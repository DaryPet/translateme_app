'use client';

import { ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from 'src/lib/theme';

// store больше не импортируем - удалили


export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    // Убираем <Provider store={store}> - Redux больше не нужен
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};