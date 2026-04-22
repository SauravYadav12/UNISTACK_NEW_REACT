import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  alpha,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconBeach,
  IconStethoscope,
  IconPlaneDeparture,
  IconSparkles,
  IconCalendarStats,
  IconClockHour4,
  IconCircleCheck,
  IconHourglass,
} from '@tabler/icons-react';
import ApplyLeave from '../../components/leave/ApplyLeave';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import RecentLeaveApplicationStatus from '../../components/leave/RecentLeaveApplicationStatus';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../theme/animations';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getLeaves } from '../../services/leavesApi';
import { iLeave, LeaveStatus, LeaveType } from '../../Interfaces/leaves';
import moment from 'moment';

const MotionBox = motion.create(Box);

// Default allocation per leave type — in a real app this would come from HR settings API
const LEAVE_ALLOCATION: Record<LeaveType, number> = {
  [LeaveType.CasualLeave]: 12,
  [LeaveType.SickLeave]: 10,
  [LeaveType.AnnualLeave]: 20,
  [LeaveType.Other]: 5,
};

interface LeaveTypeMeta {
  type: LeaveType;
  color: string;
  icon: React.ReactNode;
  accent: string;
}

const LEAVE_TYPE_META: LeaveTypeMeta[] = [
  {
    type: LeaveType.CasualLeave,
    color: tokens.colors.pink,
    accent: tokens.gradients.pinkBlue,
    icon: <IconBeach size={22} />,
  },
  {
    type: LeaveType.SickLeave,
    color: tokens.colors.error,
    accent: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
    icon: <IconStethoscope size={22} />,
  },
  {
    type: LeaveType.AnnualLeave,
    color: tokens.colors.blue,
    accent: 'linear-gradient(135deg, #37B7EA 0%, #1A9FD4 100%)',
    icon: <IconPlaneDeparture size={22} />,
  },
  {
    type: LeaveType.Other,
    color: tokens.colors.warning,
    accent: 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)',
    icon: <IconSparkles size={22} />,
  },
];

/**
 * RingProgress — SVG circular progress ring
 */
function RingProgress({
  size = 82,
  stroke = 7,
  value,
  max,
  color,
  trackColor,
}: {
  size?: number;
  stroke?: number;
  value: number;
  max: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, max === 0 ? 0 : value / max));
  const offset = circumference * (1 - pct);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={800} lineHeight={1} color="text.primary">
          {max - value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          left
        </Typography>
      </Box>
    </Box>
  );
}

const Leaves = () => {
  const { iUser } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Fetch current-year leaves for usage rings
  const { data: yearLeaves } = useFetchData<iLeave[]>(async () => {
    if (!iUser) return [];
    const year = moment().year();
    const startOfYear = moment(`${year}-01-01`).format('YYYY-MM-DD');
    const endOfYear = moment(`${year}-12-31`).format('YYYY-MM-DD');
    const { data } = await getLeaves(
      `userRef=${iUser._id}&startDate[gte]=${startOfYear}&endDate[lte]=${endOfYear}&limit=500`
    );
    return data.data?.results || [];
  }, [iUser, refreshTrigger]);

  const firstName = iUser?.firstName || 'there';

  // Compute usage per leave type
  const usageByType = useMemo(() => {
    const acc: Record<LeaveType, number> = {
      [LeaveType.CasualLeave]: 0,
      [LeaveType.SickLeave]: 0,
      [LeaveType.AnnualLeave]: 0,
      [LeaveType.Other]: 0,
    };
    (yearLeaves || []).forEach((l) => {
      if (l.status === LeaveStatus.Rejected) return;
      const days =
        moment(l.endDate).diff(moment(l.startDate), 'days') +
        1 -
        (l.isHalfDay ? 0.5 : 0);
      if (l.type && l.type in acc) {
        const k = l.type as LeaveType;
        acc[k] = (acc[k] || 0) + Math.max(0, days);
      }
    });
    return acc;
  }, [yearLeaves]);

  const totals = useMemo(() => {
    const allocation = Object.values(LEAVE_ALLOCATION).reduce((a, b) => a + b, 0);
    const usedVal = Object.values(usageByType).reduce((a, b) => a + b, 0);
    const pending = (yearLeaves || []).filter((l) => l.status === LeaveStatus.Pending).length;
    const approved = (yearLeaves || []).filter((l) => l.status === LeaveStatus.Approved).length;
    return {
      allocation,
      used: usedVal,
      remaining: Math.max(0, allocation - usedVal),
      pending,
      approved,
    };
  }, [usageByType, yearLeaves]);

  return (
    <Box>
      {/* ── Hero banner ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
        }}
      >
        {/* decorative orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: '20%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
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
            background: tokens.gradients.brand,
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={3}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          {/* Left: greeting */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconPlaneDeparture size={26} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.05em' }}>
                LEAVE HUB · {moment().format('YYYY')}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Hello {firstName},{' '}
                <Box
                  component="span"
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  plan your time off
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65), mt: 0.5 }}>
                Balance at a glance, smart apply, and a timeline of your recent requests.
              </Typography>
            </Box>
          </Box>

          {/* Right: quick stats */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {[
              {
                label: 'Days left',
                value: totals.remaining,
                icon: <IconCalendarStats size={16} />,
                color: tokens.colors.pink,
              },
              {
                label: 'Used',
                value: totals.used,
                icon: <IconCircleCheck size={16} />,
                color: tokens.colors.blue,
              },
              {
                label: 'Pending',
                value: totals.pending,
                icon: <IconHourglass size={16} />,
                color: tokens.colors.yellow,
              },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{
                  bgcolor: alpha('#fff', 0.08),
                  border: `1px solid ${alpha('#fff', 0.12)}`,
                  borderRadius: 2.5,
                  px: 1.75,
                  py: 1.25,
                  minWidth: 92,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.05em' }}>
                    {s.label.toUpperCase()}
                  </Typography>
                </Stack>
                <AnimatedCounter
                  value={s.value}
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: '#fff', lineHeight: 1.2, mt: 0.25 }}
                />
              </Box>
            ))}
          </Stack>
        </Stack>
      </MotionBox>

      {/* ── Leave balance ring cards ── */}
      <MotionBox
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{ mb: 3 }}
      >
        <Grid container spacing={2}>
          {LEAVE_TYPE_META.map((meta) => {
            const total = LEAVE_ALLOCATION[meta.type];
            const used = usageByType[meta.type] || 0;
            const pct = total === 0 ? 0 : (used / total) * 100;
            return (
              <Grid key={meta.type} size={{ xs: 12, sm: 6, md: 3 }}>
                <MotionBox
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      boxShadow: `0 8px 24px ${alpha(meta.color, 0.15)}`,
                      borderColor: alpha(meta.color, 0.3),
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: meta.accent,
                      opacity: 0.9,
                    }}
                  />
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <RingProgress
                      value={used}
                      max={total}
                      color={meta.color}
                      trackColor={alpha(meta.color, 0.12)}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(meta.color, 0.12),
                            color: meta.color,
                          }}
                        >
                          {meta.icon}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.03em' }}>
                          {pct.toFixed(0)}% used
                        </Typography>
                      </Stack>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                        {meta.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {used} / {total} days
                      </Typography>
                    </Box>
                  </Stack>
                </MotionBox>
              </Grid>
            );
          })}
        </Grid>
      </MotionBox>

      {/* ── Main split: Apply + Timeline ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ApplyLeave onApplied={() => setRefreshTrigger(refreshTrigger + 1)} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <RecentLeaveApplicationStatus refreshTrigger={refreshTrigger} />
        </Grid>
      </Grid>

      {/* ── Leave history ── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(tokens.colors.brand, 0.08),
                color: tokens.colors.brand,
              }}
            >
              <IconClockHour4 size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Leave History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Every request you've submitted, newest first
              </Typography>
            </Box>
          </Stack>
          <Tooltip title={`Total allocation for ${moment().year()}: ${totals.allocation} days`}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                bgcolor: alpha(tokens.colors.pink, 0.08),
                color: tokens.colors.pinkDark,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: `1px solid ${alpha(tokens.colors.pink, 0.18)}`,
              }}
            >
              {totals.approved} approved · {totals.pending} pending
            </Box>
          </Tooltip>
        </Box>
        <LeaveHistoryTable key={refreshTrigger} />
      </Box>
    </Box>
  );
};

export default Leaves;
