import { Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import React from 'react';

interface Props {
  onClick: () => void;
}

const PurchaseButton: React.FC<Props> = ({ onClick }) => {
  const t = useTranslations();

  return (
    <Button
      onClick={onClick}
      sx={{
        backgroundColor: '#d1e7dd',
        color: '#0f5132',
        border: '1px solid #badbcc',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '15px',
        textTransform: 'none',
        '&:hover': {
          backgroundColor: '#bcd4c2',
        },
      }}
    >
      {t('buyCards')}
    </Button>
  );
};

export default PurchaseButton;
