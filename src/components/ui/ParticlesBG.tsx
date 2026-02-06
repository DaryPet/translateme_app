'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Particle = {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export const ParticlesBG = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Генерируем ТОЛЬКО на клиенте
    const generated: Particle[] = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 4 + Math.random() * 4,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 4,
    }));

    setParticles(generated);
  }, []);

  // ❗ ВАЖНО: до client mount ничего не рендерим
  if (particles.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: p.x, y: p.y }}
          animate={{
            opacity: [0, 0.6, 0],
            y: p.y - 120,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(99,102,241,.6)',
            filter: 'blur(1px)',
          }}
        />
      ))}
    </Box>
  );
};
