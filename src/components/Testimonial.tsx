import React from 'react';
import { Stack, Avatar, Typography, Link } from '@mui/material';

export const Testimonial: React.FC = () => (
  <Stack direction="row" spacing={2} sx={{ mt: 4, alignItems: 'center' }}>
    <Avatar
      src="/images/alice-2.webp"
      alt="Alice"
      sx={{ width: 40, height: 40 }}
      imgProps={{ loading: 'lazy' }}
    />
    <Typography variant="body2" sx={{ color: '#EAE0D5' }}>
      «This reading changed how I view my day-to-day – truly eye-opening!»
      <Link href="#" underline="hover" sx={{ ml: 1, color: '#D8B7DD' }}>
        — Alice, NY
      </Link>
    </Typography>
  </Stack>
);
