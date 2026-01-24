// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
// import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
// import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
// import { useTranslations } from 'next-intl';
// import { useNavItems } from './useNavItems';

// export const GlassBurger: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const { items } = useNavItems();
//   const t = useTranslations('Nav');

//   return (
//     <>
//       <IconButton onClick={() => setOpen(true)} sx={{ color:'#9b7db6' }}>
//         <MenuRoundedIcon />
//       </IconButton>

//       <Drawer anchor="right" open={open} onClose={() => setOpen(false)}
//         PaperProps={{ sx:{
//           width: 320, background:'rgba(23,18,32,.85)', backdropFilter:'blur(16px)',
//           borderTopLeftRadius:3, borderBottomLeftRadius:3, color:'#fff', p:2
//         }}}>
//         <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1 }}>
//           <Typography sx={{ fontWeight:800, letterSpacing:.3 }}>{t('menu')}</Typography>
//           <IconButton onClick={() => setOpen(false)} sx={{ color:'#D8B7DD' }}><CloseRoundedIcon/></IconButton>
//         </Box>
//         <List>
//           {items.map(it => (
//             <ListItemButton key={it.key} component={Link} href={it.href} onClick={() => setOpen(false)}
//               sx={{ borderRadius:2, mb:.75, background:'rgba(255,255,255,.04)',
//                 '&:hover':{ background:'rgba(216,183,221,.18)' } }}>
//               <ListItemIcon sx={{ color:'#D8B7DD', minWidth:40 }}>{it.icon}</ListItemIcon>
//               <ListItemText primary={it.label}/>
//             </ListItemButton>
//           ))}
//         </List>
//       </Drawer>
//     </>
//   );
// };
