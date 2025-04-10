import React, { useEffect } from 'react';
import { AttendanceStatus, iAttendance, jUser } from '../../Interfaces/iUser';
import { Button } from '@mui/material';
import MarkAttendanceModal, {
  autoOpenAttendanceModalKey,
} from '../dashboard/MarkAttendanceModal';
import MarkCheckoutTimeModal from '../dashboard/MarkCheckoutTimeModal';
import { handleAttendanceStatus } from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';
import { Moment } from 'moment';
import { dateFormate } from '../constants';

const CheckInCheckOut = ({
  user,
  attendance,
  date,
  allowAutomaticPopUp,
  buttonSize = 'medium',
  forAdmin = false,
  onChange,
}: iProps) => {
  const [todaysAttendance, setTodaysAttendance] = React.useState<
    iAttendance | undefined
  >(attendance);

  const ableToMarkAttendance =
    (!todaysAttendance ||
      todaysAttendance.status === AttendanceStatus.Absent) &&
    (!!handleAttendanceStatus(user.shift) || forAdmin);

  const ableToCheckout =
    todaysAttendance &&
    !todaysAttendance.checkOut &&
    todaysAttendance.status !== AttendanceStatus.Absent;

  const [openMarkAttendanceModal, setOpenMarkAttendanceModal] = React.useState(
    !!allowAutomaticPopUp &&
      !!localStorage.getItem(autoOpenAttendanceModalKey) &&
      ableToMarkAttendance &&
      getJUser()!._id === user._id
  );

  const [openCheckoutModal, setOpenCheckoutModal] = React.useState(false);

  function handleChange(a: iAttendance) {
    setTodaysAttendance(a);
    onChange && onChange(a);
  }

  useEffect(() => {
    setTodaysAttendance(attendance);
  }, [attendance]);

  const bStyle = {
    borderRadius: '10px',
    ...(buttonSize === 'small' && {
      '&.MuiButtonBase-root': {
        padding: '2px 4px',
        fontSize: 'xx-small',
        borderRadius: '4px',
      },
    }),
  };

  return (
    <>
      {ableToMarkAttendance && (
        <>
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={bStyle}
            onClick={() => setOpenMarkAttendanceModal(true)}
          >
            Mark Attendance
          </Button>

          <MarkAttendanceModal
            forAdmin={forAdmin}
            user={user}
            date={date.format(dateFormate)}
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
            sx={bStyle}
            onClick={() => setOpenCheckoutModal(true)}
          >
            Check out
          </Button>
          <MarkCheckoutTimeModal
            user={user}
            forAdmin={forAdmin}
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
  date: Moment;
  attendance: iAttendance;
  allowAutomaticPopUp?: boolean;
  buttonSize?: 'small' | 'medium';
  forAdmin?: boolean;
  onChange?: (a: iAttendance) => void;
}
