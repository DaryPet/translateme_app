'use client';
import React from 'react';
import { ConstellationGraph, type GraphNode, type GraphLink, type Aura } from './ConstellationGraph';
import { useMessages, useTranslations } from 'next-intl';
import { Dialog, DialogTitle, DialogContent, IconButton, List, ListItem, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type NodeId = 'feelings' | 'boundaries' | 'trust' | 'communication' | 'expectations' | 'timing';

export const HeartAtlas: React.FC = () => {
  const t = useTranslations('LoveTarot.map');
  const labels = {
    feelings: t('labels.feelings'),
    boundaries: t('labels.boundaries'),
    trust: t('labels.trust'),
    communication: t('labels.communication'),
    expectations: t('labels.expectations'),
    timing: t('labels.timing'),
  };

  // prompts из словаря
  const messages = useMessages() as any;
  const raw = messages?.LoveTarot?.map?.prompts ?? {};
  const prompts: Record<NodeId, string[]> = {
    feelings: raw.feelings ?? [],
    communication: raw.communication ?? [],
    trust: raw.trust ?? [],
    expectations: raw.expectations ?? [],
    boundaries: raw.boundaries ?? [],
    timing: raw.timing ?? [],
  };

  const nodes: GraphNode[] = [
    { id: 'feelings',       label: labels.feelings,       x: 12, y: 36 },
    { id: 'communication',  label: labels.communication,  x: 30, y: 20 },
    { id: 'trust',          label: labels.trust,          x: 48, y: 44 },
    { id: 'expectations',   label: labels.expectations,   x: 70, y: 28 },
    { id: 'boundaries',     label: labels.boundaries,     x: 86, y: 54 },
    { id: 'timing',         label: labels.timing,         x: 58, y: 70 },
  ];

  const links: GraphLink[] = [
    ['feelings','communication'],
    ['communication','trust'],
    ['trust','expectations'],
    ['expectations','boundaries'],
    ['trust','timing'],
    ['communication','timing'],
  ];

  const auras: Aura[] = [
    { cx: 220, cy: 140, r: 110, scaleTo: 1.045, duration: 8 },
    { cx: 720, cy: 220, r: 90,  scaleTo: 1.10,  duration: 7, delay: 1.2 },
  ];

  const [openId, setOpenId] = React.useState<NodeId | null>(null);

  return (
    <>
      <ConstellationGraph
        title={t('title')}
        nodes={nodes}
        links={links}
        auras={auras}
        legendLabels={[
          labels.feelings, labels.communication, labels.trust,
          labels.expectations, labels.boundaries, labels.timing,
        ]}
        onNodeClick={(id) => setOpenId(id as NodeId)}
      />

      <Dialog open={!!openId} onClose={() => setOpenId(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {openId ? labels[openId] : ''}
          <IconButton onClick={() => setOpenId(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {openId && (
            <List>
              {(prompts[openId] || []).map((q: string, idx: number) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText primaryTypographyProps={{ sx: { whiteSpace: 'pre-wrap' } }} primary={`• ${q}`} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
