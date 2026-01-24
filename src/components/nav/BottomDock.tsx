// 'use client';

// import React from 'react';
// import { Box, Paper, BottomNavigation, BottomNavigationAction, Fab } from '@mui/material';
// import { usePathname, useRouter } from 'next/navigation';
// import { useNavItems } from './useNavItems';
// import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';

// export const BottomDock: React.FC = () => {
//   const { items } = useNavItems();
//   const pathname = usePathname();
//   const router = useRouter();

//   // value должен совпадать с value у BottomNavigationAction,
//   // тогда MUI сам подсветит выбранный пункт.
//   const value = items.find(i => pathname?.startsWith(i.href))?.href ?? '';

//   return (
//     <>
//       {/* Mobile/Tablet bottom dock */}
//       <Paper
//         elevation={6}
//         sx={{
//           position: 'fixed',
//           bottom: 12,
//           left: 12,
//           right: 12,
//           zIndex: 1200,
//           display: { xs: 'block', lg: 'none' },
//           borderRadius: 3,
//           backdropFilter: 'blur(10px)',
//           background: 'rgba(15,10,19,.6)',
//           border: '1px solid rgba(255,255,255,.12)',
//         }}
//       >
//         <BottomNavigation
//           value={value}
//           onChange={(_, newValue: string) => {
//             if (newValue && newValue !== value) router.push(newValue);
//           }}
//           showLabels
//           sx={{ '& .MuiBottomNavigationAction-root': { color: '#fff' } }}
//         >
//           {items.slice(0, 5).map((it) => (
//             <BottomNavigationAction
//               key={it.key}
//               label={it.label}
//               icon={it.icon}
//               value={it.href} // <-- важное место
//               sx={{ '&.Mui-selected': { color: '#D8B7DD' } }}
//             />
//           ))}
//         </BottomNavigation>
//       </Paper>

//       {/* Desktop floating rail */}
//       <Box
//         sx={{
//           position: 'fixed',
//           right: 16,
//           top: '50%',
//           transform: 'translateY(-50%)',
//           display: { xs: 'none', lg: 'flex' },
//           flexDirection: 'column',
//           gap: 1,
//           zIndex: 1200,
//         }}
//       >
//         {items.map((it) => (
//           <Fab
//             key={it.key}
//             size="small"
//             onClick={() => router.push(it.href)}
//             sx={{
//               color: '#fff',
//               background: 'rgba(15,10,19,.6)',
//               '&:hover': { background: 'rgba(216,183,221,.25)' },
//             }}
//           >
//             {it.icon}
//           </Fab>
//         ))}
//         <Fab
//           size="small"
//           onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//         >
//           <KeyboardArrowUpRoundedIcon />
//         </Fab>
//       </Box>
//     </>
//   );
// };
