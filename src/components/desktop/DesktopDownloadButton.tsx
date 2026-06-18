/**
 * Persistent "Download app" affordance in the navbar — auto-detects
 * the user's OS (macOS shows Apple icon, Windows shows Windows icon)
 * and links to the /download page.
 *
 * Self-hides when running inside Electron — desktop users already have
 * the app, so showing them a download CTA would be redundant noise.
 *
 * Lives next to the existing dashboard `DownloadBanner` (which is
 * dismissible); this button is the always-on fallback so users who
 * dismissed the banner still have a one-click path to /download.
 */
import { Box, Tooltip, Typography, alpha } from '@mui/material';
import { IconBrandApple, IconBrandWindows, IconDownload } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { isRunningInDesktop } from '../../utils/desktopBridge';
import { useDesktopDownload } from '../../contextProviders/DesktopDownloadProvider';

type OS = 'mac' | 'win' | 'other';

/**
 * Best-effort OS sniff for choosing which installer icon to show in
 * the navbar. We don't gate the actual download — users on Linux or
 * mobile see the generic download glyph and still land on /download
 * where both installer cards are listed. Modern UA hints would be
 * cleaner, but they're not universally supported and we only need
 * a single-character branching here.
 */
function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (/Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh|Mac OS X/i.test(ua)) {
    return 'mac';
  }
  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    return 'win';
  }
  return 'other';
}

export default function DesktopDownloadButton() {
  // Short-circuit before anything renders — desktop users never see
  // this. Hook calls below must not run for them since the provider
  // is mounted at the same Layout level and the hook would still
  // resolve, but skipping work is more honest.
  if (isRunningInDesktop()) return null;

  const { openDownloadDialog } = useDesktopDownload();
  const os = detectOS();
  const isMac = os === 'mac';
  const isWin = os === 'win';
  const Icon = isMac ? IconBrandApple : isWin ? IconBrandWindows : IconDownload;
  const label = isMac ? 'macOS' : isWin ? 'Windows' : 'desktop';

  return (
    <Tooltip
      title={`Get Unistack for ${label} — tray, notifications, faster access.`}
      placement="bottom"
    >
      <Box
        component="button"
        onClick={openDownloadDialog}
        sx={{
          // Reset native button defaults so MUI sx can style it cleanly.
          cursor: 'pointer',
          font: 'inherit',
          // Same visual rhythm as the search box / attendance popup
          // so the button sits naturally between them.
          display: { xs: 'none', sm: 'inline-flex' },
          textDecoration: 'none',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.6,
          borderRadius: 2,
          // Soft pink→blue gradient outline + subtle fill so the button
          // reads as "branded action" without being loud.
          background: `linear-gradient(135deg, ${alpha(
            tokens.colors.pink,
            0.06,
          )}, ${alpha(tokens.colors.blue, 0.06)})`,
          border: `1px solid ${alpha(tokens.colors.pink, 0.22)}`,
          color: tokens.colors.pinkDark,
          transition: 'transform 0.15s, background 0.2s, border-color 0.2s',
          '&:hover': {
            transform: 'translateY(-1px)',
            background: `linear-gradient(135deg, ${alpha(
              tokens.colors.pink,
              0.12,
            )}, ${alpha(tokens.colors.blue, 0.12)})`,
            borderColor: alpha(tokens.colors.pink, 0.4),
          },
        }}
      >
        <Icon size={16} />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: tokens.colors.pinkDark,
            letterSpacing: 0.2,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Download App
        </Typography>
      </Box>
    </Tooltip>
  );
}
