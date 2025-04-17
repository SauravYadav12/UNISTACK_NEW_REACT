import React, { useEffect } from 'react';
import { AttendanceStatus, iAttendance, jUser } from '../../Interfaces/iUser';
import { Box, Button, Tooltip } from '@mui/material';
import MarkAttendanceModal, {
  autoOpenAttendanceModalKey,
} from '../dashboard/MarkAttendanceModal';
import MarkCheckoutTimeModal from '../dashboard/MarkCheckoutTimeModal';
import {
  getOfficeStartTime,
  handleAttendanceStatus,
  notApplicableThresholdMinutes,
  timeZoneKeyByUserShift,
} from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';
import moment, { Moment } from 'moment';
import { dateFormate, timeFormate } from '../constants';

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

  const showMarkAttendance =
    !todaysAttendance || todaysAttendance.status === AttendanceStatus.Absent;

  const disableMarkAttendance =
    !handleAttendanceStatus(user.shift) && !forAdmin;

  const showCheckout =
    todaysAttendance &&
    !todaysAttendance.checkOut &&
    todaysAttendance.status !== AttendanceStatus.Absent;

  const [openMarkAttendanceModal, setOpenMarkAttendanceModal] = React.useState(
    !!allowAutomaticPopUp &&
      !!localStorage.getItem(autoOpenAttendanceModalKey) &&
      showMarkAttendance &&
      !disableMarkAttendance &&
      getJUser()!._id === user._id
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
    borderRadius: '10px',
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
                sx={bStyle}
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
