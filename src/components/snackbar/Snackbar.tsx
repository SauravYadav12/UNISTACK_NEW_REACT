import * as React from 'react';
import Box from '@mui/material/Box';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';

interface State extends SnackbarOrigin {
  open: boolean;
}

export default function PositionedSnackbar({ open, message, setOpen }: any) {
  const [state, setState] = React.useState<State>({
    open: false,
    vertical: 'bottom',
    horizontal: 'left',
  });
  const { vertical, horizontal } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
    setOpen(false);
  };

  return (
    <Box sx={{ width: 500 }}>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        message={message}
        key={vertical + horizontal}
      />
    </Box>
  );
}
