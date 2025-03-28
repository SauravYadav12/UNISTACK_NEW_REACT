import React, { useEffect } from 'react';
import { AttendanceStatus, iAttendance, jUser } from '../../Interfaces/iUser';
import { Button } from '@mui/material';
import MarkAttendanceModal, {
  autoOpenAttendanceModalKey,
} from '../dashboard/MarkAttendanceModal';
import MarkCheckoutTimeModal from '../dashboard/MarkCheckoutTimeModal';
import { handleAttendanceStatus } from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';

const CheckInCheckOut = ({ user, attendance, date, onChange }: iProps) => {
  const [todaysAttendance, setTodaysAttendance] = React.useState<
    iAttendance | undefined
  >(attendance);
  const ableToMarkAttendance =
    !todaysAttendance || todaysAttendance.status === AttendanceStatus.Absent;
  const ableToCheckout =
    todaysAttendance &&
    !todaysAttendance.checkOut &&
    todaysAttendance.status !== AttendanceStatus.Absent;
  const isTimeApplicable = !!handleAttendanceStatus(user.shift);
  const [openMarkAttendanceModal, setOpenMarkAttendanceModal] = React.useState(
    !!localStorage.getItem(autoOpenAttendanceModalKey) &&
      !todaysAttendance &&
      getJUser()!._id === user._id &&
      isTimeApplicable
  );
  const [openCheckoutModal, setOpenCheckoutModal] = React.useState(false);

  function handleChange(a: iAttendance) {
    setTodaysAttendance(a);
    onChange && onChange(a);
  }

  useEffect(() => {
    setTodaysAttendance(attendance);
  }, [attendance]);

  if (!isTimeApplicable) return null;

  return (
    <>
      {ableToMarkAttendance && (
        <>
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              borderRadius: '10px',
            }}
            onClick={() => setOpenMarkAttendanceModal(true)}
          >
            Mark Attendance
          </Button>

          <MarkAttendanceModal
            user={user}
            date={date}
            state={[openMarkAttendanceModal, setOpenMarkAttendanceModal]}
            onMark={handleChange}
            attendence={attendance}
          />
        </>
      )}

      {ableToCheckout && (
        <>
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              borderRadius: '10px',
            }}
            onClick={() => setOpenCheckoutModal(true)}
          >
            Check out
          </Button>
          <MarkCheckoutTimeModal
            attendence={todaysAttendance}
            state={[openCheckoutModal, setOpenCheckoutModal]}
            onMark={handleChange}
          />
        </>
      )}
    </>
  );
};

export default CheckInCheckOut;

interface iProps {
  user: jUser;
  date: Date;
  attendance: iAttendance;
  onChange?: (a: iAttendance) => void;
}
