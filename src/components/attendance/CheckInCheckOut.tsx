import React, { useEffect } from 'react';
import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';
import { Box, Button, Chip, Tooltip } from '@mui/material';
import MarkAttendanceModal, {
  autoOpenAttendanceModalKey,
} from '../dashboard/MarkAttendanceModal';
import MarkCheckoutTimeModal from '../dashboard/MarkCheckoutTimeModal';
import {
  getOfficeStartTime,
  getAttendanceStatus,
  notApplicableThresholdMinutes,
  timeZoneKeyByUserShift,
} from '../../utils/dateUtil';
import moment, { Moment } from 'moment';
import { dateFormate, timeFormate } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';

const CheckInCheckOut = ({
  user,
  attendance,
  date,
  allowAutomaticPopUp,
  buttonSize = 'medium',
  forAdmin = false,
  onChange,
}: iProps) => {
  const { iUser } = useAuth();
  const [todaysAttendance, setTodaysAttendance] = React.useState<
    iAttendance | undefined
  >(attendance);

  // Sat/Sun are company-wide non-working days — no attendance is tracked.
  // Hide the Mark-Attendance affordance entirely so the UI matches the
  // server, which rejects weekend marks.
  const isWeekend = [0, 6].includes(date.day());

  const showMarkAttendance =
    !isWeekend &&
    (!todaysAttendance || todaysAttendance.status === AttendanceStatus.Absent);

  const disableMarkAttendance = !getAttendanceStatus(user) && !forAdmin;

  const showCheckout =
    todaysAttendance &&
    !todaysAttendance.checkOut &&
    todaysAttendance.status !== AttendanceStatus.Absent;

  const [openMarkAttendanceModal, setOpenMarkAttendanceModal] = React.useState(
    !!allowAutomaticPopUp &&
      !!localStorage.getItem(autoOpenAttendanceModalKey) &&
      showMarkAttendance &&
      !disableMarkAttendance &&
      iUser!._id === user._id
  );

  const [openCheckoutModal, setOpenCheckoutModal] = React.useState(false);

  function handleChange(a: iAttendance) {
    setTodaysAttendance(a);
    onChange && onChange(a);
  }

  function timeTitle() {
    const { h, m } = getOfficeStartTime(user.shift);
    const notApplicableThresholdHours = h + notApplicableThresholdMinutes / 60;
    const tz = timeZoneKeyByUserShift(user.shift);
    const from =
      moment().clone().hour(h).minute(m).format(timeFormate) + ' ' + tz;
    const to =
      moment()
        .clone()
        .hour(notApplicableThresholdHours)
        .minute(m)
        .format(timeFormate) +
      ' ' +
      tz;
    return from + ` to ` + to;
  }

  useEffect(() => {
    setTodaysAttendance(attendance);
  }, [attendance]);

  const bStyle = {
    // borderRadius: '10px',
    ...(buttonSize === 'small' && {
      '&.MuiButtonBase-root': {
        padding: '2px 4px',
        paddingTop: '3px',
        fontSize: 'xx-small',
        borderRadius: '4px',
      },
    }),
  };

  return (
    <>
      {isWeekend && !todaysAttendance && (
        <Chip
          label="Non-working day"
          size="small"
          sx={{
            bgcolor: 'rgba(3, 40, 64, 0.06)',
            color: '#5E7687',
            fontSize: '0.7rem',
            fontWeight: 600,
            height: 24,
          }}
        />
      )}
      {showMarkAttendance && (
        <>
          <Tooltip
            title={
              disableMarkAttendance && `You can mark between ${timeTitle()}.`
            }
            arrow
            placement="top"
          >
            <Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{...bStyle,minWidth:'max-content'}}
                onClick={() =>
                  !disableMarkAttendance && setOpenMarkAttendanceModal(true)
                }
                disabled={disableMarkAttendance}
              >
                Mark Attendance
              </Button>
            </Box>
          </Tooltip>

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

      {showCheckout && (
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
  user: iUser;
  date: Moment;
  attendance: iAttendance;
  allowAutomaticPopUp?: boolean;
  buttonSize?: 'small' | 'medium';
  forAdmin?: boolean;
  onChange?: (a: iAttendance) => void;
}
