

// ФАЙЛ: src/components/SEO/CareerTarotComponent.tsx
'use client';

import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Accordion, AccordionSummary,
  AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Divider, Paper, Tabs, Tab
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { motion, Variants } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { QuestionBuilder } from './QuestionBuilder';
import { CareerConstellation } from './CareerConstellation';
import { tarotCards } from '@/data/tarotCards-1';
import Image from 'next/image';

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

export const CareerTarotComponent = () => {
  const t = useTranslations('CareerTarot');
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const majorArcanaNames = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"];
  
  const majorArcana = tarotCards.filter(card => majorArcanaNames.includes(card.name));
  const wands = tarotCards.filter(card => card.name.includes('Wands'));
  const cups = tarotCards.filter(card => card.name.includes('Cups'));
  const swords = tarotCards.filter(card => card.name.includes('Swords'));
  const pentacles = tarotCards.filter(card => card.name.includes('Pentacles'));

  const categories = [majorArcana, wands, cups, swords, pentacles];

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 8, sm: 12 }, pb: 8 }}>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', margin: '-1px', border: 0, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {t('seo_h1')}
      </h1>

      <AnimatedSection>
        <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.5rem', sm: '3.5rem' }, textAlign: 'center', background: '#D8B7DD', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 2 }}>{t('main_title')}</Typography>
        <Typography variant="body1" sx={{ mb: 3, fontSize: '1.2rem', lineHeight: 1.6, textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>{t('intro_p1')}</Typography>
        <Typography variant="h3" component="h2" sx={{ fontSize: '1.5rem', textAlign: 'center', mb: 3, fontWeight: 'bold', color: '#D8B7DD'  }}>{t('intro_subtitle')}</Typography>
        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>{t.rich('intro_p2', {b: (chunks) => <strong>{chunks}</strong>})}</Typography>

      </AnimatedSection>
       <AnimatedSection>
          <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }} >{t('final_cta_title')}</Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => (window.location.href = '/')}
                    sx={{ fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px', background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)', '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' }, transition: 'all 0.3s ease-in-out' }}
                  >
                    {t('cta_ask_question')}
                  </Button>
                </Box>
      </AnimatedSection>
      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>{t('constructor_title')}</Typography>
        <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>{t('constructor_intro')}</Typography>
        <QuestionBuilder />
      </AnimatedSection>

      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>{t('map_title')}</Typography>
        <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>{t('map_intro')}</Typography>
        <CareerConstellation />
      </AnimatedSection>
      
      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>{t('glossary_title')}</Typography>
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
                    '& .Mui-selected': { color: '#D8B7DD !important' },
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
                {category.map(card => (
                    <StyledAccordion
                        key={card.name}
                        summary={card.titles[locale as keyof typeof card.titles] || card.name}
                        details={t(`glossary_${card.file.replace('.png', '')}_desc`)}
                        imageSrc={`/cards/version1/${card.file.replace('.png', '.webp')}`}
                    />
                ))}
            </TabPanel>
        ))}
      </AnimatedSection>
      
      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>{t('samples_title')}</Typography>
        {[{ key: 'role_change', count: 3 }, { key: 'burnout', count: 3 }, { key: 'job_search', count: 3 }].map(scenario => (
          <Box key={scenario.key} sx={{ mb: 3 }}>
            <Typography variant="h6" component="h3" fontWeight="bold" sx={{ color: '#D8B7DD' }}>{t(`samples_${scenario.key}_title`)}</Typography>
            <List>
              {Array.from({ length: scenario.count }, (_, i) => i + 1).map(i => (
                <ListItem key={i} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: '32px', color: '#D8B7DD' }}><StarBorderIcon /></ListItemIcon>
                  <ListItemText primary={t(`samples_${scenario.key}_q${i}`)} />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </AnimatedSection>

      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>{t('template_title')}</Typography>
        <Paper elevation={3} sx={{ p: 3, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <List>
            {Array.from({ length: 6 }, (_, i) => i + 1).map(i => (
              <ListItem key={i} sx={{ py: 0.5 }}>
                 <ListItemIcon sx={{ minWidth: '32px', color: '#D8B7DD' }}>•</ListItemIcon>
                 <ListItemText sx={{ color: 'white' }}primary={t(`template_p${i}`)} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </AnimatedSection>
      
      <AnimatedSection>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ color: '#D8B7DD' }}>{t('method_title')}</Typography>
        {[1, 2, 3].map(i => (
          <Typography key={i} sx={{ mb: 2, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            <strong>{t(`method_p${i}_bold`)}</strong> {t(`method_p${i}_text`)}
          </Typography>
        ))}
      </AnimatedSection>


        <AnimatedSection>
         <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Typography component="h2" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }} >{t('final_cta_title')}</Typography>
                   <Button
                    variant="contained"
                    size="large"
                    onClick={() => (window.location.href = '/')}
                    sx={{ fontSize: '1.2rem', py: 2, px: 4, mt: 2, borderRadius: '25px', background: 'linear-gradient(45deg, #D8B7DD, #B39BC8)', '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(216,183,221,0.5)' }, transition: 'all 0.3s ease-in-out' }}
                  >
                    {t('cta_ask_question')}
                  </Button>
                </Box>
      </AnimatedSection>
    </Container>
  );
};