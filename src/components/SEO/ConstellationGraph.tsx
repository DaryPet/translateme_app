'use client';
import React from 'react';
import { Box, Chip, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { motion, type Variants, useInView } from 'framer-motion';

export type GraphNode = {
  id: string;
  label: string;
  /** координаты в % относительно viewBox (0..100) */
  x: number;
  y: number;
};

export type GraphLink = [string, string];

export type Aura = {
  cx: number;
  cy: number;
  r: number;
  /** во сколько раз «дышать» (по умолчанию 1.05–1.1) */
  scaleTo?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
};

type ConstellationGraphProps = {
  title?: string;
  nodes: GraphNode[];
  links: GraphLink[];
  /** ширина/высота viewBox, визуально компонент растягивается на 100% ширины контейнера */
  width?: number;
  height?: number;

  /** параметры градиента «ауры» */
  gradientInner?: string;             // #fff
  gradientOuter?: string;             // #D8B7DD
  gradientOuterOpacity?: number;      // 0.15..0.2

  /** список «аур» на фоне */
  auras?: Aura[];

  /** показать подписи рядом с точками */
  showLabels?: boolean;

  /** отключить свечение линий на мобилке (по умолчанию отключаем) */
  disableGlowOnMobile?: boolean;

  /** легенда внизу */
  legendLabels?: string[];

  /** клик по узлу */
  onNodeClick?: (id: string) => void;

  /** произвольная подсказка для узла; если не задана — Tooltip не используется */
  tooltipForNode?: (n: GraphNode) => React.ReactNode;

  /** стили контейнера карточки */
  containerSx?: any;
};

export const ConstellationGraph: React.FC<ConstellationGraphProps> = ({
  title,
  nodes,
  links,
  width = 1000,
  height = 360,
  gradientInner = '#fff',
  gradientOuter = '#D8B7DD',
  gradientOuterOpacity = 0.15,
  auras = [],
  showLabels = true,
  disableGlowOnMobile = true,
  legendLabels,
  onNodeClick,
  tooltipForNode,
  containerSx,
}) => {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-20% 0px' });
  const uid = React.useId();
  const isMobile = useMediaQuery('(max-width:768px)');

  const lineVariants: Variants = {
    hidden: { pathLength: 0, opacity: 1 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.1, ease: 'easeOut', delay: i * 0.08 },
    }),
  };

  const nodeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: 0.25 + i * 0.05 },
    }),
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.18))',
        border: '1px solid rgba(216,183,221,.25)',
        ...containerSx,
      }}
    >
      {title && (
        <Typography
          variant="h5"
          component="h3"
          sx={{
            mb: 2,
            fontWeight: 800,
            letterSpacing: .4,
            background: 'linear-gradient(90deg,#fff,#D8B7DD)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>
      )}

      <Box ref={cardRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={title || 'constellation-graph'}
        >
          <defs>
            <radialGradient id={`grad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={gradientInner} stopOpacity="1" />
              <stop offset="100%" stopColor={gradientOuter} stopOpacity={gradientOuterOpacity} />
            </radialGradient>
            <filter id={`glow-${uid}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ауры (анимация через scale, НЕ через r) */}
          {auras.length > 0 && (
            <g opacity="0.6">
              {auras.map((a, idx) => (
                <motion.circle
                  key={idx}
                  cx={a.cx}
                  cy={a.cy}
                  r={a.r}
                  fill={`url(#grad-${uid})`}
                  style={{ transformOrigin: `${a.cx}px ${a.cy}px` }}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, a.scaleTo ?? 1.06, 1] }}
                  transition={{ duration: a.duration ?? 8, repeat: Infinity, ease: 'easeInOut', delay: a.delay ?? 0 }}
                  opacity={a.opacity ?? 1}
                />
              ))}
            </g>
          )}

          {/* Связи */}
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
                  variants={lineVariants}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  custom={i}
                  style={{ filter: disableGlowOnMobile && isMobile ? undefined : `url(#glow-${uid})` }}
                />
              );
            })}
          </g>

          {/* Узлы */}
          <g>
            {nodes.map((n, i) => {
              const cx = (n.x / 100) * width, cy = (n.y / 100) * height;
              const dot = (
                <motion.g
                  key={n.id}
                  variants={nodeVariants}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  custom={i}
                  onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
                  role={onNodeClick ? 'button' : undefined}
                  tabIndex={onNodeClick ? 0 : undefined}
                  style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                >
                  {/* фиксированный r, «дыхание» через scale → нет r=undefined */}
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill="#fff"
                    opacity={0.9}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <circle cx={cx} cy={cy} r={18} fill={`url(#grad-${uid})`} opacity={0.55} />
                  {showLabels && (
                    <text
                      x={cx + 14}
                      y={cy + 4}
                      fontSize={14}
                      fill="rgba(255,255,255,.85)"
                      style={{ fontWeight: 700, letterSpacing: .2, userSelect: 'none' }}
                    >
                      {n.label}
                    </text>
                  )}
                  {/* enlarged hit-area for touch */}
                  {onNodeClick && <circle cx={cx} cy={cy} r={22} fill="transparent" pointerEvents="visible" />}
                </motion.g>
              );

              return tooltipForNode ? (
                <Tooltip key={n.id} title={tooltipForNode(n)}>{dot}</Tooltip>
              ) : (
                dot
              );
            })}
          </g>
        </svg>
      </Box>

      {legendLabels && legendLabels.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {legendLabels.map((l, i) => <Chip key={i} size="small" label={l} />)}
        </Box>
      )}
    </Box>
  );
};
