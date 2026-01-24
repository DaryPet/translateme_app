// src/app/[locale]/tarot-ai/page.tsx
import React from 'react';
import { Box } from '@mui/material';
import { TarotAIComponent } from 'src/components/SEO/TarotAiComponent';


export const metadata = {
  title: 'Tarot AI - Advanced Artificial Intelligence Tarot Readings',
  description:
    'Tarot AI for clear, accurate readings with artificial intelligence. Ask follow-up questions, explore spreads, and get actionable guidance on love, career, and decisions.',
  keywords: ['tarot ai', 'ai tarot', 'artificial intelligence tarot'],
  alternates: { canonical: 'https://soul-destiny/tarot-ai' },
  robots: { index: true, follow: true },
};

export const revalidate = 60;

export default function TarotAIPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url("/background.webp")',
        minHeight: '100vh',
      }}
    >
      <TarotAIComponent />
    </Box>
  );
}
