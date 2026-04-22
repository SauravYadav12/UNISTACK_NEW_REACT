import React, { useEffect, useState } from 'react';
import {
  AttendanceStatus,
  iAttendance,
  UserRole,
} from '../../Interfaces/iUser';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Popover } from '@mui/material';
import {
  LocalizationProvider,
  TimeClock,
} from '@mui/x-date-pickers';
import type { TimeView } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment, { Moment } from 'moment';
import { toast } from 'react-toastify';
import { updateAttendance } from '../../services/attendanceApi';
import { dateByUserShift } from '../../utils/dateUtil';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
interface iProps {
  attendance: iAttendance;
  field: 'checkIn' | 'checkOut';
  onChange: (att: iAttendance) => void;
  label?: string;
}
const AttendanceTimePicker = ({
  attendance,
  field,
  onChange,
  label,
}: iProps) => {
  const me = useAuth().iUser!;
  const [date, setDate] = useState<Moment | null>(iShiftDate());
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const [view, setView] = useState<TimeView>('hours');
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
    if (!v) return;
    v = dateByUserShift(me.shift, v);
    if (view === 'hours') {
      setDate(v);
      setView('minutes');
    } else if (view === 'minutes') {
      setDate(v);
      handleUpdateTimeApi(v);
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
    !me?.role.includes(UserRole['super-admin'])
  )
    return;

  return (
    <Box sx={{ mx: 1 }}>
      <IconButton
        onClick={handleClick}
        aria-label={label || 'Open time picker'}
      >
        <AccessTimeIcon sx={{ width: '20px', height: '20px' }} />
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
            <TimeClock
              value={moment(date)}
              onChange={handleChange}
              ampm
              ampmInClock
              views={['hours', 'minutes']}
              onViewChange={(newView) => setView(newView)}
              view={view}
            />
          </Box>
        </LocalizationProvider>
      </Popover>
    </Box>
  );
};

export default AttendanceTimePicker;
