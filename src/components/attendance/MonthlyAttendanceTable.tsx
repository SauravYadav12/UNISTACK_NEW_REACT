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
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { jUser } from '../../Interfaces/iUser';
import dayjs from 'dayjs';
import { dateFormate } from '../constants';
import { iUseAttendance } from '../../hooks/attendanceHook';
import Sync from '@mui/icons-material/Sync';
import AttendanceStatusBox from './AttendanceStatusBox';

const EmployeeInfoCell = styled(TableCell)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 1, // Ensure it stays on top of the scrolling content
}));
interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Date, React.Dispatch<React.SetStateAction<Date>>];
}
const MonthlyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
}: iProps) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = dateState;
  const { attendance, loading, loadData, error } = attendanceState;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getMonthDays = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };
  const getAttendance = (date: Date, userRef: string) => {
    const att = attendance.find(
      (item) =>
        dayjs(item.date).format(dateFormate) ===
          dayjs(date).format(dateFormate) && userRef === item?.userRef
    );
    return att;
  };

  const monthDays = getMonthDays();

  function MyTable() {
    if (loading) {
      return (
        <Box className="loader">
          <CircularProgress size={25} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{'error'}</Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Table
        stickyHeader
        sx={{ minWidth: daysInMonth * 40 + 200 }}
        aria-label="monthly attendance table"
      >
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                position: 'sticky',
                left: 0,
                zIndex: 3,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              Employee
            </TableCell>
            {monthDays.map((date) => (
              <TableCell key={date.toISOString()} align="center" padding="none">
                <Typography variant="caption">
                  {String(date.getDate()).padStart(2, '0')}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((employee) => (
            <TableRow key={employee._id}>
              <EmployeeInfoCell>
                <div>
                  <Typography variant="subtitle2">
                    {employee.firstName + ' ' + employee.lastName}
                  </Typography>
                </div>
              </EmployeeInfoCell>
              {monthDays.map((date) => {
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
        </TableBody>
      </Table>
    );
  }

  return (
    <ChartCardWrapper
      p={'0px'}
      boxShadow={false}
      //   title="Monthly Attendance"
      subtitle={new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(currentDate)}
      action={
        <div>
          <IconButton onClick={handlePrevMonth} size="small">
            <ArrowLeft />
          </IconButton>
          <IconButton
            onClick={handleNextMonth}
            size="small"
            disabled={dayjs(currentDate).isAfter(
              new Date().setMonth(new Date().getMonth() - 1)
            )}
          >
            <ArrowRight />
          </IconButton>
        </div>
      }
    >
      <TableContainer
        sx={{
          height: 480,
          scrollbarWidth: 'thin',
        }}
      >
        <MyTable />
      </TableContainer>
    </ChartCardWrapper>
  );
};

export default MonthlyAttendanceTable;
