'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { useNavItems } from './useNavItems';

export const DashboardCards: React.FC = () => {
  const { items } = useNavItems();
  return (
    <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', sm:'1fr 1fr', md:'repeat(3, 1fr)' }, gap:2 }}>
      {items.map(it => (
        <Card key={it.key} sx={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'#fff', borderRadius:3 }}>
          <CardActionArea component={Link} href={it.href} sx={{ p:2 }}>
            <Box sx={{ fontSize:0, color:'#D8B7DD', mb:1 }}>{it.icon}</Box>
            <CardContent sx={{ p:0 }}>
              <Typography sx={{ fontWeight:800, mb:.5 }}>{it.label}</Typography>
              {/* Можно добавить подзаголовок из локалей Nav.descr.<key> */}
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};
