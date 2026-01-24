'use client';
import React from 'react';
import { ConstellationGraph, type GraphNode, type GraphLink, type Aura } from './ConstellationGraph';
import { useTranslations } from 'next-intl';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Box } from '@mui/material';

export const TarotConstellation: React.FC = () => {
  const t = useTranslations('TarotAIPage.map');

  const labels = {
    past: t('labels.past'),
    present: t('labels.present'),
    decision: t('labels.decision'),
    future: t('labels.future'),
    advice: t('labels.advice'),
    hidden: t('labels.hidden'),
  };

  const nodes: GraphNode[] = [
    { id: 'past',    label: labels.past,    x: 8,  y: 38 },
    { id: 'present', label: labels.present, x: 28, y: 22 },
    { id: 'decision',label: labels.decision,x: 48, y: 45 },
    { id: 'future',  label: labels.future,  x: 72, y: 28 },
    { id: 'advice',  label: labels.advice,  x: 88, y: 54 },
    { id: 'hidden',  label: labels.hidden,  x: 58, y: 70 },
  ];

  const links: GraphLink[] = [
    ['past','present'], ['present','decision'], ['decision','future'],
    ['future','advice'], ['decision','hidden'], ['present','hidden'],
  ];

  const auras: Aura[] = [
    { cx: 200, cy: 140, r: 110, scaleTo: 1.045, duration: 8, opacity: 1 },
    { cx: 700, cy: 220, r: 90,  scaleTo: 1.10,  duration: 7, delay: 1.2, opacity: 1 },
  ];

  return (
    <ConstellationGraph
      title={t('title')}
      nodes={nodes}
      links={links}
      auras={auras}
      legendLabels={[
        labels.past, labels.present, labels.decision, labels.future, labels.advice, labels.hidden,
      ]}
      tooltipForNode={(n) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon fontSize="inherit" />
          <span>{n.label}</span>
        </Box>
      )}
    />
  );
};
