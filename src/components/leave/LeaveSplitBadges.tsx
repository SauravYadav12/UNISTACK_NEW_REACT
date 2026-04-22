import { Stack, Typography, alpha } from '@mui/material';
import { LeaveSplitItem } from '../../Interfaces/leaves';
import { LeaveType } from '../../Interfaces/salary';
import { tokens } from '../../theme/theme';

interface Props {
  split?: LeaveSplitItem[];
  types: LeaveType[];
  size?: 'xs' | 'sm';
}

// Renders a row of small badges like: [2 PL] · [2 UL] for a leave whose
// `splitBreakdown` records how the total days were allocated across
// different types. Returns null when there's no split or only a single
// single-type entry (nothing informative to show).
export default function LeaveSplitBadges({ split, types, size = 'sm' }: Props) {
  if (!split || split.length < 2) return null;

  const byId = new Map(types.map((t) => [t._id, t]));
  const fontSize = size === 'xs' ? 9.5 : 10.5;
  const padX = size === 'xs' ? 0.5 : 0.75;
  const padY = size === 'xs' ? 0.15 : 0.25;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
      {split.map((item, idx) => {
        const t = byId.get(
          typeof item.leaveType === 'string' ? item.leaveType : String(item.leaveType),
        );
        const code = t?.code || 'LV';
        const color = t?.color || tokens.colors.pink;
        return (
          <Stack
            key={`${code}-${idx}`}
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              px: padX,
              py: padY,
              borderRadius: 1,
              bgcolor: alpha(color, 0.1),
              border: `1px solid ${alpha(color, 0.25)}`,
            }}
          >
            <Typography
              sx={{ fontSize, fontWeight: 800, color, letterSpacing: 0.5, lineHeight: 1 }}
            >
              {item.days}
            </Typography>
            <Typography sx={{ fontSize: fontSize - 1, fontWeight: 700, color, letterSpacing: 1, lineHeight: 1 }}>
              {code}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
