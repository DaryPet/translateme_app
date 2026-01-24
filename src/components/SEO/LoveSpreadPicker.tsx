// 'use client';

// import React from 'react';
// import {
//   Box, Card, CardContent, CardHeader, Typography, Chip, Button, Stack, Snackbar
// } from '@mui/material';
// import ContentCopyIcon from '@mui/icons-material/ContentCopy';
// import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
// import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
// import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
// import { useTranslations } from 'next-intl';

// // статические импорты WEBP (Next сам подставит корректные URL)
// import backV1 from 'public/cards/version1/back.webp';
// import backV2 from 'public/cards/version2/back.webp';
// import backV3 from 'public/cards/version1/back.webp';

// type SpreadKey = 'threeLove' | 'relationshipPath' | 'compatibility';

// export const LoveSpreadPicker: React.FC = () => {
//   const t = useTranslations('LoveTarot.spreads');
//   const [snack, setSnack] = React.useState<string | null>(null);

//   const copy = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setSnack('copied');
//     } catch {
//       const textarea = document.createElement('textarea');
//       textarea.value = text; document.body.appendChild(textarea);
//       textarea.select(); document.execCommand('copy'); textarea.remove();
//       setSnack('copied');
//     }
//   };

//   const spreads: Array<{ key: SpreadKey; icon: React.ReactNode; color: string }> = [
//     { key: 'threeLove', icon: <FavoriteBorderIcon />, color: '#ff8fab' },
//     { key: 'relationshipPath', icon: <AllInclusiveIcon />, color: '#d0b3ff' },
//     { key: 'compatibility', icon: <CompareArrowsIcon />, color: '#b2f5ea' }
//   ];

//   // надёжный выбор WEBP-источника (через .src от статического импорта)
//   const getBackSrc = (spread: SpreadKey, index: number) => {
//     if (spread === 'threeLove') return backV1.src;
//     if (spread === 'relationshipPath') return backV2.src;
//     const odd = index % 2 === 0; // позиции 1,3,5... (index 0,2,4...) -> v1, чётные -> v3
//     return odd ? backV1.src : backV3.src;
//   };

//   return (
//     <>
//       <Stack spacing={3}>
//         {spreads.map(({ key, icon, color }) => {
//           // длину макета берём из локали; t.raw возвращает unknown -> приводим к string[]
//           const layout = (t.raw(`${key}.layout`) as string[]) ?? [];
//           const prompts = (t.raw(`${key}.prompts`) as string[]) ?? [];

//           return (
//             <Card
//               key={key}
//               sx={{
//                 background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.18))',
//                 border: '1px solid rgba(216,183,221,.25)',
//                 borderRadius: 3,
//                 overflow: 'hidden'
//               }}
//             >
//               <CardHeader
//                 avatar={<Chip icon={icon as any} label="" sx={{ bgcolor: color, '& .MuiChip-label': { px: 0 } }} />}
//                 title={
//                   <Typography variant="h5" sx={{
//                     background: 'linear-gradient(90deg,#fff,#D8B7DD)',
//                     WebkitBackgroundClip: 'text',
//                     WebkitTextFillColor: 'transparent',
//                     fontWeight: 800
//                   }}>
//                     {t(`${key}.title`)}
//                   </Typography>
//                 }
//                 subheader={
//                   <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.75)' }}>
//                     {t(`${key}.subtitle`)}
//                   </Typography>
//                 }
//               />
//               <CardContent>
//                 <Typography sx={{ color: 'rgba(255,255,255,.8)', mb: 2 }}>
//                   {t(`${key}.desc`)}
//                 </Typography>

//                 {/* РЕАЛЬНЫЕ КАРТЫ-РУБАШКИ (WEBP) */}
//                 <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
//                   {Array.from({ length: layout.length }).map((_, i) => (
//                     <Box
//                       key={i}
//                       sx={{
//                         width: 54, height: 80, borderRadius: 1.5,
//                         overflow: 'hidden',
//                         boxShadow: '0 2px 10px rgba(0,0,0,.3)',
//                         border: '1px solid rgba(255,255,255,.18)',
//                         position: 'relative',
//                       }}
//                     >
//                       <Box
//                         component="img"
//                         src={getBackSrc(key, i)}
//                         alt="card back"
//                         sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
//                       />
//                     </Box>
//                   ))}
//                 </Box>

//                 {/* Вопросы-подсказки с копированием */}
//                 <Stack spacing={1.25}>
//                   {prompts.map((p, i) => (
//                     <Box key={i} sx={{
//                       display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                       gap: 2, p: 1.25,
//                       borderRadius: 2,
//                       background: 'rgba(255,255,255,.04)',
//                       border: '1px solid rgba(255,255,255,.1)'
//                     }}>
//                       <Typography sx={{ color: 'rgba(255,255,255,.9)' }}>{p}</Typography>
//                       <Button
//                         size="small"
//                         startIcon={<ContentCopyIcon />}
//                         onClick={() => copy(p)}
//                         sx={{
//                           borderRadius: 999,
//                           background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
//                           color: '#000',
//                           '&:hover': { opacity: .9 }
//                         }}
//                       >
//                         {t('copy')}
//                       </Button>
//                     </Box>
//                   ))}
//                 </Stack>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </Stack>

//       <Snackbar
//         open={!!snack}
//         autoHideDuration={1500}
//         onClose={() => setSnack(null)}
//         message={t('copied')}
//       />
//     </>
//   );
// };


'use client';

import React from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography, Chip, Stack, Snackbar, ButtonBase
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useTranslations } from 'next-intl';

import backV1 from 'public/cards/version1/back.webp';
import backV2 from 'public/cards/version2/back.webp';
import backV3 from 'public/cards/version1/back.webp';

type SpreadKey = 'threeLove' | 'relationshipPath' | 'compatibility';

// Розовая капсула — адаптивная
// const CopyCapsule: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
//   <ButtonBase
//     onClick={onClick}
//     sx={{
//       borderRadius: 999,
//       overflow: 'hidden',
//       p: 0,
//       '&:hover .capsule': { opacity: 0.92 }
//     }}
//   >
//     <Box
//       className="capsule"
//       sx={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 0.75,
//         height: { xs: 32, sm: 36 },
//         minWidth: { xs: 112, sm: 136 },
//         px: { xs: 1.5, sm: 2 },
//         borderRadius: 999,
//         background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
//         boxShadow: '0 0 0 1px rgba(0,0,0,.08) inset, 0 2px 8px rgba(0,0,0,.25)'
//       }}
//     >
//       <ContentCopyIcon sx={{ fontSize: 18, color: '#000' }} />
//       <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#000', lineHeight: 1 }}>
//         {label}
//       </Typography>
//     </Box>
//   </ButtonBase>
// );

const CopyCapsule: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      borderRadius: 999,
      overflow: 'hidden',
      p: 0,
      flexShrink: 0,
      '&:hover .capsule': { opacity: 0.92 }
    }}
  >
    <Box
      className="capsule"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 0.5, sm: 0.75 },
        height: { xs: 28, sm: 36 },
        minWidth: { xs: 28, sm: 120 },
        px: { xs: 0.5, sm: 2 },
        borderRadius: 999,
        background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)',
        boxShadow: '0 0 0 1px rgba(0,0,0,.08) inset, 0 2px 8px rgba(0,0,0,.25)'
      }}
    >
      <ContentCopyIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#000' }} />
      {/* На xs скрываем текст, оставляем только иконку */}
      <Typography
        sx={{
          fontSize: { xs: 0, sm: 14 },
          fontWeight: 600,
          color: '#000',
          lineHeight: 1,
          display: { xs: 'none', sm: 'inline' }
        }}
      >
        {label}
      </Typography>
    </Box>
  </ButtonBase>
);

export const LoveSpreadPicker: React.FC = () => {
  const t = useTranslations('LoveTarot.spreads');
  const [snack, setSnack] = React.useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack('copied');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text; document.body.appendChild(textarea);
      textarea.select(); document.execCommand('copy'); textarea.remove();
      setSnack('copied');
    }
  };

  const spreads: Array<{ key: SpreadKey; icon: React.ReactNode; color: string }> = [
    { key: 'threeLove', icon: <FavoriteBorderIcon />, color: '#ff8fab' },
    { key: 'relationshipPath', icon: <AllInclusiveIcon />, color: '#d0b3ff' },
    { key: 'compatibility', icon: <CompareArrowsIcon />, color: '#b2f5ea' }
  ];

  const getBackSrc = (spread: SpreadKey, index: number) => {
    if (spread === 'threeLove') return backV1.src;
    if (spread === 'relationshipPath') return backV2.src;
    const odd = index % 2 === 0;
    return odd ? backV1.src : backV3.src;
  };

  return (
    <>
      <Stack spacing={3}>
        {spreads.map(({ key, icon, color }) => {
          const layout = (t.raw(`${key}.layout`) as string[]) ?? [];
          const prompts = (t.raw(`${key}.prompts`) as string[]) ?? [];

          return (
            <Card
              key={key}
              sx={{
                background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.18))',
                border: '1px solid rgba(216,183,221,.25)',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={<Chip icon={icon as any} label="" sx={{ bgcolor: color, '& .MuiChip-label': { px: 0 } }} />}
                title={
                  <Typography variant="h5" sx={{
                    background: 'linear-gradient(90deg,#fff,#D8B7DD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800
                  }}>
                    {t(`${key}.title`)}
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.75)' }}>
                    {t(`${key}.subtitle`)}
                  </Typography>
                }
              />
              <CardContent>
                <Typography sx={{ color: 'rgba(255,255,255,.8)', mb: 2 }}>
                  {t(`${key}.desc`)}
                </Typography>

                {/* рубашки */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                  {Array.from({ length: layout.length }).map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 54, height: 80, borderRadius: 1.5,
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,.3)',
                        border: '1px solid rgba(255,255,255,.18)',
                        position: 'relative',
                      }}
                    >
                      <Box
                        component="img"
                        src={getBackSrc(key, i)}
                        alt="card back"
                        sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>

                {/* вопросы + копирование */}
                <Stack spacing={1.25}>
                  {prompts.map((p, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' }, // на мобилке текст начинается сверху
                        gap: 2,
                        p: 1.25,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,.04)',
                        border: '1px solid rgba(255,255,255,.1)'
                      }}
                    >
                      <Typography
                        sx={{
                          flex: 1,
                          minWidth: 0,                 // позволяет тексту переноситься
                          pr: 1,
                          color: 'rgba(255,255,255,.9)',
                          wordBreak: 'break-word',     // для длинных слов
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {p}
                      </Typography>

                      {/* кнопка справа, не сжимается и не прыгает */}
                      <Box sx={{ flexShrink: 0 }}>
                        <CopyCapsule label={t('copy')} onClick={() => copy(p)} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Snackbar
        open={!!snack}
        autoHideDuration={1500}
        onClose={() => setSnack(null)}
        message={t('copied')}
      />
    </>
  );
};
