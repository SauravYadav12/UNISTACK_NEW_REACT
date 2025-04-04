import { Select, MenuItem, Box, CircularProgress } from '@mui/material';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import React from 'react';
import { Grid, Typography, IconButton } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { jUser } from '../../Interfaces/iUser';
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

const DateCell = styled(Grid)(({ theme, status }: any) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  textAlign: 'center',
}));

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
interface iProps {
  user: jUser;
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
}

const AttendanceGridMonthly = ({
  user,
  attendanceState,
  dateState,
}: iProps) => {
  const { attendance, loading, error, loadData } = attendanceState;
  const [currentDate, setCurrentDate] = dateState;

  const year = currentDate.year();
  const month = currentDate.month();
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.clone().startOf('month').day(); // 0 for Sunday, 6 for Saturday

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
        moment(item.date).format(dateFormate) === moment(date).format(dateFormate)
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
          <Typography variant="h6">
            {/* {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
              currentDate
            )} */}
             {currentDate.format('MMMM')}
          </Typography>
          <IconButton
            // disabled={dayjs(currentDate).isAfter(
            //   new Date().setMonth(new Date().getMonth() - 1)
            // )}
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
