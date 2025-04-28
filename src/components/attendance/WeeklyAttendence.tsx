import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { iAttendance, jUser } from '../../Interfaces/iUser';
import { dateFormate } from '../constants';
import { iUseAttendance } from '../../hooks/attendanceHook';
import AttendanceStatusBox from './AttendanceStatusBox';
import { Moment } from 'moment';
import moment from 'moment';
import { AttendanceTableType } from '../../pages/Attendance/AttendanceDashboard';
import DatePickerButton from './DatePickerButton';

interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  tableContainerHeight?: number;
  forEmployee: boolean;
}

const WeeklyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
  forEmployee,
  tableContainerHeight = 430,
}: iProps) => {
  const [startDate, setStartDate] = dateState; // Set your desired start date for the week
  const { attendance, loading, loadData, setResults, error } = attendanceState;
  const weekDates = getWeekDates(startDate);
  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }
  function getWeekDates(start: Moment): Moment[] {
    const dates: Moment[] = [];
    const currentDate = start.clone();
    for (let i = 0; i < 5; i++) {
      // Assuming a 5-day work week (Mon-Fri)
      const day = currentDate.day(); // Moment.js day() returns 0 for Sunday, 1 for Monday, etc.
      // Skip Saturday (6) and Sunday (0)
      if (day !== 0 && day !== 6) {
        dates.push(currentDate.clone());
      } else {
        // If it's a weekend, move to the next Monday
        currentDate.add(day === 6 ? 2 : 1, 'day');
        i--; // Decrement to maintain the loop count
        continue;
      }
      currentDate.add(1, 'day');
    }
    return dates;
  }

  const handlePrevWeek = () => {
    setStartDate(startDate.clone().subtract(7, 'days'));
  };

  const handleNextWeek = () => {
    setStartDate(startDate.clone().add(7, 'days'));
  };
  const getAttendance = (date: Moment, userRef: string) => {
    const att = attendance.find(
      (item) =>
        item.date === date.format(dateFormate) && userRef === item?.userRef
    );
    return att;
  };

  function MyTabelBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={weekDates.length + 1}>
            <Box className="loader" sx={{ py: 1 }}>
              <CircularProgress size={25} />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={weekDates.length + 1}>
            <Box textAlign={'center'}>
              <Typography color="error">{'error'}</Typography>
              <IconButton onClick={loadData}>
                <SyncIcon color="primary" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {users.map((employee) => (
          <TableRow
            key={employee._id}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <TableCell>
              <div>
                <Typography variant="subtitle2" sx={{ minHeight: '24px' }}>
                  {employee.firstName + ' ' + employee.lastName}
                </Typography>
              </div>
            </TableCell>
            {weekDates.map((date) => {
              return (
                <TableCell key={`${employee._id}-${date.toISOString()}`}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <AttendanceStatusBox
                      attendance={getAttendance(date, employee._id)}
                      forEmployee={forEmployee}
                      date={date}
                      onChange={handleChange}
                      user={employee}
                    />
                  </Box>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </>
    );
  }

  return (
    <ChartCardWrapper
      p={'0px'}
      boxShadow={false}
      subtitle={
        <>
          <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            justifyContent={'center'}
          >
            {`Week of ${weekDates[0]?.format(dateFormate)} - ${weekDates[
              weekDates.length - 1
            ]?.format(dateFormate)}`}
            <DatePickerButton
              tableType={AttendanceTableType.Weekly}
              dateState={dateState}
            />
          </Stack>
        </>
      }
      action={
        <div>
          <IconButton onClick={handlePrevWeek} size="small">
            <ArrowLeft />
          </IconButton>
          <IconButton
            onClick={handleNextWeek}
            size="small"
            disabled={weekDates[weekDates.length - 1]?.isAfter(moment(), 'day')}
          >
            <ArrowRight />
          </IconButton>
        </div>
      }
    >
      <TableContainer
        sx={{ height: tableContainerHeight, scrollbarWidth: 'thin' }}
      >
        <Table aria-label="weekly attendance table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              {weekDates.map((date) => (
                <TableCell key={date.toISOString()} align="center">
                  {date.format('ddd, DD')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <MyTabelBody />
          </TableBody>
        </Table>
      </TableContainer>
    </ChartCardWrapper>
  );
};

export default WeeklyAttendanceTable;
