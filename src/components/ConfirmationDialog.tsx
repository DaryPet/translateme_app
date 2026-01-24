// src/components/GenericDialog.tsx
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';

interface GenericDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmButtonText: string;
  cancelButtonText: string;
  onConfirm: () => void;
  isConfirming?: boolean; // Для отображения индикатора загрузки на кнопке
  confirmButtonColor?: 'primary' | 'error' | 'success' | 'inherit';
  cancelButtonColor?: 'primary' | 'error' | 'success' | 'inherit';
  dialogBackgroundColor?: string;
}

export default function GenericDialog({
  open,
  onClose,
  title,
  description,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  isConfirming = false,
  confirmButtonColor = 'primary',
  cancelButtonColor = 'primary',
  dialogBackgroundColor,
}: GenericDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="generic-dialog-title"
      aria-describedby="generic-dialog-description"
      PaperProps={{
        // Этот блок добавлен для применения цвета фона
        sx: {
          backgroundColor: dialogBackgroundColor || '#7991c0ff', // <<< ВОТ ЗДЕСЬ ПРОПИСАН ЦВЕТ ФОНА
        },
      }}
    >
      <DialogTitle id="generic-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="generic-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color={cancelButtonColor}
          disabled={isConfirming}
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          autoFocus
          disabled={isConfirming}
          startIcon={isConfirming ? <CircularProgress size={20} /> : null}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
