'use client';

import { Box } from '@mui/material';

export const ConnectingLines = () => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      backgroundImage: `
        linear-gradient(
          to right,
          rgba(99,102,241,.15) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          rgba(99,102,241,.15) 1px,
          transparent 1px
        )
      `,
      backgroundSize: '120px 120px',
      maskImage:
        'radial-gradient(circle at center, black 40%, transparent 75%)',
    }}
  />
);
