import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Typography,
  Avatar,
  Stack,
  Tooltip,
  alpha,
  InputBase,
  Chip,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import AttendanceGridMonthly from '../../components/attendance/AttendanceGridMonthly';
import { AttendanceStatus, iAttendance, iUser, UserRole } from '../../Interfaces/iUser';
import { usersList } from '../../services/authApi';
import WeeklyAttendanceTable from '../../components/attendance/WeeklyAttendence';
import MonthlyAttendanceTable from '../../components/attendance/MonthlyAttendanceTable';
import DailyAttendanceTable from '../../components/attendance/DailyAttendanceTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import CheckInCheckOut from '../../components/attendance/CheckInCheckOut';
import { iUseAttendance, useAttendance } from '../../hooks/attendanceHook';
import { dateFormate, timeFormate } from '../../components/constants';
import { useFetchData } from '../../hooks/fetchDataHook';
import { Sync } from '@mui/icons-material';
import { dateByUserShift } from '../../utils/dateUtil';
import moment, { Moment, unitOfTime } from 'moment';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import UpcomingHolidays from '../../components/holiday/UpcomingHolidays';
import StatusLegend from '../../components/attendance/StatusLegend';
import MarkMolidayModal from '../../components/holiday/MarkMolidayModal';
import AttendanceExportModal from '../../components/attendance/AttendanceExportModal';
import { motion } from 'framer-motion';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../theme/animations';
import { tokens } from '../../theme/theme';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconClockHour4,
  IconShieldCheck,
  IconSearch,
  IconX,
} from '@tabler/icons-react';

const MotionBox = motion.create(Box);

const AttendanceDashboard = () => {
  const usersListState = useFetchData<iUser[]>(fetchUsers, []);
  const { data: users, loading, error, loadData } = usersListState;

  async function fetchUsers() {
    const { data } = await usersList('active=true');
    const { users } = data;
    return (users as iUser[])?.filter(
      (u) => !u.role.includes(UserRole['super-admin'])
    );
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Typography color="error" mb={1}>{error}</Typography>
        <IconButton onClick={loadData}><Sync color="primary" /></IconButton>
      </Box>
    );
  }

  if (!users?.length) {
    return (
      <Box textAlign="center" py={10}>
        <Typography color="text.secondary">No employees found</Typography>
        <IconButton onClick={loadData}><Sync color="primary" /></IconButton>
      </Box>
    );
  }

  return <AdminDashboardContent users={users} onReload={() => usersListState.loadData()} />;
};

export default AttendanceDashboard;

// ─────────────────────────────────────────────────────────────────────
interface AdminDashboardContentProps {
  users: iUser[];
  onReload: () => void;
}

function AdminDashboardContent({ users, onReload }: AdminDashboardContentProps) {
  const { myAttendanceState, iUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<iUser>(users[0]);
  const [exportModal, setExportModal] = useState(false);

  const currentUserTodaysAttendance = useAttendance(
    { users: [currentUser] },
    [currentUser]
  );

  const attendanceGridMonthlyDateState = useState(dateByUserShift(iUser!.shift));
  const currentUserMonthlyAttendance = useAttendance(
    {
      users: [currentUser],
      fromDate: moment(attendanceGridMonthlyDateState[0]).startOf('month').format(dateFormate),
      toDate: moment(attendanceGridMonthlyDateState[0]).endOf('month').format(dateFormate),
    },
    [currentUser, attendanceGridMonthlyDateState[0]]
  );

  // For team-wide today stats
  const today = dateByUserShift(iUser!.shift);
  const teamTodayAttendance = useAttendance(
    {
      users,
      fromDate: today.format(dateFormate),
      toDate: today.format(dateFormate),
    },
    [users.length, today.format(dateFormate)]
  );

  const userWiseAttendanceOptions = Object.values(AttendanceTableType);
  const [userWiseAttendanceOption, setUserWiseAttendanceOption] = useState(userWiseAttendanceOptions[0]);
  const optionBasedAttendanceDateState = useState(dateByUserShift(iUser!.shift));
  const { fromDate, toDate } = iDates(optionBasedAttendanceDateState[0]);
  const usersWiseOptionBasedAttendance = useAttendance(
    {
      fromDate: fromDate.format(dateFormate),
      toDate: toDate.format(dateFormate),
    },
    [users, optionBasedAttendanceDateState[0]]
  );

  function iDates(date: Moment) {
    if (userWiseAttendanceOption === AttendanceTableType.Daily) {
      const d = moment(date);
      return { fromDate: d, toDate: d };
    }
    let unit: unitOfTime.Base = 'week';
    if (userWiseAttendanceOption === AttendanceTableType.Monthly) unit = 'month';
    return { fromDate: moment(date).startOf(unit), toDate: moment(date).endOf(unit) };
  }

  function handleChangeAttendance(att: iAttendance) {
    const updateState = (hook: iUseAttendance) => {
      hook.setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
    };
    const states = [
      currentUserMonthlyAttendance,
      currentUserTodaysAttendance,
      usersWiseOptionBasedAttendance,
      teamTodayAttendance,
    ];
    if (myAttendanceState && att.userRef === iUser?._id) states.push(myAttendanceState);
    for (const hook of states) updateState(hook);
  }

  function handleDeleteAttendance(attendanceId: string) {
    const remove = (hook: iUseAttendance) => {
      hook.setResults((pre) => pre.filter((i) => i._id !== attendanceId));
    };
    const states = [
      currentUserMonthlyAttendance,
      currentUserTodaysAttendance,
      usersWiseOptionBasedAttendance,
      teamTodayAttendance,
    ];
    if (myAttendanceState) states.push(myAttendanceState);
    for (const hook of states) remove(hook);
  }

  function reload() {
    onReload();
    currentUserTodaysAttendance.loadData();
    currentUserMonthlyAttendance.loadData();
    usersWiseOptionBasedAttendance.loadData();
    teamTodayAttendance.loadData();
    myAttendanceState?.loadData();
  }

  useEffect(() => {
    optionBasedAttendanceDateState[1](iDates(dateByUserShift(iUser!.shift)).fromDate);
  }, [userWiseAttendanceOption]);

  useEffect(() => {
    setCurrentUser(users[0]);
  }, [users]);

  // Team stats
  const teamStats = useMemo(() => {
    const total = users.length;
    const todayRecords = teamTodayAttendance.attendance || [];
    const presentUserIds = new Set(
      todayRecords.filter((a) => a.status !== AttendanceStatus.Absent).map((a) => a.userRef)
    );
    const present = presentUserIds.size;
    const absent = total - present;
    const late = todayRecords.filter((a) => a.status === AttendanceStatus.Late).length;
    return { total, present, absent, late };
  }, [users, teamTodayAttendance.attendance]);

  const statCards = [
    { title: 'Total Users', value: teamStats.total, icon: <IconUsers size={22} stroke={2} />, color: tokens.colors.blue },
    { title: 'Present Today', value: teamStats.present, icon: <IconUserCheck size={22} stroke={2} />, color: tokens.colors.success },
    { title: 'Absent Today', value: teamStats.absent, icon: <IconUserX size={22} stroke={2} />, color: tokens.colors.error },
    { title: 'Late Arrivals', value: teamStats.late, icon: <IconClockHour4 size={22} stroke={2} />, color: tokens.colors.yellowDark },
  ];

  // Get attendance status for a user today (for user chip status dot)
  const userTodayStatus = (userId: string) => {
    const rec = teamTodayAttendance.attendance?.find((a) => a.userRef === userId);
    if (!rec) return 'absent';
    if (rec.status === AttendanceStatus.Present) return 'present';
    if (rec.status === AttendanceStatus.Late) return 'late';
    if (rec.status === AttendanceStatus['Half-Day']) return 'half';
    return 'absent';
  };

  const statusDotColor = (s: string) => {
    switch (s) {
      case 'present': return tokens.colors.success;
      case 'late': return tokens.colors.blue;
      case 'half': return tokens.colors.warning;
      default: return '#D1D5DB';
    }
  };

  return (
    <Box>
      {/* ── Hero header ── */}
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
          p: { xs: 2.5, sm: 3 },
          mb: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: -50, right: -30, width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.25)} 0%, transparent 70%)`,
            filter: 'blur(50px)', pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: -50, left: '30%', width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.18)} 0%, transparent 70%)`,
            filter: 'blur(40px)', pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tokens.gradients.brand }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: tokens.gradients.pinkBlue, color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconShieldCheck size={22} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>
                Attendance{' '}
                <Box component="span" sx={{ background: tokens.gradients.pinkBlue, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Dashboard
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.65) }}>
                {today.format('dddd, MMMM D, YYYY')} · Team overview
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <MarkMolidayModal />
            <AttendanceExportModal
              open={exportModal}
              onOpen={() => setExportModal(true)}
              onClose={() => setExportModal(false)}
              users={users || []}
            />
            <Tooltip title="Refresh">
              <IconButton
                onClick={reload}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: '10px',
                  width: 38, height: 38,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <Sync sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>

      {/* ── Team stats cards ── */}
      <MotionBox variants={staggerContainer} initial="initial" animate="animate" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {statCards.map((card) => (
            <Grid key={card.title} size={{ xs: 6, sm: 6, md: 3 }}>
              <MotionBox
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                sx={{
                  p: 2.5, borderRadius: 4,
                  bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                  transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                  '&:hover': { boxShadow: `0 8px 24px ${alpha(card.color, 0.15)}`, borderColor: alpha(card.color, 0.3) },
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: card.color, opacity: 0.7 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 42, height: 42, borderRadius: 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: alpha(card.color, 0.1), color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <AnimatedCounter
                  value={card.value}
                  variant="h2"
                  fontWeight={700}
                  color="text.primary"
                  sx={{ lineHeight: 1 }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                  {card.title}
                </Typography>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>

      {/* ── Team Members Directory ── */}
      <TeamMembersDirectory
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        userTodayStatus={userTodayStatus}
        statusDotColor={statusDotColor}
        checkInCheckOutNode={
          !currentUserTodaysAttendance.loading ? (
            <CheckInCheckOut
              forAdmin
              user={currentUser}
              date={today}
              attendance={currentUserTodaysAttendance.attendance[0]}
              onChange={handleChangeAttendance}
            />
          ) : null
        }
      />

      {/* ── Main grid: monthly grid + summary ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <AttendanceGridMonthly
            user={currentUser}
            attendanceState={currentUserMonthlyAttendance}
            dateState={attendanceGridMonthlyDateState}
            onAttendanceChange={handleChangeAttendance}
            onAttendanceDeleted={handleDeleteAttendance}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <StatusLegend />
            <UpcomingHolidays forAdmin />
          </Stack>
        </Grid>
      </Grid>

      {/* ── User-wise attendance list ── */}
      <UserWiseAttendanceList
        dateState={optionBasedAttendanceDateState}
        users={users}
        attendanceState={usersWiseOptionBasedAttendance}
        onChangeAttendance={handleChangeAttendance}
        onAttendanceDeleted={handleDeleteAttendance}
        onChangeOption={setUserWiseAttendanceOption}
        options={userWiseAttendanceOptions}
        selectedOption={userWiseAttendanceOption}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────
interface UserWiseAttendanceListProps {
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  options: AttendanceTableType[];
  selectedOption: AttendanceTableType;
  onChangeOption: (option: AttendanceTableType) => void;
  users: iUser[];
  attendanceState: iUseAttendance;
  onChangeAttendance?: (a: iAttendance) => void;
  onAttendanceDeleted?: (attendanceId: string) => void;
}

function UserWiseAttendanceList({
  dateState, users, attendanceState, selectedOption, options,
  onChangeAttendance, onAttendanceDeleted, onChangeOption,
}: UserWiseAttendanceListProps) {
  return (
    <ChartCardWrapper
      title={`${selectedOption} Attendance`}
      action={
        <Select
          value={selectedOption}
          size="small"
          onChange={(e) => onChangeOption(e.target.value as AttendanceTableType)}
          sx={{ mt: 1.5, mr: 4, borderRadius: '10px' }}
        >
          {options.map((o, i) => (
            <MenuItem key={i} value={o}>{o}</MenuItem>
          ))}
        </Select>
      }
    >
      <>
        {selectedOption === AttendanceTableType.Daily && (
          <DailyAttendanceTable
            dateState={dateState}
            users={users || []}
            attendanceState={attendanceState}
            onChange={onChangeAttendance}
            onAttendanceDeleted={onAttendanceDeleted}
            forEmployee={false}
          />
        )}
        {selectedOption === AttendanceTableType.Weekly && (
          <WeeklyAttendanceTable
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee={false}
            onAttendanceDeleted={onAttendanceDeleted}
          />
        )}
        {selectedOption === AttendanceTableType.Monthly && (
          <MonthlyAttendanceTable
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee={false}
            onAttendanceDeleted={onAttendanceDeleted}
          />
        )}
      </>
    </ChartCardWrapper>
  );
}

export enum AttendanceTableType {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

// ─────────────────────────────────────────────────────────────────────
// Team Members Directory — search + alphabet + status filter
// ─────────────────────────────────────────────────────────────────────

type StatusKey = 'all' | 'present' | 'late' | 'half' | 'absent';

interface TeamMembersDirectoryProps {
  users: iUser[];
  currentUser: iUser;
  setCurrentUser: (u: iUser) => void;
  userTodayStatus: (id: string) => string;
  statusDotColor: (s: string) => string;
  checkInCheckOutNode: React.ReactNode;
}

function TeamMembersDirectory({
  users,
  currentUser,
  setCurrentUser,
  userTodayStatus,
  statusDotColor,
  checkInCheckOutNode,
}: TeamMembersDirectoryProps) {
  const [search, setSearch] = useState('');
  const [letter, setLetter] = useState<string>(''); // '' = All
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');

  // Compute which letters have at least one user
  const activeLetters = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      const ch = (u.firstName?.[0] || '').toUpperCase();
      if (/[A-Z]/.test(ch)) set.add(ch);
    });
    return set;
  }, [users]);

  const letters = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

  // Filter users by search + letter + status
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
      if (q && !fullName.includes(q)) return false;
      if (letter && !(u.firstName || '').toUpperCase().startsWith(letter)) return false;
      if (statusFilter !== 'all') {
        const s = userTodayStatus(u._id);
        if (s !== statusFilter) return false;
      }
      return true;
    });
  }, [users, search, letter, statusFilter, userTodayStatus]);

  const statusPills: { key: StatusKey; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: tokens.colors.brand },
    { key: 'present', label: 'Present', color: tokens.colors.success },
    { key: 'late', label: 'Late', color: tokens.colors.blue },
    { key: 'half', label: 'Half-Day', color: tokens.colors.warning },
    { key: 'absent', label: 'Absent', color: tokens.colors.error },
  ];

  const hasFilter = !!search || !!letter || statusFilter !== 'all';
  const clearAll = () => {
    setSearch('');
    setLetter('');
    setStatusFilter('all');
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
      {/* Header row */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Typography variant="body1" fontWeight={600} color="text.primary">
            Team Members
          </Typography>
          <Chip
            label={`${filtered.length}${filtered.length !== users.length ? ` of ${users.length}` : ''}`}
            size="small"
            sx={{
              bgcolor: alpha(tokens.colors.pink, 0.1),
              color: tokens.colors.pink,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
              borderRadius: 1.5,
            }}
          />
          {hasFilter && (
            <Chip
              label="Clear filters"
              size="small"
              onClick={clearAll}
              icon={<IconX size={12} />}
              sx={{
                cursor: 'pointer',
                bgcolor: alpha('#94A3B8', 0.12),
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 22,
                borderRadius: 1.5,
                '&:hover': { bgcolor: alpha('#94A3B8', 0.2) },
                '& .MuiChip-icon': { color: 'text.secondary', ml: 0.5 },
              }}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: search ? tokens.colors.pink : 'divider',
              bgcolor: '#F6F9FC',
              minWidth: 200,
              transition: 'border-color 0.2s',
            }}
          >
            <IconSearch size={16} color="#5A6A85" />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              sx={{ flex: 1, fontSize: '0.8125rem' }}
            />
            {search && (
              <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25, color: 'text.secondary' }}>
                <IconX size={14} />
              </IconButton>
            )}
          </Box>

          {checkInCheckOutNode}
        </Stack>
      </Stack>

      {/* Status filter pills */}
      <Stack direction="row" gap={0.75} flexWrap="wrap" mb={2}>
        {statusPills.map((p) => {
          const isActive = statusFilter === p.key;
          return (
            <Chip
              key={p.key}
              label={p.label}
              size="small"
              clickable
              onClick={() => setStatusFilter(p.key)}
              sx={{
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 500,
                height: 26,
                borderRadius: '8px',
                bgcolor: isActive ? alpha(p.color, 0.12) : 'transparent',
                color: isActive ? p.color : 'text.secondary',
                border: '1px solid',
                borderColor: isActive ? alpha(p.color, 0.3) : 'divider',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: alpha(p.color, 0.08),
                  borderColor: alpha(p.color, 0.3),
                  color: p.color,
                },
              }}
            />
          );
        })}
      </Stack>

      {/* Alphabet strip */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          mb: 2,
          p: 1,
          borderRadius: 2.5,
          bgcolor: '#F6F9FC',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          onClick={() => setLetter('')}
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
            bgcolor: letter === '' ? tokens.colors.pink : 'transparent',
            color: letter === '' ? '#fff' : tokens.colors.brand,
            transition: 'all 0.15s',
            '&:hover': { bgcolor: letter === '' ? tokens.colors.pink : alpha(tokens.colors.pink, 0.12) },
          }}
        >
          All
        </Box>
        {letters.map((l) => {
          const isActive = letter === l;
          const hasUsers = activeLetters.has(l);
          return (
            <Box
              key={l}
              onClick={() => hasUsers && setLetter(l)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: hasUsers ? 'pointer' : 'not-allowed',
                bgcolor: isActive ? tokens.colors.pink : 'transparent',
                color: isActive ? '#fff' : hasUsers ? tokens.colors.brand : alpha('#94A3B8', 0.4),
                opacity: hasUsers ? 1 : 0.4,
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: !hasUsers ? 'transparent' : isActive ? tokens.colors.pink : alpha(tokens.colors.pink, 0.12),
                },
              }}
            >
              {l}
            </Box>
          );
        })}
      </Box>

      {/* User chip grid (flex-wrap, not horizontal scroll) */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            py: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
          }}
        >
          <IconSearch size={28} style={{ opacity: 0.4 }} />
          <Typography variant="body2">No members match your filters</Typography>
          {hasFilter && (
            <Typography
              variant="caption"
              onClick={clearAll}
              sx={{ cursor: 'pointer', color: tokens.colors.pink, fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
            >
              Clear filters
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1,
            maxHeight: 240,
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { background: alpha('#94A3B8', 0.4), borderRadius: 3 },
          }}
        >
          {filtered.map((u) => {
            const isActive = u._id === currentUser._id;
            const status = userTodayStatus(u._id);
            const dotColor = statusDotColor(status);
            const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase();
            return (
              <Box
                key={u._id}
                onClick={() => setCurrentUser(u)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2.5,
                  border: '1.5px solid',
                  borderColor: isActive ? tokens.colors.pink : 'divider',
                  bgcolor: isActive ? alpha(tokens.colors.pink, 0.06) : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: isActive ? tokens.colors.pink : alpha(tokens.colors.pink, 0.35),
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: isActive ? tokens.colors.pink : alpha(tokens.colors.brand, 0.1),
                      color: isActive ? '#fff' : tokens.colors.brand,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: dotColor,
                      border: '2px solid #fff',
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={isActive ? 600 : 500} color="text.primary" noWrap>
                    {u.firstName} {u.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {status === 'absent' ? 'Not checked in' : status}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </MotionBox>
  );
}
