import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages } from 'src/i18n/request';
import { Header } from 'src/components/Header';
import { Toaster } from 'react-hot-toast';
import { Footer } from 'src/components/Footer';
import { Box, Container } from '@mui/material';

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'uk' }, { locale: 'ru' }, { locale: 'es' }];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await Promise.resolve(params);
  const messages = await getMessages(locale);

  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://translateme.app';
  const fullUrl = `${baseUrl}/${locale}`;
  // УДАЛИТЬ или поменять на свой og-image
  const ogImage = `${baseUrl}/og-image.png`; // Временная заглушка

  return {
    title: messages.page_title, // Будет браться из файлов перевода
    description: messages.page_description, // Будет браться из файлов перевода
    openGraph: {
      title: messages.page_title,
      description: messages.page_description,
      url: fullUrl,
      siteName: 'TranslateMe', // МЕНЯЕМ: SoulDestiny → TranslateMe
      images: [{ url: ogImage, width: 1200, height: 630, alt: `TranslateMe for ${locale}` }], // МЕНЯЕМ alt
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: messages.page_title,
      description: messages.page_description,
      images: [ogImage],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: messages.page_title, // Будет из переводов
        url: fullUrl,
        inLanguage: locale,
        description: messages.page_description, // Будет из переводов
      }),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = await Promise.resolve(params);
  let messages;
  try {
    messages = await getMessages(locale);
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Toaster position="top-right" />
        <Header /> {/* Этот компонент нужно будет переделать позже */}

        {/* SideRail - удалить или переделать позже, не нужен для лендинга */}
        {/* <SideRail /> */}

        {/* УДАЛЯЕМ фоновое изображение (background.webp) или меняем на своё */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            background: 'linear-gradient(135deg, #0a0e1a 0%, #141825 100%)',
          }}
        >
          <Box
            sx={{
              pt: 2,
              px: { xs: 0, sm: 4 },
              '@media (min-width:701px)': {
                px: '64px',
              },
            }}
          >
            <Container maxWidth="lg" sx={{ mx: 'auto' }}>
              {children}
            </Container>
          </Box>
        </Box>

        <Footer /> 
      </div>
    </NextIntlClientProvider>
  );
}