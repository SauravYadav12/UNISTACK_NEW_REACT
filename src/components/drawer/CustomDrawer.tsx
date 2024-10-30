import { Drawer, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function CustomDrawer ({ open, onClose, title, children}: any){

  return (
    <Drawer
      anchor="right"
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          width: 1100,
          transition: 'width 0.3s ease', // Smooth transition on width change
          maxWidth: '100vw',  // Ensures the drawer never exceeds the viewport width
          left: 'auto',        // Position drawer on the right side
          right: 0, // Ensure it sticks to the right
        },
      }}
    >
      <Box
        sx={{ padding: 2 }}
        role="presentation"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <h2>{title}</h2>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Drawer>
  );
};