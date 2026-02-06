// 'use client';

// import React, { useState } from 'react';
// import { IconButton, Drawer, Box, List, ListItem, ListItemButton } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
// import Link from 'next/link';
// import { useTranslations } from 'next-intl';
// import { LanguageSwitcher } from './LanguageSwitcher';

// export const MobileMenu: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const t = useTranslations('Header');

//   const toggleDrawer = (state: boolean) => () => setOpen(state);

//   return (
//     <>
//       <IconButton onClick={toggleDrawer(true)} sx={{ color: 'white', display: { xs: 'flex', md: 'none' } }}>
//         <MenuIcon />
//       </IconButton>

//       <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
//         <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
//           <List>
//             <ListItem disablePadding>
//               <ListItemButton component={Link} href="/#features">
//                 {t('features')}
//               </ListItemButton>
//             </ListItem>
//             <ListItem disablePadding>
//               <ListItemButton component={Link} href="/subscriptions">
//                 {t('pricing')}
//               </ListItemButton>
//             </ListItem>
//             <ListItem disablePadding>
//               <ListItemButton component={Link} href="/#how-it-works">
//                 {t('howItWorks')}
//               </ListItemButton>
//             </ListItem>
//             <ListItem disablePadding>
//               <ListItemButton component="a" href="https://chromewebstore.google.com" target="_blank">
//                 {t('install')}
//               </ListItemButton>
//             </ListItem>
//             <ListItem disablePadding>
//               <LanguageSwitcher />
//             </ListItem>
//           </List>
//         </Box>
//       </Drawer>
//     </>
//   );
// };

'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export const MobileMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Header');

  const toggleDrawer = (state: boolean) => () => setOpen(state);

  return (
    <>
      {/* Бургер */}
      <IconButton
        onClick={toggleDrawer(true)}
        sx={{
          color: 'white',
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 260,
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            color: 'white',
          },
        }}
      >
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          sx={{ pt: 2 }}
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href="/#features"
                sx={{
                  px: 3,
                  '&:hover': { color: '#a5b4fc' },
                }}
              >
                <ListItemText primary={t('features')} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href="/subscriptions"
                sx={{
                  px: 3,
                  '&:hover': { color: '#a5b4fc' },
                }}
              >
                <ListItemText primary={t('pricing')} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href="/#how-it-works"
                sx={{
                  px: 3,
                  '&:hover': { color: '#a5b4fc' },
                }}
              >
                <ListItemText primary={t('howItWorks')} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                component="a"
                href="https://chromewebstore.google.com"
                target="_blank"
                sx={{
                  px: 3,
                  '&:hover': { color: '#a5b4fc' },
                }}
              >
                <ListItemText primary={t('install')} />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* LanguageSwitcher аккуратно по центру */}
          <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
            <LanguageSwitcher />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};