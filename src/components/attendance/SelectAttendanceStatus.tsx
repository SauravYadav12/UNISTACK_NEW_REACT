import { Select, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';
import { Moment } from 'moment';
import { toast } from 'react-toastify';
import { updateAttendance, markAttendance } from '../../services/attendanceApi';
import { dateFormate } from '../constants';

interface iProps {
  date: Moment;
  attendance?: iAttendance;
  user: iUser;
  onChange?: (attendance: iAttendance) => void;
}
const SelectAttendanceStatus = ({
  date,
  attendance,
  user,
  onChange,
}: iProps) => {
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
      data.data && onChange?.(data.data);
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
    <Select
      sx={{
        '& .MuiSelect-select': { p: '0.8px 10px', pr: '22px' },
        width: '100%',
      }}
      value={status || ''}
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
  );
};

export default SelectAttendanceStatus;
