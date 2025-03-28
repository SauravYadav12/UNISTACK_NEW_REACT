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
  MenuItem,
  Select,
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
import dayjs from 'dayjs';
import { markAttendance, updateAttendance } from '../../services/attendanceApi';
import { toast } from 'react-toastify';
import { getJUser } from '../../utils/utils';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { iUseAttendance } from '../../hooks/attendanceHook';
import {
  dateByUserShift,
  handleAttendanceStatus,
  timeByUserShift,
} from '../../utils/dateUtil';
import AttendanceStatusBox from './AttendanceStatusBox';

interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Date, React.Dispatch<React.SetStateAction<Date>>];
  forEmployee?: boolean;
  onChange?: (a: iAttendance) => void;
}
const DailyAttendanceTable = ({
  users,
  attendanceState,
  dateState,
  forEmployee,
  onChange,
}: iProps) => {
  const [currentDate, setCurrentDate] = dateState;
  const { attendance, error, loading, loadData } = attendanceState;
  function nextDay() {
    const newStartDate = new Date(currentDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    setCurrentDate(newStartDate);
  }

  function preDay() {
    const newStartDate = new Date(currentDate);
    newStartDate.setDate(newStartDate.getDate() - 1);
    setCurrentDate(newStartDate);
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
          const att = attendance?.find((e) => employee._id === e.userRef);
          const status = att?.status;
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
                    <AttendanceStatusBox  attendance={att} />
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
              <TableCell align="center">
                <Typography variant="subtitle2" color="textSecondary">
                  {att?.checkIn && status !== AttendanceStatus.Absent
                    ? timeByUserShift(getJUser()!.shift, att.checkIn)
                    : 'NA'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" color="textSecondary">
                  {att?.checkOut && status !== AttendanceStatus.Absent
                    ? timeByUserShift(getJUser()!.shift, att.checkOut)
                    : 'NA'}
                </Typography>
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
      subtitle={new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(currentDate)}
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
                disabled={dayjs(currentDate).isAfter(
                  new Date().setDate(
                    new Date(dateByUserShift(getJUser()!.shift)).getDate() - 1
                  )
                )}
              >
                <ArrowRight />
              </IconButton>
            </div>
          )}
        </>
      }
    >
      <TableContainer sx={{ height: 480, scrollbarWidth: 'thin' }}>
        <Table
          sx={{ minWidth: 650 }}
          aria-label="daily attendance table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell align="center">Attendance Status</TableCell>
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
  date: Date;
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
        : markAttendance(user, date, newStatus));
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
        <>
          <Select
            sx={{ '& .MuiSelect-select': { p: '0.8px 10px', pr: '22px' } }}
            value={status}
            size="small"
            onChange={(e) => {
              onChangeAttendance(e.target.value as any);
            }}
          >
            {Object.values(AttendanceStatus).map((o, i) => {
              return (
                <MenuItem key={i} value={o}>
                  {o}
                </MenuItem>
              );
            })}
          </Select>
        </>
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
  const isTimeApplicable = !!handleAttendanceStatus(user.shift);
  const disabled = forEmployee
    ? status === AttendanceStatus.Present && isTimeApplicable
    : !canEditRoles.includes(getJUser()!.role) &&
      status !== AttendanceStatus.Absent;

  function getStatus() {
    if (status === AttendanceStatus.Present) return AttendanceStatus.Absent;
    if (forEmployee) {
      return handleAttendanceStatus(user.shift);
    }
    return handleAttendanceStatus(user.shift) || AttendanceStatus.Present;
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
