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
import { dateFormate } from '../constants';
import { iUseAttendance } from '../../hooks/attendanceHook';
import Sync from '@mui/icons-material/Sync';
import AttendanceStatusBox from './AttendanceStatusBox';
import { Moment } from 'moment';
import moment from 'moment';

const EmployeeInfoCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 1,
}));
interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  tableContainerHeight?: number;
}
const MonthlyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
  tableContainerHeight = 430,
}: iProps) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = dateState;
  const { attendance, loading, loadData, error } = attendanceState;
  const daysInMonth = currentDate.daysInMonth();
  const handlePrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month').startOf('month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month').startOf('month'));
  };

  const getMonthDays = () => {
    const days: Moment[] = [];
    const startOfMonth = currentDate.clone().startOf('month');
    for (let i = 0; i < daysInMonth; i++) {
      days.push(startOfMonth.clone().add(i, 'day'));
    }
    return days;
  };

  const getAttendance = (date: Moment, userRef: string) => {
    const att = attendance.find(
      (item) =>
        moment(item.date).format(dateFormate) === date.format(dateFormate) &&
        userRef === item?.userRef
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
                <Typography variant="caption">{date.format('DD')}</Typography>
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
      subtitle={currentDate.format('MMMM YYYY')}
      action={
        <div>
          <IconButton onClick={handlePrevMonth} size="small">
            <ArrowLeft />
          </IconButton>
          <IconButton
            onClick={handleNextMonth}
            size="small"
            disabled={currentDate.isAfter(
              moment().subtract(1, 'month').endOf('month'),
              'month'
            )}
          >
            <ArrowRight />
          </IconButton>
        </div>
      }
    >
      <TableContainer
        sx={{
          height: tableContainerHeight,
          scrollbarWidth: 'thin',
        }}
      >
        <MyTable />
      </TableContainer>
    </ChartCardWrapper>
  );
};

export default MonthlyAttendanceTable;
