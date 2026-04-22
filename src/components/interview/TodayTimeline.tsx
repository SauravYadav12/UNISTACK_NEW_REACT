import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Skeleton,
  Tooltip,
  IconButton,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';
import {
  IconCalendarEvent,
  IconRefresh,
  IconClock,
  IconMoonStars,
} from '@tabler/icons-react';
import { interviewsList } from '../../services/interviewApi';
import { IInterview } from '../../Interfaces/types';
import { InterviewStatus } from '../../Interfaces/reports';
import { tokens } from '../../theme/theme';
import { interviewStatusColors } from '../../pages/Marketing/Interviews/interviewValues';
import { timeFormate } from '../constants';
import { getPersonColor, getInitials } from '../ui/PersonPill';

const MotionBox = motion.create(Box);

/**
 * Parse a time string like "10:30 AM" or "14:00" → minutes from midnight (0-1439).
 * Returns null if unparseable.
 */
function parseTimeToMinutes(t?: string | null): number | null {
  if (!t) return null;
  const parsed = moment(t, [timeFormate, 'HH:mm', 'h:mm A', 'hh:mm A'], true);
  if (!parsed.isValid()) return null;
  return parsed.hours() * 60 + parsed.minutes();
}

const HOUR_START = 7; // 7 AM
const HOUR_END = 22; // 10 PM — visible business window
const VISIBLE_MINUTES = (HOUR_END - HOUR_START) * 60;

function minutesToPct(min: number) {
  const offset = min - HOUR_START * 60;
  return Math.max(0, Math.min(100, (offset / VISIBLE_MINUTES) * 100));
}

interface PlacedInterview {
  interview: IInterview;
  minutes: number;
  lane: number; // 0 = top lane, 1 = bottom lane (for de-conflicting close times)
}

interface Props {
  onOpenInterview?: (interview: IInterview) => void;
  refreshKey?: number;
}

export default function TodayTimeline({ onOpenInterview, refreshKey = 0 }: Props) {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [now, setNow] = useState(() => moment());

  // Refresh "now" every minute
  useEffect(() => {
    const id = setInterval(() => setNow(moment()), 60_000);
    return () => clearInterval(id);
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const today = moment().format('YYYY/MM/DD');
      const { data } = await interviewsList(`interviewDate=${today}&limit=500`);
      setInterviews(data.data?.results || []);
    } catch (e) {
      console.error('TodayTimeline load error', e);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Place interviews on two lanes to avoid overlaps for same-hour dots
  const placed: PlacedInterview[] = useMemo(() => {
    const mapped = interviews
      .map((i) => ({ interview: i, minutes: parseTimeToMinutes(i.interviewTime) }))
      .filter((x): x is { interview: IInterview; minutes: number } => x.minutes !== null)
      .sort((a, b) => a.minutes - b.minutes);

    const result: PlacedInterview[] = [];
    const laneLastEnd: number[] = [-Infinity, -Infinity];
    const PROXIMITY = 30; // if < 30 min apart, bump to next lane

    mapped.forEach(({ interview, minutes }) => {
      // Find lowest-index lane whose last entry is far enough before
      let lane = 0;
      if (minutes - laneLastEnd[0] < PROXIMITY) lane = 1;
      if (minutes - laneLastEnd[1] < PROXIMITY && lane === 1) {
        // Both lanes crowded — use lane 0 anyway (dots will overlap slightly)
        lane = 0;
      }
      laneLastEnd[lane] = minutes;
      result.push({ interview, minutes, lane });
    });
    return result;
  }, [interviews]);

  const nowMinutes = now.hours() * 60 + now.minutes();
  const nowVisible = nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60;
  const nowPct = minutesToPct(nowMinutes);

  const upcoming = placed.filter((p) => p.minutes >= nowMinutes);
  const past = placed.filter((p) => p.minutes < nowMinutes);

  // Next interview for headline
  const next = upcoming[0];
  const nextDelta = next ? next.minutes - nowMinutes : null;

  const hourMarks = useMemo(() => {
    const marks: { hour: number; pct: number; label: string }[] = [];
    for (let h = HOUR_START; h <= HOUR_END; h += 2) {
      const pct = minutesToPct(h * 60);
      const suffix = h < 12 ? 'AM' : 'PM';
      const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
      marks.push({ hour: h, pct, label: `${hh}${suffix}` });
    }
    return marks;
  }, []);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              boxShadow: tokens.shadows.glow,
            }}
          >
            <IconCalendarEvent size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Today's schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {now.format('dddd, MMM D')} · live radar
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconClock size={14} color={tokens.colors.lightTextSecondary} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Live
            </Typography>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              sx={{
                color: 'text.primary',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontVariantNumeric: 'tabular-nums',
                ml: 0.5,
              }}
            >
              {now.format('HH:mm')}
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Stat label="Today" value={placed.length} color={tokens.colors.pink} />
            <Stat label="Later today" value={upcoming.length} color={tokens.colors.blue} />
            <Stat label="Done" value={past.length} color={tokens.colors.success} />
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadInterviews} sx={{ color: 'text.secondary' }}>
              <IconRefresh size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Next-interview headline */}
      {!loading && next && nextDelta !== null && nextDelta >= 0 && (
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: 2.5,
            bgcolor: alpha(tokens.colors.pink, 0.06),
            border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: tokens.colors.pink,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          >
            NEXT IN{' '}
            {nextDelta < 60
              ? `${nextDelta}m`
              : `${Math.floor(nextDelta / 60)}h ${nextDelta % 60}m`}
          </Box>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: tokens.colors.pinkDark }}
          >
            {next.interview.candidateName || next.interview.consultant || 'Interview'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {next.interview.interviewTime} {next.interview.timeZone || ''}
            {next.interview.clientName && ` · ${next.interview.clientName}`}
          </Typography>
        </Box>
      )}

      {/* Timeline ribbon */}
      {loading ? (
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
      ) : placed.length === 0 ? (
        <EmptyState />
      ) : (
        <Box
          sx={{
            position: 'relative',
            height: 120,
            mt: 1,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.brand, 0.02),
            border: `1px solid ${alpha(tokens.colors.brand, 0.06)}`,
            overflow: 'hidden',
          }}
        >
          {/* hour gridlines + labels */}
          {hourMarks.map((m) => (
            <Box
              key={m.hour}
              sx={{
                position: 'absolute',
                left: `${m.pct}%`,
                top: 0,
                bottom: 0,
                borderLeft: `1px dashed ${alpha(tokens.colors.brand, 0.12)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: 4,
                  fontSize: '0.62rem',
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {m.label}
              </Typography>
            </Box>
          ))}

          {/* center rail */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 2,
              bgcolor: alpha(tokens.colors.brand, 0.08),
              transform: 'translateY(-50%)',
            }}
          />

          {/* NOW indicator */}
          {nowVisible && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${nowPct}%`,
                width: 2,
                bgcolor: tokens.colors.pink,
                boxShadow: `0 0 10px ${tokens.colors.pink}`,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: tokens.colors.pink,
                  boxShadow: `0 0 8px ${tokens.colors.pink}`,
                  animation: 'pulseDot 1.6s ease-in-out infinite',
                  '@keyframes pulseDot': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.4)', opacity: 0.7 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: tokens.colors.pink,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                }}
              >
                NOW
              </Typography>
            </Box>
          )}

          {/* interview dots */}
          {placed.map(({ interview, minutes, lane }, i) => {
            const pct = minutesToPct(minutes);
            const status = interview.interviewStatus as InterviewStatus | undefined;
            const statusColor = status
              ? interviewStatusColors[status] || tokens.colors.lightTextSecondary
              : tokens.colors.lightTextSecondary;
            const isPast = minutes < nowMinutes;
            const name =
              interview.candidateName ||
              interview.consultant ||
              interview.intId ||
              'Interview';
            const person = getPersonColor(name);
            const topPct = lane === 0 ? 30 : 70;

            return (
              <Tooltip
                key={interview._id || i}
                arrow
                placement="top"
                title={
                  <Stack spacing={0.25}>
                    <Typography variant="caption" fontWeight={700}>
                      {name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {interview.interviewTime} {interview.timeZone || ''}
                    </Typography>
                    {interview.clientName && (
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {interview.clientName}
                      </Typography>
                    )}
                    {status && (
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.9, color: statusColor, fontWeight: 600 }}
                      >
                        {status.replace('Interview ', '')}
                      </Typography>
                    )}
                  </Stack>
                }
              >
                <MotionBox
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  onClick={() => onOpenInterview?.(interview)}
                  sx={{
                    position: 'absolute',
                    top: `${topPct}%`,
                    left: `${pct}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 3,
                    '&:hover': { zIndex: 4 },
                  }}
                >
                  {/* Vertical connector from rail to dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: lane === 0 ? '100%' : 'auto',
                      bottom: lane === 0 ? 'auto' : '100%',
                      width: 1.5,
                      height: lane === 0 ? 12 : 12,
                      bgcolor: alpha(statusColor, 0.4),
                      transform: 'translateX(-50%)',
                    }}
                  />
                  {/* Avatar dot */}
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      background: person.gradient,
                      color: '#fff',
                      border: `2px solid ${statusColor}`,
                      boxShadow: `0 3px 8px ${alpha(statusColor, 0.35)}`,
                      opacity: isPast ? 0.55 : 1,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: `0 6px 14px ${alpha(statusColor, 0.5)}`,
                      },
                    }}
                  >
                    {getInitials(name)}
                  </Avatar>
                </MotionBox>
              </Tooltip>
            );
          })}
        </Box>
      )}

      {/* Legend */}
      {!loading && placed.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
          {(
            [
              ['Confirmed', 'Interview Confirm'],
              ['Completed', 'Interview Completed'],
              ['Tentative', 'Interview Tentative'],
              ['Re-Scheduled', 'Interview Re-Scheduled'],
              ['Cancelled', 'Interview Cancelled'],
            ] as const
          ).map(([label, key]) => (
            <Stack key={key} direction="row" alignItems="center" spacing={0.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: interviewStatusColors[key],
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1.5,
        bgcolor: alpha(color, 0.1),
        color,
      }}
    >
      <Typography variant="subtitle2" fontWeight={800} sx={{ color, fontSize: '0.85rem' }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color, fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.03em' }}
      >
        {label.toUpperCase()}
      </Typography>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        mt: 1,
        textAlign: 'center',
        py: 4,
        borderRadius: 2,
        bgcolor: alpha(tokens.colors.brand, 0.02),
        border: `1px dashed ${alpha(tokens.colors.brand, 0.12)}`,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: alpha(tokens.colors.blue, 0.08),
          color: tokens.colors.blue,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        <IconMoonStars size={22} />
      </Box>
      <Typography variant="subtitle2" fontWeight={700}>
        Nothing scheduled today
      </Typography>
      <Typography variant="caption" color="text.secondary">
        A quiet day — time to prep.
      </Typography>
    </Box>
  );
}
