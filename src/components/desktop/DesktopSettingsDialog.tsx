/**
 * Hidden settings dialog for the Unistack desktop client.
 *
 * Opens via Cmd+Shift+, (macOS) / Ctrl+Shift+, (Windows). The shortcut
 * is registered from Layout.tsx (only when running in Electron).
 *
 * Surfaces three knobs employees may need:
 *   1. Backend URL override — point the shell at staging / a local dev
 *      server without re-installing. Cleared by leaving the field blank.
 *   2. Auto-launch on system boot toggle.
 *   3. Hard Quit — bypasses the minimize-to-tray behaviour of the
 *      window's close button.
 *
 * Plus an informational footer with the shell version + a link to the
 * /download page for re-grabbing the latest installer.
 */
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { toast } from 'react-toastify';
import { tokens } from '../../theme/theme';
import { getDesktopBridge } from '../../utils/desktopBridge';
import { useDesktopDownload } from '../../contextProviders/DesktopDownloadProvider';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DesktopSettingsDialog({ open, onClose }: Props) {
  const bridge = getDesktopBridge();
  const { openDownloadDialog } = useDesktopDownload();
  const [serverUrl, setServerUrl] = useState('');
  const [originalServerUrl, setOriginalServerUrl] = useState('');
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);

  // Refresh state every time the dialog opens — values may have changed
  // since the last view (e.g. user toggled auto-launch elsewhere).
  useEffect(() => {
    if (!open || !bridge) return;
    Promise.all([
      bridge.getServerUrl(),
      bridge.getAutoLaunch(),
      bridge.getVersion(),
    ]).then(([url, auto, v]) => {
      setServerUrl(url);
      setOriginalServerUrl(url);
      setAutoLaunch(auto);
      setVersion(v);
    });
  }, [open, bridge]);

  if (!bridge) return null;

  async function handleSave() {
    if (!bridge) return;
    setSaving(true);
    try {
      const updates: Promise<unknown>[] = [];
      if (serverUrl.trim() !== originalServerUrl.trim()) {
        // Empty string → null → clears the override and reverts to the
        // baked default. main.ts will reload the window on this change
        // so users get instant feedback.
        const next = serverUrl.trim() === '' ? null : serverUrl.trim();
        updates.push(bridge.setServerUrl(next));
      }
      // Auto-launch is a pure flip — always send the current value;
      // OS-level no-op if it matches.
      updates.push(bridge.setAutoLaunch(autoLaunch));
      await Promise.all(updates);
      toast.success('Settings saved');
      onClose();
    } catch (err) {
      console.error('[desktop-settings] save failed:', err);
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuit() {
    if (!bridge) return;
    await bridge.quit();
  }

  function handleResetUrl() {
    setServerUrl('');
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        Desktop settings
        <Typography
          variant="caption"
          sx={{ display: 'block', color: tokens.colors.lightTextSecondary, mt: 0.5 }}
        >
          Advanced — most employees never need to touch these.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: tokens.colors.lightTextSecondary, textTransform: 'uppercase' }}>
              Backend URL
            </Typography>
            <TextField
              size="small"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://www.unistack.in"
              helperText="Override only for staging or local-dev. Leave blank to use the production default. Changes take effect immediately."
              FormHelperTextProps={{ sx: { mx: 0 } }}
              fullWidth
            />
            <Button
              size="small"
              onClick={handleResetUrl}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Reset to production
            </Button>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: tokens.colors.lightTextSecondary, textTransform: 'uppercase' }}>
              Startup
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoLaunch}
                  onChange={(e) => setAutoLaunch(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Launch Unistack automatically when I log in
                </Typography>
              }
            />
          </Stack>

          <Stack spacing={1} sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.lightTextSecondary, 0.04),
            border: `1px dashed ${alpha(tokens.colors.lightTextSecondary, 0.2)}`,
          }}>
            <Typography variant="caption" sx={{ color: tokens.colors.lightTextSecondary }}>
              Shell version <strong>{version || '—'}</strong>
            </Typography>
            <Typography variant="caption">
              Need a re-install or want to share?{' '}
              <Box
                component="button"
                onClick={() => {
                  onClose();
                  openDownloadDialog();
                }}
                sx={{
                  background: 'none',
                  border: 'none',
                  p: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  color: tokens.colors.blueDark,
                  textDecoration: 'underline',
                }}
              >
                Open download dialog
              </Box>
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'space-between' }}>
        <Button
          onClick={handleQuit}
          color="error"
          variant="outlined"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Quit Unistack
        </Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
