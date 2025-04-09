import React, { useEffect, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
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
  Stack,
  Popover,
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
  handleAttendanceStatus,
  timeByUserShift,
} from '../../utils/dateUtil';
import AttendanceStatusBox from './AttendanceStatusBox';
import { dateFormate, timeFormate } from '../constants';
import moment, { Moment } from 'moment';
import {
  ClockPicker,
  ClockPickerView,
  LocalizationProvider,
} from '@mui/x-date-pickers';

interface iProps {
  users: jUser[];
  attendanceState: iUseAttendance;
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  forEmployee?: boolean;
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
                      <AttendanceStatusBox attendance={att} />
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
                <Stack
                  direction={'row'}
                  display={'flex'}
                  justifyContent={'center'}
                >
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    alignContent={'center'}
                  >
                    {att?.checkIn && status !== AttendanceStatus.Absent
                      ? timeByUserShift(
                          getJUser()!.shift,
                          moment(att.checkIn)
                        ).format(timeFormate + ' z')
                      : 'NA'}
                  </Typography>
                  {att && onChange && (
                    <TimePickerButton
                      attendance={att}
                      onChange={onChange}
                      field="checkIn"
                    />
                  )}
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Stack
                  direction={'row'}
                  display={'flex'}
                  justifyContent={'center'}
                >
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    alignContent={'center'}
                  >
                    {att?.checkOut && status !== AttendanceStatus.Absent
                      ? timeByUserShift(
                          getJUser()!.shift,
                          moment(att.checkOut)
                        ).format(timeFormate + ' z')
                      : 'NA'}
                  </Typography>
                  {att && onChange && (
                    <TimePickerButton
                      attendance={att}
                      onChange={onChange}
                      field="checkOut"
                    />
                  )}
                </Stack>
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
      subtitle={currentDate.format('dddd, YYYY MMMM DD')}
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
    ? status !== AttendanceStatus.Absent || !isTimeApplicable
    : !canEditRoles.includes(getJUser()!.role) &&
      status !== AttendanceStatus.Absent;

  function getStatus() {
    if (!!status && status != AttendanceStatus.Absent)
      return AttendanceStatus.Absent;
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

interface TimePickerButtonProps {
  attendance: iAttendance;
  field: 'checkIn' | 'checkOut';
  onChange: (att: iAttendance) => void;
  label?: string;
}

function TimePickerButton({
  attendance,
  field,
  onChange,
  label,
}: TimePickerButtonProps) {
  const me = getJUser()!;
  const [date, setDate] = useState<Moment | null>(iShiftDate());
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const [view, setView] = useState<ClockPickerView>('hours');
  const [loading, setLoading] = useState(false);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  function iShiftDate() {
    return attendance[field]
      ? dateByUserShift(me.shift, moment(attendance[field]))
      : dateByUserShift(me.shift);
  }

  async function handleUpdateTimeApi(iTime: Moment) {
    if (loading) return;
    try {
      setLoading(true);
      const { data } = await updateAttendance(attendance._id, {
        [field]: iTime.toISOString(true),
      });
      data.data && onChange(data.data);
    } catch (error) {
      toast.error('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(v: Moment | null) {
    if (view === 'hours') {
      setDate(v);
      setView('minutes');
    } else if (view === 'minutes') {
      setDate(v);
      v && handleUpdateTimeApi(v);
      const t = setTimeout(() => {
        handleClose();
        setView('hours');
        clearTimeout(t);
      }, 100);
    }
  }
  const handleClose = () => {
    setAnchorEl(null);
  };
  useEffect(() => {
    setDate(iShiftDate());
  }, [field, attendance[field]]);

  if (
    attendance.status === AttendanceStatus.Absent ||
    me.role !== UserRole['super-admin']
  )
    return;

  return (
    <Box sx={{ mx: 1 }}>
      <IconButton
        onClick={handleClick}
        aria-label={label || 'Open time picker'}
      >
        <AccessTimeIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <IconButton
                onClick={() => setView('hours')}
                disabled={view === 'hours'}
                aria-label="previous view"
              >
                <ArrowLeft />
              </IconButton>
              <IconButton
                onClick={() => setView('minutes')}
                disabled={view === 'minutes'}
                aria-label="next view"
              >
                <ArrowRight />
              </IconButton>
            </Box>
            <ClockPicker
              date={moment(date)}
              onChange={handleChange}
              ampm
              views={['hours', 'minutes']}
              onViewChange={(newView) => setView(newView)}
              view={view}
            />
          </Box>
        </LocalizationProvider>
      </Popover>
    </Box>
  );
}
