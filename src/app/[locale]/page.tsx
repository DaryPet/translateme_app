// src/app/[locale]/page.tsx
// import React from 'react';
// import { Box, Container } from '@mui/material';
// import { Hero } from '@/components/Hero';
// import { About } from '@/components/About';
// import QuestionFormContainer from '@/components/QuestionFormContainer';
// import { FreeCardsOffer } from '@/components/Cards/FreeCardsOffer';
// import { InstallPWAButton } from '@/components/InstallPWAButton';
// // 🔄 Настройка ISR: пересобирать страницу каждые 60 сек
// export const revalidate = 60;

// // 🔁 Асинхронный компонент (можно использовать fetch, загрузку переводов и т.д.)
// export default async function HomePage() {
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         backgroundImage: 'url("/background.webp")',
//         minHeight: '100vh',
//       }}
//     >
//       <Container sx={{ flexGrow: 1 }}>
//         <InstallPWAButton />
//         <Hero />
//         <FreeCardsOffer />
//         <QuestionFormContainer />
//         <About />
//       </Container>
//     </Box>
//   );
// }

// app/[locale]/page.tsx
import React from 'react';
import { Box, Container } from '@mui/material';
import {HeroSection} from 'src/components/Hero';
import {HowItWorks } from 'src/components/HowItWorks';
import { FeaturesGrid } from 'src/components/FeaturesGrid';
// import FeaturesSection from '@/components/home/FeaturesSection';
// import PricingSection from '@/components/home/PricingSection';
// import CTASection from '@/components/home/CTASection';

export const revalidate = 60;

export default async function HomePage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        minHeight: '100vh',
        color: 'white',
      }}
    >
      <Container sx={{ flexGrow: 1 }}>
        <HeroSection />
        <HowItWorks />
        <FeaturesGrid />
        {/* <PricingSection />
        <CTASection /> */}
      </Container>
    </Box>
  );
}
