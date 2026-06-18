import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Skeleton,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';
import {
  IconSunrise,
  IconSun,
  IconMoon,
  IconSparkles,
  IconCalendarHeart,
  IconPlaneDeparture,
  IconPlus,
  IconX,
  IconBeach,
  IconClockHour3,
} from '@tabler/icons-react';

import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { tokens } from '../../theme/theme';
import {
  getMyBalances,
  getMyProbationStatus,
  ProbationStatus,
} from '../../services/leaveTypesApi';
import { getLeaves } from '../../services/leavesApi';
import { getHolidays } from '../../services/holidayApi';
import { LeaveBalance, LeaveType as LeaveTypeDef } from '../../Interfaces/salary';
import { iLeave, LeaveStatus } from '../../Interfaces/leaves';
import { Holiday } from '../../Interfaces/holiday';
import ApplyLeave from '../../components/leave/ApplyLeave';
import DownloadBanner from '../../components/desktop/DownloadBanner';

const MotionBox = motion.create(Box);

function partOfDay(hour: number): {
  greeting: string;
  icon: React.ReactNode;
  vibe: string;
} {
  if (hour < 5) return { greeting: 'Working late', icon: <IconMoon size={18} />, vibe: 'Burning the midnight oil — take care of yourself.' };
  if (hour < 12) return { greeting: 'Good morning', icon: <IconSunrise size={18} />, vibe: 'A fresh day to chip away at what matters.' };
  if (hour < 17) return { greeting: 'Good afternoon', icon: <IconSun size={18} />, vibe: 'Steady work makes tomorrow lighter.' };
  if (hour < 21) return { greeting: 'Good evening', icon: <IconSun size={18} />, vibe: 'Wrap up the last bits and unplug.' };
  return { greeting: 'Good night', icon: <IconMoon size={18} />, vibe: 'Rest is productive too.' };
}

function useLiveClock() {
  const [now, setNow] = useState(() => moment());
  useEffect(() => {
    const t = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function UserDashboard() {
  const { iUser } = useAuth();
  const now = useLiveClock();
  const year = now.year();

  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [myLeaves, setMyLeaves] = useState<iLeave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [probation, setProbation] = useState<ProbationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  const loadAll = async () => {
    if (!iUser?._id) return;
    setLoading(true);
    try {
      const [bRes, lRes, hRes, pRes] = await Promise.all([
        getMyBalances(year),
        getLeaves(`userRef=${iUser._id}&limit=10`),
        getHolidays(),
        // Probation status is best-effort — if the endpoint fails
        // (older server), the dashboard still renders without the
        // banner. The balance numbers themselves are authoritative.
        getMyProbationStatus().catch(() => ({ data: { onProbation: false } })),
      ]);
      setBalances(bRes.data || []);
      setMyLeaves(lRes.data.data?.results || []);
      setHolidays(hRes.data.data || []);
      setProbation(pRes.data || { onProbation: false });
    } catch (e) {
      console.error('UserDashboard load error', e);
      setBalances([]);
      setMyLeaves([]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iUser?._id]);

  const mood = partOfDay(now.hour());
  const firstName = iUser?.firstName || 'there';

  const paidBalances = useMemo(
    () =>
      (balances || []).filter((b) => {
        const t = typeof b.leaveType === 'object' ? (b.leaveType as LeaveTypeDef) : null;
        return t && !t.isUnpaidBucket;
      }),
    [balances]
  );

  const unpaidBalance = useMemo(
    () =>
      (balances || []).find((b) => {
        const t = typeof b.leaveType === 'object' ? (b.leaveType as LeaveTypeDef) : null;
        return t && t.isUnpaidBucket;
      }),
    [balances]
  );

  const totalRemaining = useMemo(
    () =>
      paidBalances.reduce(
        (sum, b) => sum + Math.max(0, (b.allocated || 0) - (b.used || 0)),
        0
      ),
    [paidBalances]
  );

  const upcomingLeaves = useMemo(
    () =>
      myLeaves
        .filter(
          (l) =>
            l.status !== LeaveStatus.Rejected &&
            moment(l.endDate).isSameOrAfter(now, 'day')
        )
        .sort((a, b) => moment(a.startDate).diff(moment(b.startDate)))
        .slice(0, 4),
    [myLeaves, now]
  );

  const nextHoliday = useMemo(() => {
    const horizon = now.clone().add(60, 'days');
    return [...holidays]
      .filter((h) => {
        const d = moment(h.fromDate);
        return d.isSameOrAfter(now, 'day') && d.isSameOrBefore(horizon, 'day');
      })
      .sort((a, b) => moment(a.fromDate).diff(moment(b.fromDate)))[0];
  }, [holidays, now]);

  const daysToNextHoliday = nextHoliday
    ? moment(nextHoliday.fromDate).startOf('day').diff(now.clone().startOf('day'), 'days')
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Web-only banner promoting the desktop installer. Self-hides
          in Electron and after dismissal. */}
      <DownloadBanner />
      {/* ── Hero: greeting + live clock + quick status ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          position: 'relative',
          borderRadius: 5,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 3, sm: 4 },
          minHeight: 220,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* Floating orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.35)} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: '30%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.28)} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gradients.pinkBlue,
          }}
        />

        {/* Left: greeting + vibe */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip
              icon={mood.icon as any}
              label={now.format('dddd, MMM D')}
              size="small"
              sx={{
                bgcolor: alpha('#fff', 0.12),
                color: '#fff',
                fontWeight: 700,
                '& .MuiChip-icon': { color: '#fff' },
                backdropFilter: 'blur(8px)',
              }}
            />
          </Stack>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ lineHeight: 1.1, letterSpacing: '-0.02em', mb: 1 }}
          >
            {mood.greeting},{' '}
            <Box
              component="span"
              sx={{
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {firstName}
            </Box>
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.75), fontSize: '0.95rem' }}>
            {mood.vibe}
          </Typography>
        </Box>

        {/* Right: clock + CTA */}
        <Stack
          spacing={1.5}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography
              sx={{
                fontSize: { xs: '2.4rem', sm: '3rem' },
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {now.format('HH:mm')}
            </Typography>
            <Typography
              sx={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: alpha('#fff', 0.55),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              :{now.format('ss')}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<IconPlaneDeparture size={18} />}
            onClick={() => setApplyOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              background: tokens.gradients.pinkBlue,
              boxShadow: tokens.shadows.glow,
              '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' },
            }}
          >
            Apply leave
          </Button>
        </Stack>
      </MotionBox>

      {/* ── Three quick-glance stat strip ── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MiniStat
            icon={<IconCalendarHeart size={22} />}
            label="Leaves remaining"
            value={loading ? '—' : String(totalRemaining)}
            hint={`across ${paidBalances.length} type${paidBalances.length === 1 ? '' : 's'}`}
            accent={tokens.colors.pink}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MiniStat
            icon={<IconPlaneDeparture size={22} />}
            label="Upcoming time off"
            value={loading ? '—' : String(upcomingLeaves.length)}
            hint={
              upcomingLeaves[0]
                ? `next · ${moment(upcomingLeaves[0].startDate).format('MMM D')}`
                : 'nothing scheduled'
            }
            accent={tokens.colors.blue}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MiniStat
            icon={<IconBeach size={22} />}
            label="Next holiday"
            value={
              loading
                ? '—'
                : daysToNextHoliday === null
                  ? '—'
                  : daysToNextHoliday === 0
                    ? 'Today'
                    : `${daysToNextHoliday}d`
            }
            hint={nextHoliday?.name || 'none in next 60 days'}
            accent={tokens.colors.yellowDark}
          />
        </Grid>
      </Grid>

      {/* Probation notice — shown while the user is in_progress.
          Two visual states:
            (a) Inside the 90-day window → "Probation period. Paid
                leaves accrue starting <date>."
            (b) Past the window, awaiting confirmation → "Probation
                window completed. Awaiting HR confirmation."
          Server enforces the same rule on leave submission with a 400. */}
      {probation?.onProbation && (
        <Box
          sx={{
            mb: 3,
            px: 2.25,
            py: 1.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha('#f59e0b', 0.4),
            backgroundColor: alpha('#f59e0b', 0.08),
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400e' }}>
            {probation.awaitingConfirmation
              ? 'Probation review pending'
              : 'Probation period'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#78350f' }}>
            {probation.awaitingConfirmation
              ? 'Your 3-month window has completed. Paid leaves will be credited once HR confirms.'
              : `Paid leaves accrue starting ${
                  probation.probationEnd
                    ? moment(probation.probationEnd).format('DD MMM YYYY')
                    : 'after your probation ends'
                }. Any time off taken before then must be filed as Unpaid Leave.`}
          </Typography>
        </Box>
      )}

      {/* ── Main grid: balance rings + next up ── */}
      <Grid container spacing={3}>
        {/* Leave balance rings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 4,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: tokens.gradients.pinkBlue,
                    color: '#fff',
                    boxShadow: tokens.shadows.glow,
                  }}
                >
                  <IconSparkles size={18} />
                </Box>
                <Box>
                  <Typography fontWeight={800}>My balance</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {year} · allocated vs taken
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {loading ? (
              <Grid container spacing={2}>
                {[0, 1, 2, 3].map((i) => (
                  <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : paidBalances.length === 0 && !unpaidBalance ? (
              <EmptyState
                title="No leave types configured"
                hint="Check back once HR publishes your allocations."
              />
            ) : (
              <Grid container spacing={2}>
                {paidBalances.map((b) => (
                  <Grid key={b._id} size={{ xs: 6, sm: 4, md: 3 }}>
                    <BalanceRing balance={b} />
                  </Grid>
                ))}
                {unpaidBalance && (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <UnpaidCard balance={unpaidBalance} />
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Grid>

        {/* What's next: upcoming leaves + next holiday */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <UpcomingLeavesCard
              leaves={upcomingLeaves}
              loading={loading}
              onApply={() => setApplyOpen(true)}
            />
            <NextHolidayCard holiday={nextHoliday} loading={loading} />
          </Stack>
        </Grid>
      </Grid>

      {/* Apply leave dialog */}
      <Dialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconPlaneDeparture size={18} />
            <Typography fontWeight={800}>Apply for leave</Typography>
          </Stack>
          <IconButton onClick={() => setApplyOpen(false)}>
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ApplyLeave
            onApplied={() => {
              setApplyOpen(false);
              loadAll();
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MiniStat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'box-shadow 0.25s, transform 0.25s',
        '&:hover': {
          boxShadow: `0 12px 30px ${alpha(accent, 0.12)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          bgcolor: accent,
        }}
      />
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(accent, 0.12),
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            letterSpacing: '0.04em',
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: '0.64rem',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.8rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {hint}
        </Typography>
      </Box>
    </Box>
  );
}

// Trim trailing decimal zeros so accrual values like 1.0 render as "1"
// while 1.5 stays "1.5" and 0.83 stays "0.83". Same helper as on the
// salary slip — kept inline here to avoid a cross-file dependency.
const fmtLeaveNum = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, '');
};

function BalanceRing({ balance }: { balance: LeaveBalance }) {
  const type = typeof balance.leaveType === 'object' ? (balance.leaveType as LeaveTypeDef) : null;
  if (!type) return null;
  const allocated = balance.allocated || 0;
  const used = balance.used || 0;
  const accent = type.color || tokens.colors.pink;
  // Server sentinel for "probation in progress — leaves haven't been
  // seeded yet, will be prorated from the admin-set confirmation date".
  // Show a small pill so the 0/0/0 numbers below don't read as "you
  // have no leaves" — they read as "your leaves are pending HR
  // confirmation".
  const isPendingProbation =
    (balance.leaveStartMonth ?? 1) === 13 && !type.isUnpaidBucket;

  // ── Three crisp numbers per user's spec ──
  //   • Total monthly available: cumulative accrual to date this year.
  //     For monthly-capped types: months_elapsed × monthlyQuota, capped
  //     at the yearly `allocated`. For uncapped types (e.g. Medical),
  //     the full annual bucket is available upfront — so the cumulative
  //     equals `allocated`.
  //   • Used: total taken so far this year (server-tracked).
  //   • Monthly balance: available − used, never negative.
  //
  // The leave engine's `monthlyAvailable` field on the API response
  // already encodes the same math after carry-forward. We use it when
  // present and fall back to the client-side derivation otherwise so
  // surfaces that don't populate it still render correctly.
  const monthlyQuota = type.monthlyQuota;
  const monthsElapsed = moment().month() + 1; // 1..12
  const derivedAvailable =
    monthlyQuota != null
      ? Math.min(monthsElapsed * monthlyQuota, allocated)
      : allocated;
  const cumulativeAccrued =
    typeof balance.monthlyAvailable === 'number'
      ? Math.max(balance.monthlyAvailable + used, 0)
      : derivedAvailable;
  const balanceRemaining = Math.max(cumulativeAccrued - used, 0);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(accent, 0.2),
        bgcolor: alpha(accent, 0.03),
        transition: 'border-color 0.25s, transform 0.25s',
        '&:hover': {
          borderColor: alpha(accent, 0.5),
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Type label with a thin colored accent on the left */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 4,
            height: 22,
            bgcolor: accent,
            borderRadius: 1,
          }}
        />
        <Typography
          sx={{
            fontSize: '0.88rem',
            fontWeight: 800,
            color: 'text.primary',
            lineHeight: 1.1,
          }}
          noWrap
        >
          {type.name}
        </Typography>
      </Stack>
      {/* Pending-confirmation pill — explains the 0/0/0 numbers below
          when the employee is still in probation. Without it, a new
          joiner sees three zeros and assumes the system is broken. */}
      {isPendingProbation && (
        <Box
          sx={{
            mb: 1,
            display: 'inline-flex',
            alignItems: 'center',
            px: 1,
            py: 0.4,
            borderRadius: 1.5,
            bgcolor: alpha('#f59e0b', 0.12),
            border: `1px solid ${alpha('#f59e0b', 0.3)}`,
          }}
        >
          <Typography sx={{
            fontSize: 10,
            fontWeight: 700,
            color: '#92400e',
            letterSpacing: 0.3,
          }}>
            Awaiting probation confirmation
          </Typography>
        </Box>
      )}
      <Stack spacing={0.75}>
        <DashboardLeaveRow
          label="Total monthly available"
          value={fmtLeaveNum(cumulativeAccrued)}
        />
        <DashboardLeaveRow
          label="Used"
          value={fmtLeaveNum(used)}
        />
        <DashboardLeaveRow
          label="Monthly balance"
          value={fmtLeaveNum(balanceRemaining)}
          accent={accent}
          bold
        />
      </Stack>
    </Box>
  );
}

// Small helper for the label/value row pair inside BalanceRing. Bold
// + colored variant is used for "Monthly balance" so the most actionable
// number stands out at a glance.
function DashboardLeaveRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: string;
  bold?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.7rem',
          color: 'text.secondary',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: bold ? '1.05rem' : '0.95rem',
          fontWeight: bold ? 800 : 700,
          color: accent || 'text.primary',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function UnpaidCard({ balance }: { balance: LeaveBalance }) {
  const type = typeof balance.leaveType === 'object' ? (balance.leaveType as LeaveTypeDef) : null;
  if (!type) return null;
  const taken = balance.used || 0;
  const accent = type.color || tokens.colors.warning;
  return (
    <Tooltip title={`${type.name} · uncapped · pay deduction per day`}>
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px dashed',
          borderColor: alpha(accent, 0.4),
          bgcolor: taken > 0 ? alpha(accent, 0.06) : 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(accent, 0.15),
            color: accent,
          }}
        >
          <IconClockHour3 size={22} />
        </Box>
        <Typography
          sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: accent }}
        >
          {taken}
        </Typography>
        <Typography fontWeight={800} sx={{ fontSize: '0.82rem', textAlign: 'center' }} noWrap>
          {type.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontSize: '0.66rem', color: 'text.secondary', textAlign: 'center' }}
        >
          {taken === 1 ? 'day taken' : 'days taken'} · uncapped
        </Typography>
      </Box>
    </Tooltip>
  );
}

function UpcomingLeavesCard({
  leaves,
  loading,
  onApply,
}: {
  leaves: iLeave[];
  loading: boolean;
  onApply: () => void;
}) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(tokens.colors.blue, 0.12),
              color: tokens.colors.blueDark,
            }}
          >
            <IconPlaneDeparture size={17} />
          </Box>
          <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>
            Upcoming time off
          </Typography>
        </Stack>
      </Stack>

      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : leaves.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            No upcoming leaves scheduled.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconPlus size={14} />}
            onClick={onApply}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderColor: alpha(tokens.colors.pink, 0.35),
              color: tokens.colors.pinkDark,
              '&:hover': {
                borderColor: tokens.colors.pink,
                bgcolor: alpha(tokens.colors.pink, 0.04),
              },
            }}
          >
            Plan one
          </Button>
        </Box>
      ) : (
        <Stack spacing={1}>
          {leaves.map((l) => {
            const start = moment(l.startDate);
            const end = moment(l.endDate);
            const sameDay = start.isSame(end, 'day');
            const statusColor =
              l.status === LeaveStatus.Approved
                ? tokens.colors.success
                : l.status === LeaveStatus.Pending
                  ? tokens.colors.warning
                  : tokens.colors.error;
            return (
              <Box
                key={l._id}
                sx={{
                  p: 1.25,
                  pl: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: statusColor,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontWeight={700}
                    sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}
                    noWrap
                  >
                    {sameDay
                      ? start.format('ddd, MMM D')
                      : `${start.format('MMM D')} → ${end.format('MMM D')}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                    noWrap
                  >
                    {l.name || 'Leave'}
                    {l.isHalfDay ? ' · half day' : ''}
                  </Typography>
                </Box>
                <Chip
                  label={l.status}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    bgcolor: alpha(statusColor, 0.12),
                    color: statusColor,
                    border: `1px solid ${alpha(statusColor, 0.25)}`,
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function NextHolidayCard({
  holiday,
  loading,
}: {
  holiday: Holiday | undefined;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />;
  }
  if (!holiday) {
    return (
      <Box
        sx={{
          p: 2.5,
          borderRadius: 4,
          border: '1px dashed',
          borderColor: alpha(tokens.colors.yellowDark, 0.3),
          bgcolor: alpha(tokens.colors.yellowDark, 0.04),
          textAlign: 'center',
        }}
      >
        <IconBeach size={28} color={tokens.colors.yellowDark} />
        <Typography fontWeight={700} sx={{ mt: 1 }}>
          No holidays in sight
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Next 60 days are all working days.
        </Typography>
      </Box>
    );
  }
  const d = moment(holiday.fromDate);
  const daysAway = d.startOf('day').diff(moment().startOf('day'), 'days');
  const progress = Math.max(0, Math.min(100, Math.round(((60 - daysAway) / 60) * 100)));

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(tokens.colors.yellowDark, 0.14)} 0%, ${alpha(tokens.colors.pink, 0.1)} 100%)`,
        border: `1px solid ${alpha(tokens.colors.yellowDark, 0.2)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)',
            color: '#7C5800',
          }}
        >
          <IconBeach size={18} />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: tokens.colors.pinkDark,
              fontSize: '0.66rem',
            }}
          >
            Next holiday
          </Typography>
          <Typography fontWeight={800} sx={{ lineHeight: 1.15 }}>
            {holiday.name || 'Holiday'}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 800,
            color: tokens.colors.pinkDark,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {daysAway === 0 ? 'Today' : daysAway}
        </Typography>
        {daysAway !== 0 && (
          <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>
            {daysAway === 1 ? 'day away' : 'days away'}
          </Typography>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {d.format('dddd, MMM D')}
        {holiday.country && holiday.country !== 'ALL' ? ` · ${holiday.country}` : ''}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mt: 1.5,
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(tokens.colors.pink, 0.1),
          '& .MuiLinearProgress-bar': {
            background: tokens.gradients.pinkBlue,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Box
      sx={{
        py: 4,
        textAlign: 'center',
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: alpha(tokens.colors.blue, 0.02),
      }}
    >
      <Typography fontWeight={700}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    </Box>
  );
}
