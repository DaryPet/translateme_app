// 'use client';

// import React, { useMemo, useState } from 'react';
// import {
//   Box, Typography, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import Image from 'next/image';
// import { useTranslations, useLocale } from 'next-intl';
// import { tarotCards } from '@/data/tarotCards-1';

// /** ===== helpers: locale ===== */
// type SupportedLocale = 'ru' | 'uk' | 'en' | 'es';
// const normalizeLocale = (l: string): SupportedLocale => {
//   const s = l.toLowerCase();
//   if (s.startsWith('ru')) return 'ru';
//   if (s.startsWith('uk')) return 'uk';
//   if (s.startsWith('es')) return 'es';
//   return 'en';
// };

// /** ===== helpers: slug/keys ===== */
// const slugify = (s?: string) =>
//   (s || '')
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '_')
//     .replace(/^_+|_+$/g, '')
//     .replace(/__+/g, '_');

// type SuitKey = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

// const suitFromAny = (raw?: string): SuitKey | null => {
//   const v = (raw || '').toLowerCase();
//   if (/major|старш|arcana/.test(v)) return 'major';
//   if (/wands|жезл/.test(v)) return 'wands';
//   if (/cups|чаш|кубк/.test(v)) return 'cups';
//   if (/swords|меч/.test(v)) return 'swords';
//   if (/pentacles|coins|денар|пентак/.test(v)) return 'pentacles';
//   return null;
// };

// const resolveSuit = (card: any): SuitKey => {
//   // try explicit field
//   const s1 = suitFromAny(card.suit);
//   if (s1) return s1;
//   // derive from file/name
//   const raw = `${card.name || ''} ${card.file || ''}`;
//   const s2 = suitFromAny(raw);
//   return s2 || 'major';
// };

// // rank parsing for minors
// const rankMapWords: Record<string, string> = {
//   ace: 'ace',
//   one: 'ace',
//   two: '2',
//   three: '3',
//   four: '4',
//   five: '5',
//   six: '6',
//   seven: '7',
//   eight: '8',
//   nine: '9',
//   ten: '10',
//   page: 'page',
//   knight: 'knight',
//   queen: 'queen',
//   king: 'king',

//   // возможные рус/ук фрагменты в именах файлов
//   туз: 'ace',
//   паш: 'page',
//   рыцарь: 'knight',
//   валет: 'page',
//   дама: 'queen',
//   король: 'king',
// };

// const extractRank = (base: string): string | null => {
//   const b = base.toLowerCase();
//   // court first
//   for (const k of ['page', 'knight', 'queen', 'king']) {
//     if (b.includes(k)) return k;
//   }
//   // numbers in file
//   const numMatch = b.match(/\b(10|[2-9])\b/);
//   if (numMatch) return numMatch[1];
//   // english words or cyrillic hints
//   for (const w of Object.keys(rankMapWords)) {
//     if (b.includes(w)) return rankMapWords[w];
//   }
//   if (b.includes('ace')) return 'ace';
//   return null;
// };

// const extractMajorIndexAndSlug = (card: any): { num: string; slug: string } => {
//   // prefer explicit number/index
//   let numRaw: string | number | undefined =
//     card.number ?? card.index ?? card.order ?? card.orderIndex;

//   const base = slugify((card.file || card.name || '').replace(/\.(png|webp|jpg|jpeg)$/i, ''));
//   if (!numRaw) {
//     // try pattern like major_00_the_fool or 00_the_fool
//     const m = base.match(/\b(0?\d|1\d|2[01])\b/);
//     if (m) numRaw = m[1];
//   }
//   const num = String(numRaw ?? '0').padStart(2, '0');

//   // slug after number if exists, else from name
//   let slugPart = base.replace(/^.*?\b(0?\d|1\d|2[01])_?/, ''); // drop prefix up to number_
//   if (!slugPart || slugPart === base) {
//     slugPart = slugify(card.name);
//   }
//   if (!slugPart) slugPart = 'arcana';

//   return { num, slug: slugPart };
// };

// const getGlossaryKey = (card: any): string => {
//   const suit = resolveSuit(card);
//   const base = slugify((card.file || card.name || '').replace(/\.(png|webp|jpg|jpeg)$/i, ''));

//   if (suit === 'major') {
//     const { num, slug } = extractMajorIndexAndSlug(card);
//     return `LoveTarot.glossary_major_${num}_${slug}_desc`;
//   }

//   // minors
//   const rank = slugify(card.rank || extractRank(base) || card.name || '');
//   // normalize rank like "2".."10" keep as is; ace/page/knight/queen/king ok
//   const rankSlug = rank;
//   return `LoveTarot.glossary_${suit}_${rankSlug}_desc`;
// };

// const getLocalizedTitle = (card: any, locale: SupportedLocale): string => {
//   return card?.titles?.[locale]
//     ?? card?.titles?.en
//     ?? card?.titles?.ru
//     ?? card?.name
//     ?? '—';
// };

// /** ===== component ===== */
// export const LoveGlossary: React.FC = () => {
//   const t = useTranslations('LoveTarot');
//   const locale = normalizeLocale(useLocale());
//   const [tab, setTab] = useState(0);

//   const groups = useMemo(() => {
//     const g: Record<SuitKey, any[]> = { major: [], wands: [], cups: [], swords: [], pentacles: [] };
//     tarotCards.forEach((c: any) => g[resolveSuit(c)].push(c));
//     const sortWithin = (arr: any[]) =>
//       arr.slice().sort((a, b) => (a.order ?? a.number ?? a.file ?? '').localeCompare(b.order ?? b.number ?? b.file ?? ''));
//     return {
//       major: sortWithin(g.major),
//       wands: sortWithin(g.wands),
//       cups: sortWithin(g.cups),
//       swords: sortWithin(g.swords),
//       pentacles: sortWithin(g.pentacles),
//     };
//   }, []);

//   const categories: Record<number, any[]> = {
//     0: groups.major,
//     1: groups.wands,
//     2: groups.cups,
//     3: groups.swords,
//     4: groups.pentacles
//   };

//   // safe translator to avoid crashing on missing keys
//   const safeText = (key: string, fallback = 'Описание появится позже.'): string => {
//     try {
//       // use full key path (already prefixed)
//       return (t as unknown as (k: string) => string)(key.replace(/^LoveTarot\./, ''));
//     } catch {
//       return fallback;
//     }
//   };

//   return (
//     <Box>
//       <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>
//         {t('glossary_title')}
//       </Typography>

//       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//         <Tabs
//           value={tab}
//           onChange={(_e, v) => setTab(v)}
//           variant="scrollable"
//           scrollButtons="auto"
//           sx={{
//             '& .MuiTabs-indicator': { backgroundColor: '#D8B7DD' },
//             '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
//             '& .Mui-selected': { color: '#D8B7DD !important' }
//           }}
//         >
//           <Tab label={t('glossary_tab_major')} />
//           <Tab label={t('glossary_tab_wands')} />
//           <Tab label={t('glossary_tab_cups')} />
//           <Tab label={t('glossary_tab_swords')} />
//           <Tab label={t('glossary_tab_pentacles')} />
//         </Tabs>
//       </Box>

//       {Object.keys(categories).map((k) => {
//         const idx = Number(k);
//         const list = categories[idx];
//         return (
//           <div key={idx} role="tabpanel" hidden={tab !== idx}>
//             {tab === idx && (
//               <Box sx={{ pt: 3 }}>
//                 {list.map((card: any) => {
//                   const title = getLocalizedTitle(card, locale);
//                   const fileBase = String(card.file || '').replace(/\.(png|webp|jpg|jpeg)$/i, '');
//                   const img = `/cards/version1/${fileBase}.webp`;
//                   const key = getGlossaryKey(card); // full 'LoveTarot.glossary_..._desc'

//                   const details = safeText(key, 'Описание появится позже.');

//                   return (
//                     <Accordion key={fileBase || title} sx={{
//                       background: 'rgba(255, 255, 255, 0.05)',
//                       color: 'white',
//                       '&:before': { display: 'none' },
//                       mb: 1
//                     }}>
//                       <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#D8B7DD' }} />}>
//                         <Typography fontWeight="bold">{title}</Typography>
//                       </AccordionSummary>
//                       <AccordionDetails>
//                         <Box sx={{
//                           display: 'flex',
//                           gap: 3,
//                           alignItems: 'center',
//                           flexDirection: { xs: 'column', sm: 'row' }
//                         }}>
//                           <Box sx={{ position: 'relative', width: { xs: 100, sm: 120 }, aspectRatio: '5/8', flexShrink: 0 }}>
//                             <Image
//                               src={img}
//                               alt={title}
//                               fill
//                               sizes="(max-width: 600px) 100px, 120px"
//                               loading="lazy"
//                               style={{ objectFit: 'contain', borderRadius: 8 }}
//                             />
//                           </Box>
//                           <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, flex: 1 }}>
//                             {details}
//                           </Typography>
//                         </Box>
//                       </AccordionDetails>
//                     </Accordion>
//                   );
//                 })}
//               </Box>
//             )}
//           </div>
//         );
//       })}
//     </Box>
//   );
// };

'use client';

import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { motion, Variants } from 'framer-motion';
import { tarotCards } from '@/data/tarotCards-1';

// Вспомогательный компонент для секций с анимацией
const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const sectionVariants: Variants = { 
    hidden: { opacity: 0, y: 50 }, 
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' }}
  };
  return (
    <Box 
      component={motion.div} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, amount: 0.2 }} 
      variants={sectionVariants} 
      sx={{ mb: 8 }}
    >
      {children}
    </Box>
  );
};

// Стилизованный аккордеон с изображением
const StyledAccordion = ({ summary, details, imageSrc }: { summary: string, details: string, imageSrc?: string }) => (
    <Accordion sx={{ 
      background: 'rgba(255, 255, 255, 0.05)', 
      color: 'white', 
      '&:before': { display: 'none' }, 
      mb: 1 
    }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#D8B7DD' }} />}>
            <Typography fontWeight="bold">{summary}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
                {imageSrc && (
                  <Box sx={{
                    position: 'relative',
                    width: { xs: '100px', sm: '120px' },
                    aspectRatio: '5 / 8',
                    flexShrink: 0,
                    alignSelf: 'center'
                  }}>
                    <Image
                      src={imageSrc}
                      alt={summary}
                      fill
                      sizes="(max-width: 600px) 100px, 120px"
                      loading="lazy"
                      style={{ 
                        objectFit: 'contain',
                        borderRadius: '8px' 
                      }}
                    />
                  </Box>
                )}
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, flex: 1 }}>
                  {details}
                </Typography>
            </Box>
        </AccordionDetails>
    </Accordion>
);

// Вспомогательный компонент для панели вкладок
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Вспомогательные функции, скопированные из старого кода
type SupportedLocale = 'ru' | 'uk' | 'en' | 'es';
const normalizeLocale = (l: string): SupportedLocale => {
  const s = l.toLowerCase();
  if (s.startsWith('ru')) return 'ru';
  if (s.startsWith('uk')) return 'uk';
  if (s.startsWith('es')) return 'es';
  return 'en';
};

type SuitKey = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

const slugify = (s?: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');

const suitFromAny = (raw?: string): SuitKey | null => {
  const v = (raw || '').toLowerCase();
  if (/major|старш|arcana/.test(v)) return 'major';
  if (/wands|жезл/.test(v)) return 'wands';
  if (/cups|чаш|кубк/.test(v)) return 'cups';
  if (/swords|меч/.test(v)) return 'swords';
  if (/pentacles|coins|денар|пентак/.test(v)) return 'pentacles';
  return null;
};

const resolveSuit = (card: any): SuitKey => {
  const s1 = suitFromAny(card.suit);
  if (s1) return s1;
  const raw = `${card.name || ''} ${card.file || ''}`;
  const s2 = suitFromAny(raw);
  return s2 || 'major';
};

const rankMapWords: Record<string, string> = {
  ace: 'ace', one: 'ace', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  page: 'page', knight: 'knight', queen: 'queen', king: 'king',
  туз: 'ace', паш: 'page', рыцарь: 'knight', валет: 'page', дама: 'queen', король: 'king',
};

const extractRank = (base: string): string | null => {
  const b = base.toLowerCase();
  for (const k of ['page', 'knight', 'queen', 'king']) {
    if (b.includes(k)) return k;
  }
  const numMatch = b.match(/\b(10|[2-9])\b/);
  if (numMatch) return numMatch[1];
  for (const w of Object.keys(rankMapWords)) {
    if (b.includes(w)) return rankMapWords[w];
  }
  if (b.includes('ace')) return 'ace';
  return null;
};

const extractMajorIndexAndSlug = (card: any): { num: string; slug: string } => {
  let numRaw: string | number | undefined = card.number ?? card.index ?? card.order ?? card.orderIndex;
  const base = slugify((card.file || card.name || '').replace(/\.(png|webp|jpg|jpeg)$/i, ''));
  if (!numRaw) {
    const m = base.match(/\b(0?\d|1\d|2[01])\b/);
    if (m) numRaw = m[1];
  }
  const num = String(numRaw ?? '0').padStart(2, '0');
  let slugPart = base.replace(/^.*?\b(0?\d|1\d|2[01])_?/, '');
  if (!slugPart || slugPart === base) {
    slugPart = slugify(card.name);
  }
  if (!slugPart) slugPart = 'arcana';
  return { num, slug: slugPart };
};

const getGlossaryKey = (card: any): string => {
  const suit = resolveSuit(card);
  const base = slugify((card.file || card.name || '').replace(/\.(png|webp|jpg|jpeg)$/i, ''));

  if (suit === 'major') {
    const { num, slug } = extractMajorIndexAndSlug(card);
    return `glossary_major_${num}_${slug}_desc`;
  }
  
  const rank = slugify(card.rank || extractRank(base) || card.name || '');
  const rankSlug = rank;
  return `glossary_${suit}_${rankSlug}_desc`;
};

const getLocalizedTitle = (card: any, locale: SupportedLocale): string => {
  return card?.titles?.[locale]
    ?? card?.titles?.en
    ?? card?.titles?.ru
    ?? card?.name
    ?? '—';
};

// safe translator to avoid crashing on missing keys
const safeText = (t: any, key: string, fallback = 'Описание появится позже.'): string => {
  try {
    return t(key);
  } catch {
    return fallback;
  }
};


export const LoveGlossary = () => {
  const t = useTranslations('LoveTarot');
  const locale = normalizeLocale(useLocale());
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_e: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const groups = useMemo(() => {
    const g: Record<SuitKey, any[]> = { major: [], wands: [], cups: [], swords: [], pentacles: [] };
    tarotCards.forEach((c: any) => g[resolveSuit(c)].push(c));
    const sortWithin = (arr: any[]) =>
      arr.slice().sort((a, b) => (a.order ?? a.number ?? a.file ?? '').localeCompare(b.order ?? b.number ?? b.file ?? ''));
    return {
      major: sortWithin(g.major),
      wands: sortWithin(g.wands),
      cups: sortWithin(g.cups),
      swords: sortWithin(g.swords),
      pentacles: sortWithin(g.pentacles),
    };
  }, []);

  const categories = [
    groups.major,
    groups.wands,
    groups.cups,
    groups.swords,
    groups.pentacles
  ];

  return (
    <AnimatedSection>
      <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>
        {t('glossary_title')}
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tarot suits tabs"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#D8B7DD' },
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: '#D8B7DD !important' }
          }}
        >
          <Tab label={t('glossary_tab_major')} />
          <Tab label={t('glossary_tab_wands')} />
          <Tab label={t('glossary_tab_cups')} />
          <Tab label={t('glossary_tab_swords')} />
          <Tab label={t('glossary_tab_pentacles')} />
        </Tabs>
      </Box>

      {categories.map((category, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {category.map(card => {
            const title = getLocalizedTitle(card, locale);
            const key = getGlossaryKey(card);
            const fileBase = String(card.file || '').replace(/\.(png|webp|jpg|jpeg)$/i, '');
            const img = `/cards/version1/${fileBase}.webp`;

            return (
              <StyledAccordion
                key={card.name}
                summary={title}
                details={safeText(t, key, 'Описание появится позже.')}
                imageSrc={img}
              />
            );
          })}
        </TabPanel>
      ))}
    </AnimatedSection>
  );
};