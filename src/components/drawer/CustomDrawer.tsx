import { Drawer, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function CustomDrawer ({ open, onClose, title, children}: any){
  return (
    <Drawer
      anchor="right"
      open={open}
    >
      <Box
        sx={{ width: 1100, padding: 2 }}
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