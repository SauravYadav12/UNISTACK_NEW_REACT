/**
 * Modal-shaped download surface — same content the /download page shows,
 * wrapped in a MUI Dialog with a close button so it can be popped from
 * anywhere in the app without taking the user away from their current
 * route. Driven by DesktopDownloadContext (any descendant calls
 * `openDownloadDialog()` to show it).
 *
 * The route at /download still renders the same content via the page
 * wrapper so shareable external links continue to work — keeping both
 * surfaces in lockstep is why we extracted DesktopDownloadContent.
 */
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import DesktopDownloadContent from './DesktopDownloadContent';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DesktopDownloadDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            // Brand-tinted backdrop on the modal so it feels like a
            // first-class affordance, not a generic dialog.
            background: `radial-gradient(circle at 0% 0%, ${alpha(
              tokens.colors.pink,
              0.08,
            )}, transparent 50%), radial-gradient(circle at 100% 0%, ${alpha(
              tokens.colors.blue,
              0.08,
            )}, transparent 50%), #fff`,
          },
        },
      }}
    >
      {/* Custom header — gradient title + close button, replacing the
          page-style hero block (we pass compact to DesktopDownloadContent
          so it doesn't double up). */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, pt: 3, pb: 1 }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 20, md: 24 },
              background: tokens.gradients.pinkBlue,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            Unistack for desktop
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: tokens.colors.lightTextSecondary }}
          >
            Tray-resident app with native notifications and faster access.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <IconX size={18} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 1 }}>
        <DesktopDownloadContent compact />
      </DialogContent>
    </Dialog>
  );
}
