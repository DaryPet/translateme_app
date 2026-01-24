'use client';

import React from 'react';
import {
  Box, Typography, Chip, useMediaQuery,
  Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, Variants, useInView } from 'framer-motion';
import { useMessages, useTranslations } from 'next-intl';

type NodeId = 'feelings' | 'boundaries' | 'trust' | 'communication' | 'expectations' | 'timing';
type Labels = Record<NodeId, string>;
type Prompts = Record<NodeId, string[]>;

export const HeartAtlas: React.FC = () => {
  // Тексты-ярлыки берём через t()
  const t = useTranslations('LoveTarot.map');

  const labels: Labels = {
    feelings: t('labels.feelings'),
    boundaries: t('labels.boundaries'),
    trust: t('labels.trust'),
    communication: t('labels.communication'),
    expectations: t('labels.expectations'),
    timing: t('labels.timing'),
  };

  // Массивы вопросов читаем сырыми из словаря через useMessages (без returnObjects)
  const messages = useMessages() as any;
  const promptsFromDict: Partial<Prompts> =
    messages?.LoveTarot?.map?.prompts ?? {};

  // Гарантируем наличие массивов даже если чего-то нет в локали
  const prompts: Prompts = {
    feelings: Array.isArray(promptsFromDict.feelings) ? promptsFromDict.feelings : [],
    communication: Array.isArray(promptsFromDict.communication) ? promptsFromDict.communication : [],
    trust: Array.isArray(promptsFromDict.trust) ? promptsFromDict.trust : [],
    expectations: Array.isArray(promptsFromDict.expectations) ? promptsFromDict.expectations : [],
    boundaries: Array.isArray(promptsFromDict.boundaries) ? promptsFromDict.boundaries : [],
    timing: Array.isArray(promptsFromDict.timing) ? promptsFromDict.timing : [],
  };

  const [openId, setOpenId] = React.useState<NodeId | null>(null);

  const width = 1000, height = 360;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });
  const uid = React.useId();
  const isMobile = useMediaQuery('(max-width:768px)');

  const nodes = [
    { id: 'feelings',       label: labels.feelings,       x: 12, y: 36 },
    { id: 'communication',  label: labels.communication,  x: 30, y: 20 },
    { id: 'trust',          label: labels.trust,          x: 48, y: 44 },
    { id: 'expectations',   label: labels.expectations,   x: 70, y: 28 },
    { id: 'boundaries',     label: labels.boundaries,     x: 86, y: 54 },
    { id: 'timing',         label: labels.timing,         x: 58, y: 70 },
  ] as const;

  const links: Array<[NodeId, NodeId]> = [
    ['feelings','communication'],
    ['communication','trust'],
    ['trust','expectations'],
    ['expectations','boundaries'],
    ['trust','timing'],
    ['communication','timing'],
  ];

  const lineV: Variants = {
    hidden: { pathLength: 0, opacity: 1 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.1, ease: 'easeOut', delay: i * 0.08 }
    })
  };

  const nodeV: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: 0.25 + i * 0.05 }
    })
  };

  const handleOpen = (id: NodeId) => setOpenId(id);
  const handleClose = () => setOpenId(null);

  return (
    <Box sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: 3,
      background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.18))',
      border: '1px solid rgba(216,183,221,.25)',
    }}>
      <Typography variant="h5" component="h3" sx={{
        mb: 2, fontWeight: 800, letterSpacing: .4,
        background: 'linear-gradient(90deg,#fff,#D8B7DD)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        {t('title')}
      </Typography>

      <Box ref={ref}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label={t('title')}
          role="img"
        >
          <defs>
            <radialGradient id={`heart-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#D8B7DD" stopOpacity="0.18" />
            </radialGradient>
            <filter id={`glow-${uid}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* мягкие «ауры» — scale вместо анимации r */}
          <g opacity="0.6">
            <motion.circle
              cx={220} cy={140} r={110} fill={`url(#heart-${uid})`}
              style={{ transformOrigin: '220px 140px' }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.045, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx={720} cy={220} r={90} fill={`url(#heart-${uid})`}
              style={{ transformOrigin: '720px 220px' }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            />
          </g>

          {/* связи */}
          <g>
            {links.map(([a, b], i) => {
              const A = nodes.find(n => n.id === a)!;
              const B = nodes.find(n => n.id === b)!;
              const x1 = (A.x / 100) * width, y1 = (A.y / 100) * height;
              const x2 = (B.x / 100) * width, y2 = (B.y / 100) * height;
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(216,183,221,.65)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  variants={lineV}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  custom={i}
                  style={{ filter: isMobile ? undefined : `url(#glow-${uid})` }}
                />
              );
            })}
          </g>

          {/* узлы */}
          <g>
            {nodes.map((n, i) => {
              const cx = (n.x / 100) * width, cy = (n.y / 100) * height;
              return (
                <motion.g
                  key={n.id}
                  variants={nodeV}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  custom={i}
                  onClick={() => handleOpen(n.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(n.id); }}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <motion.circle
                    cx={cx} cy={cy} r={8} fill="#fff" opacity={0.9}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <circle cx={cx} cy={cy} r={18} fill={`url(#heart-${uid})`} opacity={0.55} />
                  <text
                    x={cx + 14}
                    y={cy + 4}
                    fontSize={14}
                    fill="rgba(255,255,255,.85)"
                    style={{ fontWeight: 700, letterSpacing: .2, userSelect: 'none' }}
                  >
                    {n.label}
                  </text>
                  {/* увеличенная прозрачная зона для лёгкого тапа */}
                  <circle cx={cx} cy={cy} r={22} fill="transparent" pointerEvents="visible" />
                </motion.g>
              );
            })}
          </g>
        </svg>
      </Box>

      {/* легенда */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        <Chip size="small" label={labels.feelings} onClick={() => handleOpen('feelings')} />
        <Chip size="small" label={labels.communication} onClick={() => handleOpen('communication')} />
        <Chip size="small" label={labels.trust} onClick={() => handleOpen('trust')} />
        <Chip size="small" label={labels.expectations} onClick={() => handleOpen('expectations')} />
        <Chip size="small" label={labels.boundaries} onClick={() => handleOpen('boundaries')} />
        <Chip size="small" label={labels.timing} onClick={() => handleOpen('timing')} />
      </Box>

      {/* диалог с вопросами */}
      <Dialog open={Boolean(openId)} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {openId ? labels[openId] : ''}
          <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {openId && (
            <List>
              {prompts[openId].map((q, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText
                    primaryTypographyProps={{ sx: { whiteSpace: 'pre-wrap' } }}
                    primary={`• ${q}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
