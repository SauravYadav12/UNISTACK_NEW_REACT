import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
  useTheme,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { jUser} from '../../Interfaces/iUser';
import dayjs from 'dayjs';
import { dateFormate } from '../constants';
import { iUseAttendance } from '../../hooks/attendanceHook';
import AttendanceStatusBox from './AttendanceStatusBox';

const EmployeeInfoCell = styled(TableCell)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Date, React.Dispatch<React.SetStateAction<Date>>];
}

const WeeklyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
}: iProps) => {
  const theme = useTheme();
  const [startDate, setStartDate] = dateState; // Set your desired start date for the week
  const { attendance, loading, loadData, error } = attendanceState;
  const weekDates = getWeekDates(startDate);

  function getWeekDates(start: any) {
    const dates = [];
    const currentDate = new Date(start);
    for (let i = 0; i < 5; i++) {
      // Assuming a 5-day work week (Mon-Fri)
      const day = currentDate.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (day !== 0 && day !== 6) {
        dates.push(new Date(currentDate));
      } else {
        // If it's a weekend, move to the next Monday
        currentDate.setDate(currentDate.getDate() + (day === 6 ? 2 : 1));
        i--; // Decrement to maintain the loop count
        continue;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  const handlePrevWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(newStartDate.getDate() - 7);
    setStartDate(newStartDate);
  };

  const handleNextWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(newStartDate.getDate() + 7);
    setStartDate(newStartDate);
  };
  const getAttendance = (date: Date, userRef: string) => {
    const att = attendance.find(
      (item) =>
        dayjs(item.date).format(dateFormate) ===
          dayjs(date).format(dateFormate) && userRef === item?.userRef
    );
    return att;
  };

  function MyTabelBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={weekDates.length + 1}>
            <Box className="loader" sx={{ py: 10 }}>
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
            <EmployeeInfoCell>
              <div>
                <Typography variant="subtitle2">
                  {employee.firstName + ' ' + employee.lastName}
                </Typography>
                
              </div>
            </EmployeeInfoCell>
            {weekDates.map((date) => {
              return (
                <TableCell key={`${employee._id}-${date.toISOString()}`}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <AttendanceStatusBox
                      attendance={getAttendance(date, employee._id)}
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
      subtitle={`Week of ${dayjs(weekDates[0]).format(dateFormate)} - ${dayjs(
        weekDates[weekDates.length - 1]
      ).format(dateFormate)}`}
      action={
        <div>
          <IconButton onClick={handlePrevWeek} size="small">
            <ArrowLeft />
          </IconButton>
          <IconButton
            onClick={handleNextWeek}
            size="small"
            disabled={dayjs(weekDates[weekDates.length - 1]).isAfter(
              new Date()
            )}
          >
            <ArrowRight />
          </IconButton>
        </div>
      }
    >
      <TableContainer sx={{ height: 480, scrollbarWidth: 'thin' }}>
        <Table aria-label="weekly attendance table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              {weekDates.map((date) => (
                <TableCell key={date.toISOString()} align="center">
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                  }).format(date)}
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
