'use client';

import { Box } from '@mui/material';
import { useRef } from 'react';

export const Spotlight = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ref.current!.style.setProperty('--x', `${x}px`);
    ref.current!.style.setProperty('--y', `${y}px`);
  };

  return (
    <Box
      ref={ref}
      onMouseMove={onMouseMove}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(600px circle at var(--x) var(--y), rgba(99,102,241,.15), transparent 40%)',
          opacity: 0,
          transition: 'opacity .3s ease',
        },
        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      {children}
    </Box>
  );
};
