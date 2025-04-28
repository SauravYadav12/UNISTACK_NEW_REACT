import React, { useEffect, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';

import SyncIcon from '@mui/icons-material/Sync';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { Android12Switch } from '../../pages/Marketing/Profile/constants';
import {
  AttendanceStatus,
  iAttendance,
  jUser,
  UserRole,
} from '../../Interfaces/iUser';
import { markAttendance, updateAttendance } from '../../services/attendanceApi';
import { toast } from 'react-toastify';
import { getJUser } from '../../utils/utils';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { iUseAttendance } from '../../hooks/attendanceHook';
import {
  dateByUserShift,
  getAttendanceStatus,
  getWorkingDuration,
} from '../../utils/dateUtil';
import AttendanceStatusBox, { MyTimePicker } from './AttendanceStatusBox';
import { dateFormate } from '../constants';
import { Moment } from 'moment';
import DatePickerButton from './DatePickerButton';
import { AttendanceTableType } from '../../pages/Attendance/AttendanceDashboard';
import SelectAttendanceStatus from './SelectAttendanceStatus';
interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  forEmployee: boolean;
  tableContainerHeight?: number;
  onChange?: (a: iAttendance) => void;
}
const DailyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
  forEmployee,
  tableContainerHeight = 480,
  onChange,
}: iProps) => {
  const [currentDate, setCurrentDate] = dateState;
  const { attendance, error, loading, loadData } = attendanceState;
  function nextDay() {
    setCurrentDate(currentDate.clone().add(1, 'day'));
  }

  function preDay() {
    setCurrentDate(currentDate.clone().subtract(1, 'day'));
  }

  function MyTableBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={4}>
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
          <TableCell colSpan={4}>
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
        {users.map((employee) => {
          const att = attendance?.find(
            (e) =>
              employee._id === e.userRef &&
              e.date === currentDate.format(dateFormate)
          );
          return (
            <TableRow key={employee._id}>
              <TableCell>
                <Typography variant="subtitle2">
                  {employee.firstName + ' ' + employee.lastName}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      ...(!forEmployee && {
                        width: '293px',
                        justifyContent: 'flex-start',
                        pl: 5,
                      }),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <AttendanceStatusBox
                        forEmployee={forEmployee}
                        date={currentDate}
                        onChange={onChange}
                        user={employee}
                        attendance={att}
                      />
                    </div>

                    <AttendanceForm
                      forEmployee={forEmployee}
                      onChange={onChange}
                      user={employee}
                      date={currentDate}
                      attendance={att}
                    />
                  </Box>
                </Box>
              </TableCell>
              {!forEmployee && (
                <TableCell align="center">
                  {att?.checkIn && att.checkOut
                    ? getWorkingDuration(att.checkIn, att.checkOut)
                    : 'NA'}
                </TableCell>
              )}
              <TableCell align="center">
                {att && (
                  <MyTimePicker
                    attendance={att}
                    onChange={onChange}
                    field="checkIn"
                  />
                )}
              </TableCell>
              <TableCell align="center">
                {att && (
                  <MyTimePicker
                    attendance={att}
                    onChange={onChange}
                    field="checkOut"
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
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
            {currentDate.format('dddd, YYYY MMMM DD')}
            {!forEmployee && (
              <DatePickerButton
                tableType={AttendanceTableType.Daily}
                dateState={dateState}
              />
            )}
          </Stack>
        </>
      }
      action={
        <>
          {!forEmployee && (
            <div>
              <IconButton onClick={preDay} size="small">
                <ArrowLeft />
              </IconButton>
              <IconButton
                onClick={nextDay}
                size="small"
                disabled={currentDate.isAfter(
                  dateByUserShift(getJUser()!.shift).subtract(1, 'day')
                )}
              >
                <ArrowRight />
              </IconButton>
            </div>
          )}
        </>
      }
    >
      <TableContainer
        sx={{ height: tableContainerHeight, scrollbarWidth: 'thin' }}
      >
        <Table
          sx={{ minWidth: 650 }}
          aria-label="daily attendance table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell align="center">Attendance Status</TableCell>
              {!forEmployee && <TableCell align="center">Duration</TableCell>}
              <TableCell align="center">Checked In At</TableCell>
              <TableCell align="center">Checked Out At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <MyTableBody />
          </TableBody>
        </Table>
      </TableContainer>
    </ChartCardWrapper>
  );
};

export default DailyAttendanceTable;

interface AttendanceFormProps {
  date: Moment;
  attendance?: iAttendance;
  user: jUser;
  forEmployee?: boolean;
  onChange?: (attendance: iAttendance) => void;
}

function AttendanceForm({
  forEmployee,
  user,
  date,
  attendance,
  onChange,
}: AttendanceFormProps) {
  const canEditRoles = [UserRole['super-admin'], UserRole.hr];
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(attendance?.status);

  async function onChangeAttendance(newStatus: AttendanceStatus) {
    if (loading) return;

    const preStatus = status;
    try {
      setStatus(newStatus);
      setLoading(true);
      const { data } = await (attendance
        ? updateAttendance(attendance._id, {
            status: newStatus,
          })
        : markAttendance(user, date.format(dateFormate), newStatus));
      data.data && onChange && onChange(data.data);
    } catch (error) {
      setStatus(preStatus);
      toast.error('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setStatus(attendance?.status);
  }, [attendance]);

  return (
    <>
      <AttendanceSwitch
        status={status}
        user={user}
        forEmployee={forEmployee}
        onChange={onChangeAttendance}
      />
      {!forEmployee && canEditRoles.includes(getJUser()!.role) && (
        <Box width={'fit-content'}>
          <SelectAttendanceStatus
            attendance={attendance}
            date={date}
            user={user}
            onChange={onChange}
          />
        </Box>
      )}
    </>
  );
}

interface AttendanceSwitchProps {
  status?: AttendanceStatus;
  user: jUser;
  forEmployee?: boolean;
  onChange: (attendance: AttendanceStatus) => void;
}

function AttendanceSwitch({
  status = AttendanceStatus.Absent,
  user,
  forEmployee,
  onChange,
}: AttendanceSwitchProps) {
  const [checked, setChecked] = useState(status !== AttendanceStatus.Absent);
  const canEditRoles = [UserRole['super-admin'], UserRole.hr];
  const isTimeApplicable = !!getAttendanceStatus(user);
  const disabled = forEmployee
    ? status !== AttendanceStatus.Absent || !isTimeApplicable
    : !canEditRoles.includes(getJUser()!.role) &&
      status !== AttendanceStatus.Absent;

  function getStatus() {
    if (!!status && status != AttendanceStatus.Absent)
      return AttendanceStatus.Absent;
    if (forEmployee) {
      return getAttendanceStatus(user);
    }
    return getAttendanceStatus(user) || AttendanceStatus.Present;
  }

  function handleChange() {
    const s = getStatus();
    if (!s) {
      toast.error('Attendance not applicable');
      return;
    }
    onChange(s);
  }
  useEffect(() => {
    setChecked(status !== AttendanceStatus.Absent);
  }, [status]);

  return (
    <Android12Switch
      disabled={disabled}
      checked={checked}
      onChange={handleChange}
    />
  );
}
