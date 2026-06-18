/**
 * "Get Unistack for desktop" banner — shown on the dashboard for web
 * users only. Hidden when running inside Electron (no point promoting
 * the desktop app to someone who's already using it). Dismissal is
 * sticky per-browser via localStorage so we don't pester users who
 * actively declined.
 */
import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography, alpha } from '@mui/material';
import { IconBrandApple, IconBrandWindows, IconX } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { isRunningInDesktop } from '../../utils/desktopBridge';
import { useDesktopDownload } from '../../contextProviders/DesktopDownloadProvider';

const DISMISS_KEY = 'unistack.desktopBannerDismissed';

export default function DownloadBanner() {
  // Desktop users never see this — short-circuit before any hook so the
  // banner is fully tree-shaken from the render path in Electron.
  if (isRunningInDesktop()) return null;

  const { openDownloadDialog } = useDesktopDownload();
  // Initial state reads localStorage once; subsequent dismiss writes the
  // flag synchronously so a re-render doesn't reshow the banner.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // localStorage disabled / quota exceeded → in-memory dismiss only.
    }
    setDismissed(true);
  }

  return (
    <Box
      sx={{
        position: 'relative',
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(
          tokens.colors.pink,
          0.08,
        )}, ${alpha(tokens.colors.blue, 0.08)})`,
        border: '1px solid',
        borderColor: alpha(tokens.colors.pink, 0.2),
      }}
    >
      <IconButton
        size="small"
        onClick={handleDismiss}
        aria-label="Dismiss"
        sx={{
          position: 'absolute',
          top: 6,
          right: 6,
          color: tokens.colors.lightTextSecondary,
        }}
      >
        <IconX size={14} />
      </IconButton>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
            }}
          >
            <IconBrandApple size={18} style={{ marginRight: -6 }} />
            <IconBrandWindows size={18} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
              Get Unistack for desktop
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.colors.lightTextSecondary }}
            >
              Tray-resident app with native notifications and faster access.
              Available for macOS + Windows.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          size="small"
          onClick={openDownloadDialog}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            background: tokens.gradients.pinkBlue,
            whiteSpace: 'nowrap',
            '&:hover': { filter: 'brightness(0.95)' },
          }}
        >
          View installers
        </Button>
      </Stack>
    </Box>
  );
}
