
// // app/[locale]/page.tsx
// import React from 'react';
// import { Box, Container } from '@mui/material';
// import {HeroSection} from 'src/components/Hero';
// import {HowItWorks } from 'src/components/HowItWorks';
// import { FeaturesGrid } from 'src/components/FeaturesGrid';
// // import FeaturesSection from '@/components/home/FeaturesSection';
// // import PricingSection from '@/components/home/PricingSection';
// // import CTASection from '@/components/home/CTASection';

// export const revalidate = 60;

// export default async function HomePage() {
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
//         minHeight: '100vh',
//         color: 'white',
//       }}
//     >
//       <Container sx={{ flexGrow: 1 }}>
//         <HeroSection />
//         <HowItWorks />
//         <FeaturesGrid />
//         {/* <PricingSection />
//         <CTASection /> */}
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
        
        {/* Якорь для How It Works */}
        <Box id="how-it-works">
          <HowItWorks />
        </Box>
        
        {/* Якорь для Features */}
        <Box id="features">
          <FeaturesGrid />
        </Box>
        
        {/* Якорь для Pricing - пока заглушка */}
        <Box id="pricing" sx={{ py: 10 }}>
          {/* Здесь будет PricingSection когда разкомментируете */}
          {/* <PricingSection /> */}
        </Box>
        
        {/* <CTASection /> */}
      </Container>
    </Box>
  );
}