// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import { alpha, Box, Dialog, InputBase, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
// import { useNavItems } from './useNavItems';
// import { useTranslations } from 'next-intl';

// export const CommandPalette: React.FC = () => {
//   const { items } = useNavItems();
//   const t = useTranslations('Nav');
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState('');

//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
//         e.preventDefault();
//         setOpen(o => !o);
//       }
//     };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, []);

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return items;
//     return items.filter(i => i.label.toLowerCase().includes(s));
//   }, [items, q]);

//   return (
//     <>
//       <Box sx={{
//         display:'inline-flex', alignItems:'center', gap:.5, px:1, py:.3, borderRadius:1,
//         border:'1px solid rgba(0,0,0,.12)', cursor:'pointer'
//       }} onClick={() => setOpen(true)} title={t('openPalette')}>
//         {/* <Typography sx={{ fontSize:13, opacity:.8 }}>{t('searchCommands')}</Typography> */}
//         <Box sx={{ ml:.5, fontSize:11, opacity:.6, border:'1px solid rgba(0,0,0,.18)', px:.6, borderRadius:.5 }}>⌘K</Box>
//       </Box>

//       <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
//         PaperProps={{ sx:{ background:'rgba(15,10,19,.9)', backdropFilter:'blur(16px)', color:'#fff' } }}>
//         {/* <Box sx={{ p:1.5 }}>
//           <InputBase autoFocus placeholder={t('typeToSearch')}
//             value={q} onChange={e=>setQ(e.target.value)}
//             sx={{
//               width:'100%', px:1.5, py:1, borderRadius:1.5,
//               background: alpha('#fff', .06), border:'1px solid rgba(255,255,255,.12)'
//             }}/>
//         </Box> */}
//         <List sx={{ pt:0 }}>
//           {filtered.map(it => (
//             <ListItemButton key={it.key} component={Link} href={it.href} onClick={()=>setOpen(false)}
//               sx={{ '&:hover':{ background:'rgba(216,183,221,.14)' } }}>
//               <ListItemIcon sx={{ color:'#D8B7DD', minWidth:40 }}>{it.icon}</ListItemIcon>
//               <ListItemText primary={it.label}/>
//             </ListItemButton>
//           ))}
//           {!filtered.length && (
//             <Box sx={{ px:2, py:3, opacity:.7 }}>{t('noResults')}</Box>
//           )}
//         </List>
//       </Dialog>
//     </>
//   );
// };
