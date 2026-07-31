import { Box, CircularProgress, IconButton, Slider, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { resolveQuoAudioUrl } from '../../services/quoApi';

/**
 * Small in-app audio player. Uses the server proxy endpoint — asks
 * for a fresh Quo signed URL each mount so expired URLs are never
 * user-facing.
 */
interface Props {
  kind: 'recording' | 'voicemail';
  callId: string;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ kind, callId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setUrl('');
    resolveQuoAudioUrl(kind, callId)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load audio.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, callId]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: '#F8FAFC',
      }}
    >
      {loading ? (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading audio…
          </Typography>
        </Stack>
      ) : error ? (
        <Stack direction="row" alignItems="center" spacing={1.5} color="error.main">
          <IconAlertTriangle size={16} />
          <Typography variant="body2">{error}</Typography>
        </Stack>
      ) : (
        <>
          <audio
            ref={audioRef}
            src={url}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={toggle}
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {playing ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
            </IconButton>
            <Slider
              size="small"
              value={pos}
              max={dur || 100}
              onChange={(_, v) => {
                const el = audioRef.current;
                if (el) el.currentTime = Number(v);
              }}
              sx={{ mx: 1, flex: 1 }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                minWidth: 80,
                textAlign: 'right',
              }}
            >
              {fmt(pos)} / {fmt(dur)}
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
}
