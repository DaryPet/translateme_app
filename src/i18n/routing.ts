import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'uk', 'ru', 'es'],
  defaultLocale: 'en',
});
