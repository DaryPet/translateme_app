'use client';

import { Card } from '@mui/material';
import { Spotlight } from './Spotlight';
import { glass, glow } from './themeTokens';

export const GlowCard = ({ children }: { children: React.ReactNode }) => (
  <Spotlight>
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        background: glass.background,
        border: glass.border,
        backdropFilter: glass.blur,
        transition: 'all .35s ease',
        boxShadow: glow.sm,

        '&:hover': {
          transform: 'translateY(-10px)',
          boxShadow: glow.md,
        },
      }}
    >
      {children}
    </Card>
  </Spotlight>
);
