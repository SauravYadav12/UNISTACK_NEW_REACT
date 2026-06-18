/**
 * Bottom-right toast that nudges desktop users to grab a newer shell
 * when one is published on DO Spaces. Mounted from Layout.tsx; the
 * hook itself self-disables in the browser so this toast is inert
 * there (web users continue to see the DownloadBanner on the
 * dashboard instead).
 *
 * Two affordances:
 *   - "Download now"     → /download (in the same window)
 *   - "Remind me later"  → per-version dismiss; the toast won't reappear
 *                          for THIS version, but a newer version will
 *                          re-prompt.
 */
import { Box, Button, IconButton, Slide, Stack, Typography, alpha } from '@mui/material';
import { IconRocket, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme/theme';
import { useDesktopVersionCheck } from '../../hooks/useDesktopVersionCheck';

export default function VersionUpdateToast() {
  const navigate = useNavigate();
  const { updateAvailable, currentVersion, latestVersion, notes, dismiss } =
    useDesktopVersionCheck();

  function handleDownload() {
    dismiss(); // close the toast as soon as the user acts
    navigate('/download');
  }

  return (
    <Slide direction="up" in={updateAvailable} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: (t) => t.zIndex.snackbar + 1,
          width: 360,
          maxWidth: 'calc(100vw - 48px)',
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: `0 18px 40px ${alpha(tokens.colors.pink, 0.25)}`,
          border: `1px solid ${alpha(tokens.colors.pink, 0.25)}`,
        }}
      >
        <IconButton
          size="small"
          onClick={dismiss}
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
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ pr: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
            }}
          >
            <IconRocket size={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
              Unistack desktop v{latestVersion} is out
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                display: 'block',
                mb: 1,
              }}
            >
              You're on v{currentVersion || '—'}.{' '}
              {notes ? notes : 'Grab the new build when you have a moment.'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={handleDownload}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: tokens.colors.pink,
                  '&:hover': { bgcolor: tokens.colors.pink, filter: 'brightness(0.92)' },
                }}
              >
                Download now
              </Button>
              <Button
                size="small"
                onClick={dismiss}
                sx={{
                  textTransform: 'none',
                  color: tokens.colors.lightTextSecondary,
                }}
              >
                Remind me later
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Slide>
  );
}
