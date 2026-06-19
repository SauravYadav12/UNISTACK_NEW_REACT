/**
 * Slim green banner shown at the top of the app when a newer Unistack
 * desktop shell has been published. Companion to <VersionUpdateToast />:
 *
 *   - The banner is PERSISTENT — sits at the top of every page until
 *     the user clicks "Download" or dismisses for the current version.
 *     Easy to ignore for a moment but always there when they're ready.
 *
 *   - The toast is EPHEMERAL — a bottom-right nudge that's harder to
 *     miss the first time but disappears on click. Both surfaces share
 *     the same per-version dismiss state via useDesktopVersionCheck,
 *     so closing one closes the other for that release.
 *
 * Inert outside Electron (the hook self-disables in browser context).
 */
import { Box, Button, IconButton, Stack, Typography, alpha } from '@mui/material';
import { IconRocket, IconX } from '@tabler/icons-react';
import { useDesktopVersionCheck } from '../../hooks/useDesktopVersionCheck';
import { useDesktopDownload } from '../../contextProviders/DesktopDownloadProvider';
import { tokens } from '../../theme/theme';

export default function VersionUpdateBanner() {
  const { openDownloadDialog } = useDesktopDownload();
  const { updateAvailable, latestVersion, dismiss } = useDesktopVersionCheck();

  // Hook short-circuits in web → updateAvailable stays false. Nothing
  // to render.
  if (!updateAvailable) return null;

  function handleDownload() {
    dismiss(); // close both banner + toast as soon as user acts
    openDownloadDialog();
  }

  return (
    <Box
      sx={{
        position: 'relative',
        // Brand green — matches tokens.colors.success so the banner reads
        // as a positive, "good news" affordance rather than a warning.
        background: `linear-gradient(90deg, ${alpha(
          tokens.colors.success,
          0.92,
        )} 0%, ${alpha(tokens.colors.success, 0.78)} 100%)`,
        color: '#fff',
        py: 0.75,
        px: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ maxWidth: 1600, mx: 'auto' }}
      >
        <IconRocket size={16} style={{ flexShrink: 0 }} />
        <Typography
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            // Truncate on very narrow windows so the action button stays
            // visible no matter what.
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          A new release ({`v${latestVersion}`}) has been published. Please
          download for the best experience.
        </Typography>
        <Button
          size="small"
          onClick={handleDownload}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 1.5,
            color: tokens.colors.success,
            bgcolor: '#fff',
            px: 1.5,
            py: 0.25,
            minHeight: 26,
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: '#fff',
              filter: 'brightness(0.96)',
            },
          }}
        >
          Download
        </Button>
        <IconButton
          size="small"
          onClick={dismiss}
          aria-label="Dismiss update banner"
          sx={{
            color: alpha('#fff', 0.85),
            p: 0.25,
            '&:hover': { color: '#fff', bgcolor: alpha('#fff', 0.1) },
          }}
        >
          <IconX size={14} />
        </IconButton>
      </Stack>
    </Box>
  );
}
