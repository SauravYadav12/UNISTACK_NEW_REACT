import React, { useEffect } from 'react';
import {
  AttendanceStatus,
  iAttendance,
  iUser,
  UserRole,
  UserShift,
} from '../../Interfaces/iUser';
import { Box, Button, Chip, Tooltip } from '@mui/material';
import { IconLogin2, IconLogout2 } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import MarkAttendanceModal from '../dashboard/MarkAttendanceModal';
import MarkCheckoutTimeModal from '../dashboard/MarkCheckoutTimeModal';
import {
  getOfficeStartTime,
  getAttendanceStatus,
  notApplicableThresholdMinutes,
  timeZoneKeyByUserShift,
  dateByUserShift,
  TimeZone,
} from '../../utils/dateUtil';
import moment, { Moment } from 'moment';
import mz from 'moment-timezone';
import { dateFormate, timeFormate } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';

// localStorage key, scoped per-day in EST, used as a "we've already auto-
// opened the check-in modal today" guard so a page reload during the
// 9:00–9:15 AM EST window doesn't keep re-popping the modal.
function autoOpenKeyForToday(): string {
  const today = mz().tz(TimeZone.EST).format('YYYY-MM-DD');
  return `attendance:autoOpened:${today}`;
}

/**
 * Should the modal auto-pop for this user right now?
 *
 * Conditions (all must hold):
 *   1. User's shift is US (per product requirement — IST shift users do
 *      not get the morning popup).
 *   2. User is NOT admin or super-admin (the popup is for employees only;
 *      leadership uses other tools).
 *   3. Current time in `America/New_York` is between 09:00 and 09:15 AM,
 *      inclusive on the lower bound and exclusive on the upper.
 *   4. The user has no attendance record for today yet (or it's Absent).
 *   5. We haven't already auto-opened the modal today (per-day guard).
 *
 * Returns false for everyone else. The "Mark Attendance" button stays
 * visible regardless — this only governs the automatic popup.
 */
function shouldAutoPopForCheckIn(
  user: iUser,
  todaysAttendance: iAttendance | undefined,
  showMarkAttendance: boolean,
): boolean {
  if (user.shift !== UserShift.US) return false;
  if (
    user.role?.includes(UserRole['super-admin']) ||
    user.role?.includes(UserRole.admin)
  ) {
    return false;
  }
  if (!showMarkAttendance) return false;
  if (todaysAttendance && todaysAttendance.status !== AttendanceStatus.Absent) {
    return false;
  }
  const estNow = mz().tz(TimeZone.EST);
  const startMinute = estNow.hour() * 60 + estNow.minute();
  // 09:00 inclusive → 09:15 exclusive. Outside this window, do not auto-pop.
  if (startMinute < 9 * 60 || startMinute >= 9 * 60 + 15) return false;
  if (localStorage.getItem(autoOpenKeyForToday())) return false;
  return true;
}

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

  // "Forgot to check out yesterday" is intentionally NOT a blocker here —
  // `showMarkAttendance` looks at TODAY's record only. If the user has a
  // dangling yesterday record (checkIn set, checkOut null), today's record
  // is still absent and this evaluates `true`, so today's check-in popup
  // fires as expected at 9:00 AM EST.
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
      iUser!._id === user._id &&
      shouldAutoPopForCheckIn(user, todaysAttendance, showMarkAttendance) &&
      !disableMarkAttendance,
  );

  // Poll once a minute while mounted so the popup fires the moment we cross
  // 09:00 AM EST — handles the common case where the user already had the
  // app open before the window started.
  useEffect(() => {
    if (!allowAutomaticPopUp) return;
    if (iUser?._id !== user._id) return;
    const tick = () => {
      if (openMarkAttendanceModal) return;
      if (
        shouldAutoPopForCheckIn(user, todaysAttendance, showMarkAttendance) &&
        !disableMarkAttendance
      ) {
        setOpenMarkAttendanceModal(true);
        // Mark the per-day guard immediately so a quick re-render or a sibling
        // mount of this component doesn't double-pop.
        localStorage.setItem(autoOpenKeyForToday(), 'true');
      }
    };
    const id = setInterval(tick, 60_000);
    // Also run once on mount in case we already crossed the window threshold
    // (e.g. user kept the tab open overnight and is opening it at 09:05 AM).
    tick();
    return () => clearInterval(id);
  }, [
    allowAutomaticPopUp,
    iUser?._id,
    user._id,
    user.shift,
    user.role,
    todaysAttendance?.status,
    todaysAttendance?.checkIn,
    showMarkAttendance,
    disableMarkAttendance,
    openMarkAttendanceModal,
  ]);

  // Any time the auto-popup opens (initial state OR polling), mark the
  // per-day guard so a re-mount or sibling render doesn't repop. The key
  // expires naturally at midnight EST (it's date-scoped).
  useEffect(() => {
    if (openMarkAttendanceModal && allowAutomaticPopUp) {
      localStorage.setItem(autoOpenKeyForToday(), 'true');
    }
  }, [openMarkAttendanceModal, allowAutomaticPopUp]);

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

  // Shared button style — matches the brand pink/blue gradient used across
  // the system (PerformancePage actions, AssignRequirementDrawer self-assign,
  // etc.) so the navbar check-in / check-out affordance reads as a
  // first-class action instead of the tiny xx-small chip it used to be.
  const brandButtonSx = {
    textTransform: 'none' as const,
    borderRadius: 2,
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
    fontSize: buttonSize === 'small' ? '0.78rem' : '0.86rem',
    background: tokens.gradients.pinkBlue,
    boxShadow: 'none',
    color: '#fff',
    '&:hover': {
      background: tokens.gradients.pinkBlue,
      filter: 'brightness(1.08)',
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      background: 'rgba(3, 40, 64, 0.08)',
      color: 'rgba(3, 40, 64, 0.4)',
    },
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
                size={buttonSize}
                startIcon={<IconLogin2 size={16} />}
                sx={{ ...brandButtonSx, minWidth: 'max-content' }}
                onClick={() =>
                  !disableMarkAttendance && setOpenMarkAttendanceModal(true)
                }
                disabled={disableMarkAttendance}
              >
                Check In
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
            size={buttonSize}
            startIcon={<IconLogout2 size={16} />}
            sx={{ ...brandButtonSx, minWidth: 'max-content' }}
            onClick={() => setOpenCheckoutModal(true)}
          >
            Check Out
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
