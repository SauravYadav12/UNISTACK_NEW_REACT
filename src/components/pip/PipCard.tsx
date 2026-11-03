import { Box, Chip, Stack, Typography, alpha, Avatar } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import { Pip, PIP_REASON_LABELS } from '../../Interfaces/pip';
import { PIP_STATUS_META } from './pipStatus';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export default function PipCard({
  pip,
  onClick,
}: {
  pip: Pip;
  onClick: () => void;
}) {
  const meta = PIP_STATUS_META[pip.status];
  const isDraft = pip.status === 'draft';
  const end = pip.endDate ? moment(pip.endDate) : null;
  const daysLeft = end ? end.startOf('day').diff(moment().startOf('day'), 'days') : null;

  let footer: string;
  if (isDraft) {
    footer = 'Draft · not sent yet';
  } else if (pip.status === 'active') {
    const base = `Started ${moment(pip.startDate).format('MMM D, YYYY')} · ends ${end?.format('MMM D, YYYY')}`;
    footer =
      daysLeft != null && daysLeft >= 0
        ? `${base} · ${daysLeft}d left`
        : `${base} · review due`;
  } else {
    footer = `${meta.label}${pip.resolvedAt ? ` on ${moment(pip.resolvedAt).format('MMM D, YYYY')}` : ''}`;
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${meta.color}`,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: `0 6px 24px ${alpha(meta.color, 0.18)}`, transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: alpha(meta.color, 0.15), color: meta.color, fontWeight: 700, width: 38, height: 38, fontSize: 14 }}>
            {initials(pip.employeeName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>{pip.employeeName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {pip.extensionDays > 0 ? `Extended +${pip.extensionDays}d · ` : ''}
              {pip.durationDays}-day plan
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={meta.label}
          sx={{ bgcolor: alpha(meta.color, 0.15), color: meta.color, fontWeight: 700 }}
        />
      </Stack>

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
        {pip.reasons.slice(0, 4).map((r) => (
          <Chip
            key={r}
            size="small"
            variant="outlined"
            label={r === 'other' && pip.otherReason ? pip.otherReason : PIP_REASON_LABELS[r]}
            sx={{ maxWidth: 220, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1.5, color: tokens.colors.lightTextSecondary }}>
        <IconCalendarEvent size={14} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{footer}</Typography>
      </Stack>
    </Box>
  );
}
