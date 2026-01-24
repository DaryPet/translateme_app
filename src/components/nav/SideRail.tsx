// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
// import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
// import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
// import { useNavItems } from './useNavItems';

// type Props = { width?: number };

// export const SideRail: React.FC<Props> = ({ width = 240 }) => {
//   const { items } = useNavItems();
//   const [open, setOpen] = useState(true);
//   const [mobile, setMobile] = useState(false);

//   // mobile drawer
//   const Mobile = (
//     <Drawer
//       open={mobile}
//       onClose={() => setMobile(false)}
//       PaperProps={{ sx: { width, background: 'rgba(15,10,19,.92)', backdropFilter: 'blur(10px)' } }}
//     >
//       <Box sx={{ p: 1 }}>
//         <IconButton onClick={() => setMobile(false)} sx={{ color: '#D8B7DD' }}><ChevronLeftRoundedIcon/></IconButton>
//       </Box>
//       <List>
//         {items.map(it => (
//           <ListItemButton key={it.key} component={Link} href={it.href} onClick={() => setMobile(false)}
//             sx={{ color:'#fff', borderRadius:2, mx:1, mb:.5, '&:hover':{ background:'rgba(216,183,221,.12)' } }}>
//             <ListItemIcon sx={{ color:'#D8B7DD', minWidth:40 }}>{it.icon}</ListItemIcon>
//             <ListItemText primary={it.label}/>
//           </ListItemButton>
//         ))}
//       </List>
//     </Drawer>
//   );

//   return (
//     <>
//       {/* burger only xs */}
//       <Box sx={{ display:{ xs:'block', md:'none' }, position:'fixed', top:12, left:12, zIndex:1301 }}>
//         <IconButton onClick={() => setMobile(true)} sx={{ color:'#D8B7DD' }}><MenuRoundedIcon/></IconButton>
//       </Box>

//       {/* permanent rail on md+ */}
//       <Drawer variant="permanent" sx={{
//         display:{ xs:'none', md:'block' },
//         '& .MuiDrawer-paper':{
//           width: open ? width : 80,
//           transition:'width .25s',
//           background:'rgba(15,10,19,.6)',
//           backdropFilter:'blur(10px)',
//           borderRight:'1px solid rgba(255,255,255,.08)',
//           color:'#fff'
//         }
//       }} open>
//         <Box sx={{ p:1.5, display:'flex', justifyContent: open ? 'flex-end':'center' }}>
//           <IconButton onClick={() => setOpen(v=>!v)} sx={{ color:'#D8B7DD' }}>
//             {open ? <ChevronLeftRoundedIcon/> : <MenuRoundedIcon/>}
//           </IconButton>
//         </Box>
//         <List sx={{ px:1 }}>
//           {items.map(it => {
//             const btn = (
//               <ListItemButton key={it.key} component={Link} href={it.href}
//                 sx={{ borderRadius:2, mb:.5, '&:hover':{ background:'rgba(216,183,221,.12)' } }}>
//                 <ListItemIcon sx={{ color:'#D8B7DD', minWidth:40 }}>{it.icon}</ListItemIcon>
//                 {open && <ListItemText primary={it.label}/>}
//               </ListItemButton>
//             );
//             return open ? btn : <Tooltip key={it.key} title={it.label} placement="right">{btn}</Tooltip>;
//           })}
//         </List>
//       </Drawer>

//       {Mobile}
//     </>
//   );
// };

// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import {
//   Box,
//   Drawer,
//   IconButton,
//   List,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Tooltip,
// } from '@mui/material';
// import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
// import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
// import { useNavItems } from './useNavItems';

// type Props = { width?: number };

// export const SideRail: React.FC<Props> = ({ width = 240 }) => {
//   const { items } = useNavItems();
//   const [open, setOpen] = useState(true);

//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         display: { xs: 'none', md: 'block' }, // планшет и десктоп
//         '& .MuiDrawer-paper': {
//           width: open ? width : 80,
//           transition: 'width .25s',
//           background: 'rgba(15,10,19,.6)',
//           backdropFilter: 'blur(10px)',
//           borderRight: '1px solid rgba(255,255,255,.08)',
//           color: '#fff',
//         },
//       }}
//       open
//     >
//       {/* Кнопка сворачивания/разворачивания */}
//       <Box
//         sx={{
//           p: 1.5,
//           display: 'flex',
//           justifyContent: open ? 'flex-end' : 'center',
//         }}
//       >
//         <IconButton onClick={() => setOpen((v) => !v)} sx={{ color: '#D8B7DD' }}>
//           {open ? <ChevronLeftRoundedIcon /> : <MenuRoundedIcon />}
//         </IconButton>
//       </Box>

//       {/* Список ссылок */}
//       <List sx={{ px: 1 }}>
//         {items.map((it) => {
//           const btn = (
//             <ListItemButton
//               key={it.key}
//               component={Link}
//               href={it.href}
//               sx={{
//                 borderRadius: 2,
//                 mb: 0.5,
//                 '&:hover': { background: 'rgba(216,183,221,.12)' },
//               }}
//             >
//               <ListItemIcon sx={{ color: '#D8B7DD', minWidth: 40 }}>
//                 {it.icon}
//               </ListItemIcon>
//               {open && <ListItemText primary={it.label} />}
//             </ListItemButton>
//           );
//           return open ? (
//             btn
//           ) : (
//             <Tooltip key={it.key} title={it.label} placement="right">
//               {btn}
//             </Tooltip>
//           );
//         })}
//       </List>
//     </Drawer>
//   );
// };

'use client';

import React from 'react';
import Link from 'next/link';
import { Box, IconButton, Tooltip } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useNavItems } from './useNavItems';

export const SideRail: React.FC = () => {
  const { items } = useNavItems();
  const pathname = usePathname();

  const isActive = (href: string) => {
    const base = href.split('#')[0];
    return pathname?.startsWith(base);
  };

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 120,
        bgcolor: 'rgba(15,10,19,0.60)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',

        // скрываем на мобилке
        '@media (max-width:700px)': {
          display: 'none',
        },
      }}
    >
      {/* 🔑 отступ сверху */}
      <Box sx={{ mt: 3 }} />

      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Tooltip key={item.key} title={item.label} placement="right" arrow>
            <Link
              href={item.href}
              style={{ textDecoration: 'none' }}
              aria-label={item.label}
            >
              <IconButton
                sx={{
                  width: 44,
                  height: 44,
                  mb: 2,
                  borderRadius: 2,
                  color: active ? '#D8B7DD' : '#FFFFFF',
                  bgcolor: active ? 'rgba(216,183,221,0.18)' : 'transparent',
                  transition: 'background .2s ease, color .2s ease',
                  '&:hover': {
                    bgcolor: active
                      ? 'rgba(216,183,221,0.24)'
                      : 'rgba(255,255,255,0.14)',
                  },
                }}
              >
                {item.icon}
              </IconButton>
            </Link>
          </Tooltip>
        );
      })}
    </Box>
  );
};
