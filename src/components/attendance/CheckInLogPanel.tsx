import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClockHour4,
} from '@tabler/icons-react';
import moment from 'moment';
import mz from 'moment-timezone';
import { tokens } from '../../theme/theme';
import { getCheckInLogs } from '../../services/checkinApi';
import { ICheckInSession, CheckInLogScope } from '../../Interfaces/checkin';

function tzForShift(shift?: string): string {
  return shift === 'India' ? 'Asia/Kolkata' : 'America/New_York';
}

function fmtTime(iso: string | null, shift?: string): string {
  if (!iso) return '—';
  return mz.tz(iso, tzForShift(shift)).format('h:mm A');
}

function fmtDuration(seconds: number | null, live?: { checkInAt: string }): string {
  let s = seconds;
  if (s == null && live) {
    // Open session — show elapsed so far.
    s = Math.max(0, Math.floor((Date.now() - new Date(live.checkInAt).getTime()) / 1000));
  }
  if (s == null) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

/**
 * Super-admin check-in / check-out log for the Attendance Dashboard.
 * Day / week / month toggle + date navigator. Reads /checkin/logs, which
 * returns every employee's sessions for the range (super-admin scope).
 * Renders a flat table plus a per-employee hours summary for week/month.
 */
export default function CheckInLogPanel({ selfView = false }: { selfView?: boolean }) {
  const [scope, setScope] = useState<CheckInLogScope>('day');
  const [anchor, setAnchor] = useState(moment());
  const [sessions, setSessions] = useState<ICheckInSession[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCheckInLogs({
        scope,
        date: anchor.format('YYYY-MM-DD'),
      });
      setSessions(res.data?.data?.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [scope, anchor]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeLabel = useMemo(() => {
    if (scope === 'day') return anchor.format('ddd, MMM D, YYYY');
    if (scope === 'week') {
      const from = anchor.clone().startOf('isoWeek');
      const to = anchor.clone().endOf('isoWeek');
      return `${from.format('MMM D')} – ${to.format('MMM D, YYYY')}`;
    }
    return anchor.format('MMMM YYYY');
  }, [scope, anchor]);

  const shift = (unit: 'add' | 'subtract') => {
    const u = scope === 'day' ? 'day' : scope === 'week' ? 'week' : 'month';
    setAnchor((a) => a.clone()[unit](1, u));
  };

  // Per-employee totals (shown for week/month).
  const perEmployee = useMemo(() => {
    const map = new Map<
      string,
      { name: string; totalSeconds: number; count: number }
    >();
    for (const s of sessions) {
      const key = String(s.userRef);
      const cur = map.get(key) || {
        name: s.userName || s.userEmail || 'Employee',
        totalSeconds: 0,
        count: 0,
      };
      cur.totalSeconds += s.durationSeconds || 0;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [sessions]);

  const totalHours = useMemo(() => {
    const secs = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    return (secs / 3600).toFixed(1);
  }, [sessions]);

  function sourceChip(s: ICheckInSession) {
    if (!s.checkOutAt) {
      return <Chip size="small" label="Open" sx={{ bgcolor: alpha(tokens.colors.blue, 0.12), color: tokens.colors.blueDark, fontWeight: 700 }} />;
    }
    if (s.autoCheckout || s.checkoutSource === 'auto') {
      return <Chip size="small" label="Auto (14h)" sx={{ bgcolor: alpha('#F59E0B', 0.15), color: '#B45309', fontWeight: 700 }} />;
    }
    if (s.checkoutSource === 'logout') {
      return <Chip size="small" label="Logout" sx={{ bgcolor: alpha(tokens.colors.blue, 0.1), color: tokens.colors.blueDark, fontWeight: 600 }} />;
    }
    return <Chip size="small" label="Manual" sx={{ bgcolor: alpha(tokens.colors.success, 0.12), color: tokens.colors.success, fontWeight: 600 }} />;
  }

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header + controls */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: 2.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tokens.gradients.pinkBlue, color: '#fff',
            }}
          >
            <IconClockHour4 size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {selfView ? 'My Check-in / Check-out' : 'Check-in / Check-out Log'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sessions.length} session{sessions.length === 1 ? '' : 's'} · {totalHours}h total
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={scope}
            onChange={(_, v) => v && setScope(v)}
          >
            <ToggleButton value="day" sx={{ textTransform: 'none', fontWeight: 700 }}>Day</ToggleButton>
            <ToggleButton value="week" sx={{ textTransform: 'none', fontWeight: 700 }}>Week</ToggleButton>
            <ToggleButton value="month" sx={{ textTransform: 'none', fontWeight: 700 }}>Month</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={() => shift('subtract')}>
              <IconChevronLeft size={18} />
            </IconButton>
            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 150, textAlign: 'center' }}>
              {rangeLabel}
            </Typography>
            <IconButton size="small" onClick={() => shift('add')}>
              <IconChevronRight size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress size={26} />
        </Box>
      ) : sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No check-ins recorded for {rangeLabel}.
        </Typography>
      ) : (
        <>
          {/* Per-employee hours summary (week/month) — admin view only */}
          {!selfView && scope !== 'day' && perEmployee.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {perEmployee.map((e) => (
                <Tooltip key={e.name} title={`${e.count} session${e.count === 1 ? '' : 's'}`} arrow>
                  <Chip
                    label={`${e.name} · ${(e.totalSeconds / 3600).toFixed(1)}h`}
                    size="small"
                    sx={{ bgcolor: alpha(tokens.colors.pink, 0.08), fontWeight: 600, mb: 1 }}
                  />
                </Tooltip>
              ))}
            </Stack>
          )}

          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {!selfView && <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>}
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s._id} hover>
                    {!selfView && (
                      <TableCell>{s.userName || s.userEmail || '—'}</TableCell>
                    )}
                    <TableCell>{moment(s.date, 'YYYY-MM-DD').format('MMM D')}</TableCell>
                    <TableCell>{fmtTime(s.checkInAt, s.shift)}</TableCell>
                    <TableCell>{fmtTime(s.checkOutAt, s.shift)}</TableCell>
                    <TableCell>
                      {fmtDuration(s.durationSeconds, !s.checkOutAt ? { checkInAt: s.checkInAt } : undefined)}
                    </TableCell>
                    <TableCell>{sourceChip(s)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
