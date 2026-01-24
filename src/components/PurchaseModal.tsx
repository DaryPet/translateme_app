'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchase: (count: number) => void;
}

const PurchaseModal: React.FC<Props> = ({ open, onClose, onPurchase }) => {
  const t = useTranslations();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultCurrency = 'EUR';
  const price10 = t('purchasePrice10');
  const price100 = t('purchasePrice100');

  const handlePurchaseClick = (count: number) => {
    onPurchase(count);
    // onClose(); // Закрываем модалку после инициирования покупки, если это нужно
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: theme.palette.secondary.main,
          color: 'white',
          position: 'relative',
          minHeight: isMobile ? 'auto' : '400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'white',
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.2)',
          },
          borderRadius: '50%',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle
        sx={{
          textAlign: 'center',
          pb: 1,
          pt: 4,
          fontSize: isMobile ? '1.5rem' : '2rem',
        }}
      >
        {t('purchaseTitle')}
      </DialogTitle>

      <DialogContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: isMobile ? 2 : 4,
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ textAlign: 'center', mb: isMobile ? 2 : 3 }}
        >
          {t('chooseOption')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column', // ИЗМЕНЕНИЕ ЗДЕСЬ: Всегда 'column'
            gap: isMobile ? 2 : 3,
            justifyContent: 'center',
            alignItems: 'center', // Центрируем колонки
            flexGrow: 1,
          }}
        >
          {/* Опция 10 карт */}
          <Box
            onClick={() => handlePurchaseClick(10)}
            sx={{
              p: isMobile ? 2 : 3,
              border: '2px solid',
              borderColor: 'white',
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-2px)',
              },
              // Убираем flex: 1, чтобы блоки не растягивались на всю ширину при flex-row
              minWidth: isMobile ? '100%' : '250px', // Увеличил minWidth для десктопа
              maxWidth: isMobile ? '100%' : '300px', // Увеличил maxWidth для десктопа
              boxShadow: 3,
            }}
          >
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{ mb: 1, fontWeight: 'bold', color: 'white' }}
            >
              {t('purchaseOption10')}
            </Typography>
            <Typography variant={isMobile ? 'h6' : 'h5'} color="white">
              <strong>{price10}</strong>
            </Typography>
          </Box>

          {/* Опция 100 карт */}
          <Box
            onClick={() => handlePurchaseClick(100)}
            sx={{
              p: isMobile ? 2 : 3,
              border: '2px solid',
              borderColor: 'white',
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-2px)',
              },
              // Убираем flex: 1
              minWidth: isMobile ? '100%' : '250px', // Увеличил minWidth
              maxWidth: isMobile ? '100%' : '300px', // Увеличил maxWidth
              boxShadow: 3,
            }}
          >
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{ mb: 1, fontWeight: 'bold', color: 'white' }}
            >
              {t('purchaseOption100')}
            </Typography>
            <Typography variant={isMobile ? 'h6' : 'h5'} color="white">
              <strong>{price100}</strong>
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="h6"
          color="white"
          sx={{
            mt: isMobile ? 3 : 4,
            textAlign: 'center',
            display: 'block',
            opacity: 0.8,
          }}
        >
          {t('currencyConversionNote')}
        </Typography>
      </DialogContent>
      {/* Кнопки "Купить" удалены из DialogActions, так как блоки стали кликабельными */}
      <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 0 }}>
        {/* Здесь можно вернуть кнопку отмены, если нужно */}
        {/* <Button onClick={onClose} color="error" sx={{ minWidth: '100px' }}>
          {t('cancel')}
        </Button> */}
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseModal;
