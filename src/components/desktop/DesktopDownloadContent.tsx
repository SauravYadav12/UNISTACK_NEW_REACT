/**
 * The actual download-screen body — hero copy, fetch state, installer
 * cards, install-warning notes. Rendered by BOTH:
 *   - <DesktopDownloadPage />   (the public /download route, for
 *      shareable external links)
 *   - <DesktopDownloadDialog /> (the in-app modal, used by the navbar
 *      button, dashboard banner, version-update toast, etc.)
 *
 * Keeping the content in one component avoids a copy-paste maintenance
 * trap when we tweak release notes / install warnings later.
 */
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconBrandApple,
  IconBrandWindows,
  IconDownload,
  IconRocket,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

export interface LatestJson {
  version: string;
  releasedAt: string;
  mac: { url: string; sizeBytes: number };
  win: { url: string; sizeBytes: number };
  notes: string;
}

const LATEST_URL =
  'https://blr1.digitaloceanspaces.com/unistack-storage/desktop/latest.json';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: LatestJson }
  | { kind: 'unavailable' };

interface Props {
  /** When true, hides the page-style hero header (the gradient title +
   *  blurb). The modal renders its own dialog title, so we don't want
   *  to repeat it. */
  compact?: boolean;
}

export default function DesktopDownloadContent({ compact = false }: Props) {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(LATEST_URL, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: LatestJson) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        // Console-only — all failure modes (404, CORS, offline) collapse
        // to the same friendly empty state, so there's nothing useful
        // for the user to do with the underlying error message.
        console.error('[desktop-download] fetch failed:', e);
        setState({ kind: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = state.kind === 'loading';
  const latest = state.kind === 'ready' ? state.data : null;

  return (
    <Box>
      {!compact && (
        <Stack spacing={2} sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 28, md: 40 },
              background: tokens.gradients.pinkBlue,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Unistack for desktop
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.colors.lightTextSecondary }}>
            Tray-resident app with native notifications, faster access, and a
            dedicated home for Uchat.
          </Typography>
          {latest && (
            <Typography variant="caption" sx={{ color: tokens.colors.lightTextSecondary }}>
              Latest version <strong>{latest.version}</strong> · released{' '}
              {formatDate(latest.releasedAt)}
            </Typography>
          )}
        </Stack>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {state.kind === 'unavailable' && <NotPublishedCard />}

      {latest && (
        <>
          {latest.notes && (
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(tokens.colors.blue, 0.05),
                borderColor: alpha(tokens.colors.blue, 0.25),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: tokens.colors.blue,
                  textTransform: 'uppercase',
                }}
              >
                What's new
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: tokens.colors.lightText }}>
                {latest.notes}
              </Typography>
            </Card>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <InstallerCard
              platform="mac"
              version={latest.version}
              url={latest.mac.url}
              sizeBytes={latest.mac.sizeBytes}
            />
            <InstallerCard
              platform="win"
              version={latest.version}
              url={latest.win.url}
              sizeBytes={latest.win.sizeBytes}
            />
          </Stack>
          <InstallNotes />
        </>
      )}
    </Box>
  );
}

function InstallerCard({
  platform,
  version,
  url,
  sizeBytes,
}: {
  platform: 'mac' | 'win';
  version: string;
  url: string;
  sizeBytes: number;
}) {
  const isMac = platform === 'mac';
  const accent = isMac ? tokens.colors.blue : tokens.colors.pink;
  const Icon = isMac ? IconBrandApple : IconBrandWindows;
  const label = isMac ? 'macOS' : 'Windows';
  const filenameHint = isMac ? '.dmg' : '.exe';
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        p: 3,
        borderRadius: 3,
        borderColor: alpha(accent, 0.25),
        bgcolor: 'background.paper',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 28px ${alpha(accent, 0.15)}`,
        },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: alpha(accent, 0.12),
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={28} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
            Unistack for {label}
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.colors.lightTextSecondary }}>
            v{version} · {formatBytes(sizeBytes)} · {filenameHint}
          </Typography>
        </Box>
        <Button
          variant="contained"
          fullWidth
          component="a"
          href={url}
          download
          startIcon={<IconDownload size={16} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: accent,
            '&:hover': { bgcolor: accent, filter: 'brightness(0.92)' },
          }}
        >
          Download for {label}
        </Button>
      </Stack>
    </Card>
  );
}

function NotPublishedCard() {
  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        textAlign: 'center',
        bgcolor: alpha(tokens.colors.pink, 0.04),
        borderColor: alpha(tokens.colors.pink, 0.2),
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tokens.gradients.pinkBlue,
            color: '#fff',
          }}
        >
          <IconRocket size={26} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, md: 22 } }}>
          Desktop installer is on its way
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: tokens.colors.lightTextSecondary, maxWidth: 520 }}
        >
          The Windows + macOS installers haven't been published yet. As soon
          as the first build is uploaded, this view will show the download
          cards automatically — no further action needed from you. The web
          app at <strong>www.unistack.in</strong> continues to work normally
          in the meantime.
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: tokens.colors.lightTextSecondary,
            mt: 1,
            fontStyle: 'italic',
          }}
        >
          Want to be notified at launch? Drop a note to IT and we'll add you
          to the rollout list.
        </Typography>
      </Stack>
    </Card>
  );
}

function InstallNotes() {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: alpha(tokens.colors.yellowDark, 0.05),
        borderColor: alpha(tokens.colors.yellowDark, 0.3),
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: 1,
          color: tokens.colors.yellowDark,
          textTransform: 'uppercase',
        }}
      >
        First-launch warning (unsigned installer)
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ color: tokens.colors.lightText }}>
          <strong>macOS:</strong> right-click the downloaded <code>.dmg</code> →{' '}
          <em>Open</em>. Gatekeeper warns once because we haven't notarized this
          build yet; subsequent launches don't ask again.
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.colors.lightText }}>
          <strong>Windows:</strong> SmartScreen shows "unrecognized app" — click{' '}
          <em>More info → Run anyway</em>. This is expected for now and will go
          away once we code-sign the installer.
        </Typography>
      </Stack>
    </Card>
  );
}
