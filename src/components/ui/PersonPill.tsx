import { Box, Typography, Avatar } from '@mui/material';

// ── Per-person dynamic color (hue rotates with name hash) ──
// Same name always gives the same color across any table/column.
// Different names get different hues — works for any number of unique people,
// even new ones added later.

// FNV-1a hash — good distribution, keeps neighboring strings apart.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) | 0;
  }
  return h >>> 0;
}

export interface PersonColor {
  color: string;
  dark: string;
  bg: string;
  border: string;
  hoverBg: string;
  gradient: string;
}

export function getPersonColor(name?: string): PersonColor {
  const key = (name || '').trim().toLowerCase();
  // Pick a hue from 16-340°, skipping the pure-red band so person chips
  // don't clash with error/cancelled status red.
  const hue = key ? (hashString(key) % 325) + 16 : 215;
  const hue2 = (hue + 28) % 360;
  return {
    color: `hsl(${hue}, 68%, 48%)`,
    dark: `hsl(${hue}, 72%, 32%)`,
    bg: `hsla(${hue}, 68%, 48%, 0.08)`,
    border: `hsla(${hue}, 68%, 48%, 0.22)`,
    hoverBg: `hsla(${hue}, 68%, 48%, 0.14)`,
    gradient: `linear-gradient(135deg, hsl(${hue}, 72%, 52%) 0%, hsl(${hue2}, 68%, 62%) 100%)`,
  };
}

export function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * PersonPill — colored avatar + name chip.
 * Each unique name gets its own stable color everywhere it's rendered.
 */
export default function PersonPill({
  name,
  size = 'md',
}: {
  name?: string;
  /** 'sm' for compact cells, 'md' (default) for grid rows */
  size?: 'sm' | 'md';
}) {
  if (!name) {
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  }
  const c = getPersonColor(name);
  const avatar = size === 'sm' ? 18 : 22;
  const pad = size === 'sm' ? 0.75 : 1;
  const height = size === 'sm' ? 26 : 30;
  const fontSize = size === 'sm' ? '0.7rem' : '0.78rem';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: pad,
        py: 0.375,
        borderRadius: '8px',
        bgcolor: c.bg,
        border: `1px solid ${c.border}`,
        height,
        maxWidth: '100%',
        transition: 'background 0.15s ease',
        '&:hover': { bgcolor: c.hoverBg },
      }}
    >
      <Avatar
        sx={{
          width: avatar,
          height: avatar,
          fontSize: size === 'sm' ? '0.55rem' : '0.6rem',
          fontWeight: 700,
          background: c.gradient,
          color: '#fff',
          boxShadow: `0 2px 6px ${c.bg}`,
        }}
      >
        {getInitials(name)}
      </Avatar>
      <Typography
        noWrap
        sx={{ fontSize, fontWeight: 600, color: c.dark, minWidth: 0 }}
      >
        {name}
      </Typography>
    </Box>
  );
}
