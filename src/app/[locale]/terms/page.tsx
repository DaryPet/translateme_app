// src/app/[locale]/terms/page.tsx
import React from 'react';
import { Box, Container } from '@mui/material';
import TermsContent from '../../../components/Terms/TermsContent';

export default function TermsPage() {
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
        <TermsContent />
      </Container>
    </Box>
  );
}
