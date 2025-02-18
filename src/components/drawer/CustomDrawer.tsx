import { Drawer, Box, IconButton, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CustomDrawer({
  open,
  onClose,
  title,
  subTitle,
  children,
}: any) {
  return (
    <Drawer
      anchor="right"
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          width: 1100,
          maxWidth: '100vw',
          left: 'auto',
          right: 0,
        },
      }}
    >
      <Box sx={{ padding: 2 }} role="presentation">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <div>
            <h2 style={{ marginBottom: 0 }}>{title}</h2>
            <h4 style={{ marginTop: 0 }}>{subTitle}</h4>
          </div>
          <IconButton onClick={onClose} sx={{ mt: '20px' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Drawer>
  );
}
