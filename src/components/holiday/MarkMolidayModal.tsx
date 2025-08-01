import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { useState } from 'react';
import HolidayForm from './MarkHolidayForm';
import { Close } from '@mui/icons-material';
interface iProps {
  onOpen?: () => void;
  onClose?: () => void;
}

function MarkMolidayModal({ onClose, onOpen }: iProps) {
  const [open, setOpen] = useState(false);

  function handleClose() {
    onClose?.();
    setOpen(false);
  }
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => {
          setOpen(true);
          onOpen?.();
        }}
      >
        Mark Holiday
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <Box display={'flex'} justifyContent={'space-between'}>
          <DialogTitle>Mark Holiday</DialogTitle>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent>
          <HolidayForm onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MarkMolidayModal;
