/**
 * Public download page for the Unistack desktop installers.
 *
 * Fetches `desktop/latest.json` from the DO Spaces bucket on mount so
 * new releases appear automatically — no code change required per
 * release. The release script (`scripts/release-desktop.sh`) writes
 * over `latest.json` after every successful upload.
 *
 * Reachable from:
 *   - The web app's dashboard download banner ("Get for desktop")
 *   - The desktop client's settings dialog ("Re-download / share")
 *   - The version-check toast ("Download now") inside the desktop app
 *   - A direct link an admin shares with a teammate
 */
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { IconBrandApple, IconBrandWindows, IconDownload } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

interface LatestJson {
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

export default function DesktopDownloadPage() {
  const [latest, setLatest] = useState<LatestJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // `cache: 'no-cache'` because S3 / Spaces cache aggressively and we
    // want users to see the new version as soon as the release script
    // overwrites latest.json — even if their browser has a stale copy.
    fetch(LATEST_URL, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: LatestJson) => {
        if (!cancelled) {
          setLatest(data);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(
            'Could not fetch the latest release info. Check your connection and refresh.',
          );
          console.error('[desktop-download] fetch failed:', e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 20% -10%, ${alpha(
          tokens.colors.pink,
          0.18,
        )}, transparent 60%), radial-gradient(circle at 80% 0%, ${alpha(
          tokens.colors.blue,
          0.18,
        )}, transparent 60%), ${tokens.colors.lightBg}`,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
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

        {loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {latest && !loading && !error && (
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
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
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
      </Container>
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
