import { Select, MenuItem, Box, CircularProgress } from '@mui/material';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import React from 'react';
import { Grid, Typography, IconButton } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { iAttendance, iUser } from '../../Interfaces/iUser';
import { dateFormate } from '../constants';
import { iUseAttendance } from '../../hooks/attendanceHook';

import SyncIcon from '@mui/icons-material/Sync';
import AttendanceStatusBox from './AttendanceStatusBox';
import moment, { Moment } from 'moment';
const AttendanceCalendarRoot = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  padding: '0px 10px',
}));

const CalendarHeader = styled(Grid)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const DaysOfWeek = styled(Grid)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  padding: theme.spacing(0.5),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const CalendarGrid = styled(Grid)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '10px',
  padding: '10px 0px',
}));

const DateCell = styled(Grid)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  textAlign: 'center',
}));

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
interface iProps {
  user: iUser;
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  onAttendanceDeleted?: (attendanceId: string) => void;
}

const AttendanceGridMonthly = ({
  user,
  attendanceState,
  dateState,
  onAttendanceDeleted: onAttendanceDeletedProp,
}: iProps) => {
  const { attendance, loading, error, loadData, setResults } = attendanceState;
  const [currentDate, setCurrentDate] = dateState;

  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.clone().startOf('month').day(); // 0 for Sunday, 6 for Saturday
  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  function handleAttendanceDeletedLocal(attendanceId: string) {
    setResults((pre) => pre.filter((i) => i._id !== attendanceId));
  }

  const onAttendanceDeletedResolved =
    onAttendanceDeletedProp ?? handleAttendanceDeletedLocal;
  const handlePrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month').startOf('month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month').startOf('month'));
  };

  const handleYear = (y: number) => {
    setCurrentDate(currentDate.clone().year(y));
  };

  const getAttendance = (date: Moment) => {
    const att = attendance.find(
      (item) =>
        item.date === moment(date).format(dateFormate) &&
        user._id === item?.userRef
    );
    return att;
  };

  function getYearsList(startYear = 2024) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.unshift(year);
    }
    return years;
  }

  const renderDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Grid item key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentDate.clone().date(day);
      days.push(
        <DateCell item key={date.toISOString()}>
          <AttendanceStatusBox
            label={`${day}`}
            attendance={getAttendance(date)}
            date={date}
            user={user}
            onChange={handleChange}
            onAttendanceDeleted={onAttendanceDeletedResolved}
          />
        </DateCell>
      );
    }

    return days;
  };

  function MyTableBody() {
    if (loading)
      return (
        <Box className="loader" sx={{ py: 10 }}>
          <CircularProgress size={25} />
        </Box>
      );
    if (error) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={loadData}>
            <SyncIcon color="primary" />
          </IconButton>
        </Box>
      );
    }

    return <CalendarGrid container>{renderDays()}</CalendarGrid>;
  }

  return (
    <ChartCardWrapper
      title="Attendance"
      subtitle={user.firstName + ' ' + user.lastName}
      action={
        <Select
          labelId="month-dd"
          id="month-dd"
          value={currentDate.year()}
          size="small"
          onChange={(e) => handleYear(Number(e.target.value))}
        >
          {getYearsList().map((o, i) => {
            return (
              <MenuItem key={i} value={o}>
                {o}
              </MenuItem>
            );
          })}
        </Select>
      }
    >
      <AttendanceCalendarRoot sx={{ overflow: 'auto' }}>
        <CalendarHeader
          container
          justifyContent="space-between"
          alignItems="center"
        >
          <IconButton onClick={handlePrevMonth}>
            <ArrowLeft />
          </IconButton>
          <Typography variant="h6">{currentDate.format('MMMM')}</Typography>
          <IconButton
            disabled={currentDate.isAfter(
              moment().subtract(1, 'month').endOf('month')
            )}
            onClick={handleNextMonth}
          >
            <ArrowRight />
          </IconButton>
        </CalendarHeader>

        <DaysOfWeek container columnGap={'10px'}>
          {daysOfWeek.map((day) => (
            <Typography key={day} variant="caption" sx={{ minWidth: '46px' }}>
              {day}
            </Typography>
          ))}
        </DaysOfWeek>
        <MyTableBody />
      </AttendanceCalendarRoot>
    </ChartCardWrapper>
  );
};

export default AttendanceGridMonthly;
