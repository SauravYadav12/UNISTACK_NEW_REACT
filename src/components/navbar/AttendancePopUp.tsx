import React, { useEffect } from 'react';
import moment from 'moment';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import { dateByUserShift } from '../../utils/dateUtil';
import MarkAttendanceModal from '../dashboard/MarkAttendanceModal';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { dateFormate } from '../constants';
import { useCheckIn } from '../../contextProviders/CheckInProvider';

// Auto-pop guard — once per calendar day. If the user closes the modal
// without checking in, they use the navbar Check In button instead of
// being re-nagged.
function popGuardKey(): string {
  return `checkin:autoPopped:${moment().format('YYYY-MM-DD')}`;
}

/**
 * The login-time check-in prompt. Pops the (legacy) MarkAttendanceModal
 * after login whenever the user has NO open working-hours session — any
 * day, any time, any shift (super-admins excluded). Confirming drives the
 * session check-in, so the navbar timer starts, the day is marked Present
 * (weekdays), and the session lands in the super-admin log.
 *
 * The navbar CheckInTimer button remains the always-visible fallback for
 * anyone who dismisses this modal.
 */
const AttendancePopUp = () => {
  const { iUser, isModuleAllowed } = useAuth();
  const { isCheckedIn, loading, doCheckIn } = useCheckIn();
  const me = iUser;
  const [open, setOpen] = React.useState(false);

  const allowed =
    !!me &&
    !me.role?.includes(UserRole['super-admin']) &&
    isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Attendance)
    );

  useEffect(() => {
    if (!allowed) return;
    if (loading) return; // wait until the session state resolves
    if (isCheckedIn) return; // already checked in → no prompt
    if (localStorage.getItem(popGuardKey())) return; // popped already today
    setOpen(true);
    localStorage.setItem(popGuardKey(), '1');
  }, [allowed, loading, isCheckedIn]);

  if (!allowed || !me) return null;

  return (
    <MarkAttendanceModal
      user={me}
      date={
        me.shift
          ? dateByUserShift(me.shift).format(dateFormate)
          : moment().format(dateFormate)
      }
      state={[open, setOpen]}
      forAdmin={false}
      sessionCheckIn={doCheckIn}
    />
  );
};

export default AttendancePopUp;
