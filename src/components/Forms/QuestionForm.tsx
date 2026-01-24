'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { keyframes } from '@mui/system';

interface QuestionFormProps {
  onSubmit: (question: string) => void;
}

const gradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const MAX_LENGTH = 250;

const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit }) => {
  const [question, setQuestion] = useState<string>('');
  const t = useTranslations();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value.slice(0, MAX_LENGTH));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 2 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          placeholder={t('enterYourQuestion')}
          variant="outlined"
          value={question}
          onChange={handleChange}
          multiline
          minRows={1}
          maxRows={3}
          inputProps={{
            maxLength: MAX_LENGTH,
            style: {
              textAlign: 'center',
              padding: '16px',
              color: '#F5F3F0',
            },
          }}
          sx={{
            mt: 3,
            fontFamily: 'Cormorant Garamond, serif',
            '& .MuiOutlinedInput-root': {
              borderRadius: '30px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              '& fieldset': {
                borderColor: 'rgba(241,231,208,0.3)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              },
              '&:hover fieldset': { borderColor: '#D8B7DD' },
              '&.Mui-focused fieldset': {
                borderColor: '#D8B7DD',
                boxShadow: '0 0 8px rgba(216,183,221,0.5)',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: '#FFFFFF',
              opacity: 1,
              textAlign: 'center',
            },
          }}
        />

        {/* СЧЕТЧИК СИМВОЛОВ */}
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: '#F1E7DF',
            fontFamily: 'Cormorant Garamond, serif',
          }}
        >
          {`${question.length} / ${MAX_LENGTH}`}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              maxWidth: 500,
              px: 4,
              py: 2,
              fontSize: '1.4rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '30px',
              background:
                'linear-gradient(90deg,#9b59b6 0%, #F1E7DF 50%, #9b59b6 100%)',
              boxShadow:
                '0 4px 16px rgba(0,0,0,0.4), 0 0 24px rgba(125, 44, 191, 0.6)',
              backgroundSize: '200% 200%',
              animation: `${gradientShift} 4s ease infinite`,
              color: '#FFFFFF',
              '&:hover': {
                boxShadow:
                  '0 6px 24px rgba(0,0,0,0.5), 0 0 32px rgba(125, 44, 191, 0.7)',
              },
            }}
          >
            {t('getAnswer')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default QuestionForm;
