// src/app/[locale]/privacy-policy/page.tsx
import React from 'react';
import { Box, Container } from '@mui/material';
import PrivacyContent from '../../../components/Privacy/PrivacyContent';

export default function PrivacyPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url("/background.webp")',
        minHeight: '100vh',
      }}
    >
      <Container sx={{ flexGrow: 1, py: 6 }}>
        <PrivacyContent />
      </Container>
    </Box>
  );
}
