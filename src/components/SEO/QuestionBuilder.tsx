// src/components/SEO/QuestionBuilder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useTranslations } from 'next-intl';

export const QuestionBuilder = () => {
  const t = useTranslations('CareerTarot');
  const [theme, setTheme] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [aspect, setAspect] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const themes = ['search', 'change', 'burnout', 'relations', 'growth'];
  const timeframes = ['current', '3months', 'longterm'];
  const aspects = ['resources', 'obstacles', 'potential', 'lessons'];

  const handleGenerate = () => {
    if (theme && timeframe && aspect) {
      const question = t('constructor_question_template', {
        aspect: t(`constructor_aspect_option_${aspect}`),
        theme: t(`constructor_theme_option_${theme}`),
        timeframe: t(`constructor_timeframe_option_${timeframe}`),
      });
      setGeneratedQuestion(question);
    }
  };
  
  useEffect(() => {
    let currentStep = 0;
    if (theme) currentStep++;
    if (timeframe) currentStep++;
    if (aspect) currentStep++;
    setActiveStep(currentStep);
  }, [theme, timeframe, aspect]);


  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 4 },
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
      }}
    >
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
         {['theme', 'timeframe', 'aspect'].map((label) => (
          <Step key={label}>
            <StepLabel sx={{ 
                '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' },
                '& .Mui-active': { color: '#D8B7DD !important' },
                '& .Mui-completed': { color: '#D8B7DD !important' }
            }}>
                {t(`constructor_step_${label}`)}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 4 }}>
        <FormControl fullWidth>
          <InputLabel sx={{color: 'rgba(255,255,255,0.7)'}}>{t('constructor_theme_label')}</InputLabel>
          <Select value={theme} label={t('constructor_theme_label')} onChange={(e) => setTheme(e.target.value)} sx={{color: 'white', '& .MuiSvgIcon-root': { color: 'white' }}}>
            {themes.map((item) => (
              <MenuItem key={item} value={item}>{t(`constructor_theme_option_${item}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{color: 'rgba(255,255,255,0.7)'}}>{t('constructor_timeframe_label')}</InputLabel>
          <Select value={timeframe} label={t('constructor_timeframe_label')} onChange={(e) => setTimeframe(e.target.value)} sx={{color: 'white', '& .MuiSvgIcon-root': { color: 'white' }}}>
            {timeframes.map((item) => (
              <MenuItem key={item} value={item}>{t(`constructor_timeframe_option_${item}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{color: 'rgba(255,255,255,0.7)'}}>{t('constructor_aspect_label')}</InputLabel>
          <Select value={aspect} label={t('constructor_aspect_label')} onChange={(e) => setAspect(e.target.value)} sx={{color: 'white', '& .MuiSvgIcon-root': { color: 'white' }}}>
            {aspects.map((item) => (
              <MenuItem key={item} value={item}>{t(`constructor_aspect_option_${item}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerate}
          disabled={!theme || !timeframe || !aspect}
          sx={{ mb: 3 }}
        >
          {t('constructor_generate_button')}
        </Button>
      </Box>

      {generatedQuestion && (
        <Box sx={{ mt: 3, p: 2, border: '1px dashed rgba(216,183,221,0.5)', borderRadius: 1, background: 'rgba(216,183,221,0.1)' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#D8B7DD' }}>{t('constructor_result_title')}</Typography>
          <Typography sx={{ textAlign: 'center', fontSize: '1.1rem', mt: 1 }}>{generatedQuestion}</Typography>
        </Box>
      )}
    </Paper>
  );
};