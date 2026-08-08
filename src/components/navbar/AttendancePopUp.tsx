import React, { useEffect } from 'react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { AttendanceStatus, iAttendance, UserRole } from '../../Interfaces/iUser';
import { dateByUserShift } from '../../utils/dateUtil';
import CheckInCheckOut from '../attendance/CheckInCheckOut';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { Box } from '@mui/material';
import { Moment } from 'moment';
import { useCheckIn } from '../../contextProviders/CheckInProvider';

// Legacy 9AM auto-popup attendance modal. Kept as the primary check-in
// prompt for everyone. It no longer renders navbar buttons (the navbar's
// CheckInTimer owns those) — it only hosts the auto-popping
// MarkAttendanceModal. When the user checks in through it, we bridge into
// the CheckInSession system so the navbar flips to Check Out and the
// session lands in the super-admin log.
const AttendancePopUp = () => {
  const dateState = React.useState<Moment>();
  const { myAttendanceState, iUser, isModuleAllowed } = useAuth();
  const { syncCheckIn } = useCheckIn();
  const me = iUser;

  const { loading, error, attendance, setResults } = myAttendanceState;

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
    // Bridge: a fresh check-in (checkIn set, not yet checked out, not
    // Absent) should create/refresh the working-hours session so the
    // navbar timer starts and the log captures it.
    if (att.checkIn && !att.checkOut && att.status !== AttendanceStatus.Absent) {
      syncCheckIn();
    }
  }

  useEffect(() => {
    me?.shift && dateState[1](dateByUserShift(me.shift));
  }, [me?.shift]);

  if (
    !isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Attendance)
    ) ||
    me?.role.includes( UserRole['super-admin'])
  ) {
    return null;
  }

  if (loading || error || !me || !dateState[0]) return null;

  return (
    // No wrapper spacing / buttons — this only hosts the auto-popup modal.
    <CheckInCheckOut
      buttonSize="small"
      allowAutomaticPopUp
      renderButtons={false}
      user={me}
      date={dateState[0]}
      onChange={handleChange}
      attendance={attendance[0]}
    />
  );
};

export default AttendancePopUp;
