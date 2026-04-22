import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  Grid,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material';
import DailyAttendanceTable from '../../components/attendance/DailyAttendanceTable';
import CheckInCheckOut from '../../components/attendance/CheckInCheckOut';
import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';

import SyncIcon from '@mui/icons-material/Sync';
import { useEffect, useMemo, useState } from 'react';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Moment, unitOfTime } from 'moment';
import MonthlyAttendanceTable from '../../components/attendance/MonthlyAttendanceTable';
import WeeklyAttendanceTable from '../../components/attendance/WeeklyAttendence';
import { useAttendance } from '../../hooks/attendanceHook';
import moment from 'moment';
import { dateFormate, timeFormate } from '../../components/constants';
import UpcomingHolidays from '../../components/holiday/UpcomingHolidays';
import StatusLegend from '../../components/attendance/StatusLegend';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import { motion } from 'framer-motion';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../theme/animations';
import { tokens } from '../../theme/theme';
import {
  IconClockHour3,
  IconCalendarCheck,
  IconTrendingUp,
  IconFlame,
  IconPointFilled,
} from '@tabler/icons-react';

const MotionBox = motion.create(Box);

const MyAttendance = () => {
  const { myAttendanceState, iUser } = useAuth();
  const me = iUser!;
  const dateState = useState(dateByUserShift(me.shift));

  if (!myAttendanceState || myAttendanceState?.loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );

  const { error, attendance, setResults, loadData } = myAttendanceState;

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  function handleAttendanceDeleted(attendanceId: string) {
    setResults((pre) => pre.filter((i) => i._id !== attendanceId));
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
        <Typography color="error" mb={1}>{error}</Typography>
        <IconButton onClick={loadData}>
          <SyncIcon color="primary" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Hero status card ── */}
      <HeroStatusCard
        me={me}
        todayAttendance={attendance[0]}
        onChange={handleChange}
        date={dateState[0]}
      />

      {/* ── Quick stats ── */}
      <QuickStats me={me} />

      {/* ── 7-day streak ── */}
      <WeeklyStreak me={me} />

      {/* ── Main grid: Attendance + Holidays ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCardWrapper
            title="Daily Attendance"
            action={
              <Tooltip title="Refresh">
                <IconButton
                  onClick={loadData}
                  sx={{
                    bgcolor: '#ECF2FF',
                    borderRadius: '10px',
                    width: 36,
                    height: 36,
                    mt: 1.5,
                    '&:hover': { bgcolor: '#D6E4FF' },
                  }}
                >
                  <SyncIcon sx={{ color: '#5D87FF', fontSize: '18px' }} />
                </IconButton>
              </Tooltip>
            }
          >
            <DailyAttendanceTable
              tableContainerHeight={200}
              dateState={dateState}
              onChange={handleChange}
              onAttendanceDeleted={handleAttendanceDeleted}
              users={[me]}
              attendanceState={myAttendanceState}
              forEmployee
            />
          </ChartCardWrapper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StatusLegend />
            <UpcomingHolidays />
          </Box>
        </Grid>
      </Grid>

      {/* ── History ── */}
      <MyAttendanceHistory users={[me]} />
    </Box>
  );
};

export default MyAttendance;

// ─────────────────────────────────────────────────────────────────────
// Hero card — live clock, status, action button
// ─────────────────────────────────────────────────────────────────────
function HeroStatusCard({
  me,
  todayAttendance,
  onChange,
  date,
}: {
  me: iUser;
  todayAttendance?: iAttendance;
  onChange: (a: iAttendance) => void;
  date: Moment;
}) {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const t = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkedIn = !!todayAttendance?.checkIn && todayAttendance?.status !== AttendanceStatus.Absent;
  const checkedOut = !!todayAttendance?.checkOut;

  const elapsed = useMemo(() => {
    if (!todayAttendance?.checkIn) return null;
    const ci = moment(todayAttendance.checkIn, timeFormate);
    const end = checkedOut && todayAttendance.checkOut ? moment(todayAttendance.checkOut, timeFormate) : now;
    const mins = end.diff(ci, 'minutes');
    if (mins < 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { h, m };
  }, [todayAttendance, now, checkedOut]);

  const greeting = (() => {
    const h = now.hour();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const statusText = checkedOut ? 'Checked Out' : checkedIn ? 'Working' : 'Not Started';
  const statusColor = checkedOut ? tokens.colors.blue : checkedIn ? tokens.colors.success : '#94A3B8';

  return (
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
      {/* Decorative gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.25)} 0%, transparent 70%)`,
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: '20%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
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

      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Left: Greeting + live clock + status */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), mb: 0.5 }}>
            {greeting}, {me.firstName}
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ color: alpha('#fff', 0.85), mb: 2 }}>
            {now.format('dddd, MMMM D, YYYY')}
          </Typography>

          {/* Live digital clock */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
            <Typography
              sx={{
                fontSize: { xs: '2.75rem', sm: '3.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {now.format('hh:mm')}
            </Typography>
            <Typography sx={{ color: alpha('#fff', 0.8), fontSize: '1rem', fontWeight: 600 }}>
              :{now.format('ss')} {now.format('A')}
            </Typography>
          </Box>

          {/* Status pill */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: 5,
              bgcolor: alpha(statusColor, 0.2),
              border: `1px solid ${alpha(statusColor, 0.4)}`,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                animation: checkedIn && !checkedOut ? 'pulse 1.5s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#fff' }}>
              {statusText}
            </Typography>
          </Box>
        </Grid>

        {/* Right: Elapsed time + action button */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Elapsed */}
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.55), textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {checkedOut ? 'Today\'s hours' : 'Elapsed time'}
              </Typography>
              {elapsed ? (
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                  {elapsed.h}h {String(elapsed.m).padStart(2, '0')}m
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: alpha('#fff', 0.6), mt: 0.5 }}>
                  Not started yet
                </Typography>
              )}
              {todayAttendance?.checkIn && (
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                  Check-in: {todayAttendance.checkIn}
                  {todayAttendance.checkOut && ` · Out: ${todayAttendance.checkOut}`}
                </Typography>
              )}
            </Box>

            {/* Action button */}
            <CheckInCheckOut
              user={me}
              date={date}
              onChange={onChange}
              attendance={todayAttendance as iAttendance}
            />
          </Box>
        </Grid>
      </Grid>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Quick stats row
// ─────────────────────────────────────────────────────────────────────
function QuickStats({ me }: { me: iUser }) {
  const today = dateByUserShift(me.shift);
  const monthStart = moment(today).startOf('month').format(dateFormate);
  const monthEnd = moment(today).endOf('month').format(dateFormate);

  const monthState = useAttendance(
    { fromDate: monthStart, toDate: monthEnd, users: [me] },
    [me._id]
  );

  const stats = useMemo(() => {
    const data = monthState.attendance || [];
    const present = data.filter((a) => a.status !== AttendanceStatus.Absent);
    const thisWeekStart = moment(today).startOf('week');
    const thisWeekEnd = moment(today).endOf('week');
    const thisWeekPresent = present.filter((a) => {
      const d = moment(a.date);
      return d.isBetween(thisWeekStart, thisWeekEnd, 'day', '[]');
    }).length;

    const totalHours = present.reduce((acc, a) => {
      if (!a.checkIn || !a.checkOut) return acc;
      const ci = moment(a.checkIn, timeFormate);
      const co = moment(a.checkOut, timeFormate);
      const mins = co.diff(ci, 'minutes');
      return acc + (mins > 0 ? mins / 60 : 0);
    }, 0);

    const avgHours = present.length ? totalHours / present.length : 0;

    const daysPassed = moment(today).date();
    const attendancePct = daysPassed ? Math.round((present.length / daysPassed) * 100) : 0;

    // Compute streak (consecutive present days ending today)
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = moment(today).subtract(i, 'day').format(dateFormate);
      const hit = data.find((a) => moment(a.date).format(dateFormate) === d);
      if (hit && hit.status !== AttendanceStatus.Absent) streak++;
      else if (moment(today).subtract(i, 'day').isoWeekday() > 5) continue; // skip weekends
      else break;
    }

    return { thisWeekPresent, avgHours, attendancePct, streak };
  }, [monthState.attendance]);

  const cards = [
    {
      title: 'This Week',
      value: stats.thisWeekPresent,
      suffix: ' / 5',
      icon: <IconCalendarCheck size={22} stroke={2} />,
      color: tokens.colors.success,
    },
    {
      title: 'Attendance',
      value: stats.attendancePct,
      suffix: '%',
      icon: <IconTrendingUp size={22} stroke={2} />,
      color: tokens.colors.blue,
    },
    {
      title: 'Avg Hours/Day',
      value: Number(stats.avgHours.toFixed(1)),
      decimals: 1,
      suffix: 'h',
      icon: <IconClockHour3 size={22} stroke={2} />,
      color: tokens.colors.pink,
    },
    {
      title: 'Current Streak',
      value: stats.streak,
      suffix: ' days',
      icon: <IconFlame size={22} stroke={2} />,
      color: tokens.colors.yellowDark,
    },
  ];

  return (
    <MotionBox
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      sx={{ mb: 3 }}
    >
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 6, sm: 6, md: 3 }}>
            <MotionBox
              variants={staggerItem}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'default',
                transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                '&:hover': {
                  boxShadow: `0 8px 24px ${alpha(card.color, 0.15)}`,
                  borderColor: alpha(card.color, 0.3),
                },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: card.color,
                  opacity: 0.7,
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(card.color, 0.1),
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <AnimatedCounter
                  value={card.value}
                  decimals={card.decimals || 0}
                  variant="h2"
                  fontWeight={700}
                  color="text.primary"
                  sx={{ lineHeight: 1 }}
                />
                <Typography variant="h6" color="text.secondary" sx={{ ml: 0.5, fontWeight: 500 }}>
                  {card.suffix}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                {card.title}
              </Typography>
            </MotionBox>
          </Grid>
        ))}
      </Grid>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 7-day streak visualization (pill timeline)
// ─────────────────────────────────────────────────────────────────────
function WeeklyStreak({ me }: { me: iUser }) {
  const today = dateByUserShift(me.shift);
  const fromDate = moment(today).subtract(6, 'day').format(dateFormate);
  const toDate = moment(today).format(dateFormate);

  const state = useAttendance(
    { fromDate, toDate, users: [me] },
    [me._id, fromDate, toDate]
  );

  const days = useMemo(() => {
    const out: Array<{ date: Moment; status: AttendanceStatus | 'future' | 'empty' }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = moment(today).subtract(i, 'day');
      const hit = state.attendance?.find((a) => moment(a.date).format(dateFormate) === d.format(dateFormate));
      let status: AttendanceStatus | 'future' | 'empty' = 'empty';
      if (hit) status = hit.status || AttendanceStatus.Absent;
      else if (d.isAfter(today, 'day')) status = 'future';
      out.push({ date: d, status });
    }
    return out;
  }, [state.attendance, me.shift]);

  const statusColor = (s: string) => {
    switch (s) {
      case AttendanceStatus.Present: return tokens.colors.success;
      case AttendanceStatus['Half-Day']: return tokens.colors.warning;
      case AttendanceStatus.Late: return tokens.colors.blue;
      case AttendanceStatus.Absent: return tokens.colors.error;
      default: return '#D1D5DB';
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconPointFilled size={18} color={tokens.colors.pink} />
          <Typography variant="body1" fontWeight={600} color="text.primary">
            Last 7 Days
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {moment(today).subtract(6, 'day').format('MMM D')} – {moment(today).format('MMM D')}
        </Typography>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {days.map((d, i) => {
          const isToday = d.date.isSame(today, 'day');
          const color = statusColor(d.status);
          return (
            <Tooltip key={i} title={`${d.date.format('ddd, MMM D')} — ${d.status === 'empty' ? 'No record' : d.status === 'future' ? 'Upcoming' : d.status}`}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: isToday ? 700 : 400, display: 'block', mb: 0.5 }}>
                  {d.date.format('ddd')}
                </Typography>
                <Box
                  sx={{
                    height: 36,
                    borderRadius: 2,
                    bgcolor: alpha(color, d.status === 'future' ? 0.08 : 0.15),
                    border: '2px solid',
                    borderColor: isToday ? tokens.colors.pink : alpha(color, 0.25),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: color },
                  }}
                >
                  <Typography variant="caption" fontWeight={700} sx={{ color }}>
                    {d.date.format('D')}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────
// History section (unchanged but wrapped cleanly)
// ─────────────────────────────────────────────────────────────────────
enum AttendanceOption {
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

interface MyAttendanceHistoryProps {
  users: iUser[];
}

function MyAttendanceHistory({ users }: MyAttendanceHistoryProps) {
  const { iUser } = useAuth();
  const options = Object.values(AttendanceOption);
  const [option, setOption] = useState(options[0]);

  const dateState = useState(dateByUserShift(iUser!.shift));

  const { fromDate, toDate } = iDates(dateState[0]);

  const attendanceState = useAttendance(
    {
      fromDate: fromDate.format(dateFormate),
      toDate: toDate.format(dateFormate),
      users,
    },
    [users, dateState[0]]
  );

  function iDates(date: Moment) {
    let unit: unitOfTime.Base = 'week';
    if (option === AttendanceOption.Monthly) unit = 'month';
    const fromDate = moment(date).startOf(unit);
    const toDate = moment(date).endOf(unit);
    return { fromDate, toDate };
  }

  useEffect(() => {
    dateState[1](iDates(dateByUserShift(iUser!.shift)).fromDate);
  }, [option]);

  return (
    <ChartCardWrapper
      title={`${option} Attendance`}
      action={
        <Select
          value={option}
          size="small"
          onChange={(e) => setOption(e.target.value as AttendanceOption)}
          sx={{ mt: 1.5, borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
        >
          {options.map((o, i) => (
            <MenuItem key={i} value={o}>{o}</MenuItem>
          ))}
        </Select>
      }
    >
      <>
        {option === AttendanceOption.Weekly && (
          <WeeklyAttendanceTable
            tableContainerHeight={200}
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee
          />
        )}
        {option === AttendanceOption.Monthly && (
          <MonthlyAttendanceTable
            tableContainerHeight={220}
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee
          />
        )}
      </>
    </ChartCardWrapper>
  );
}
