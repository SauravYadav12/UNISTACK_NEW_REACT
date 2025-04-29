import React, { useEffect } from 'react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { iAttendance, UserRole } from '../../Interfaces/iUser';
import { dateByUserShift } from '../../utils/dateUtil';
import CheckInCheckOut from '../attendance/CheckInCheckOut';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { Box } from '@mui/material';
import { Moment } from 'moment';

const AttendancePopUp = () => {
  const dateState = React.useState<Moment>();
  const { myAttendanceState, iUser, isModuleAllowed } = useAuth();
  const me = iUser;

  const { loading, error, attendance, setResults } = myAttendanceState;

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  useEffect(() => {
    me?.shift && dateState[1](dateByUserShift(me.shift));
  }, [me?.shift]);

  if (
    !isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Attendance)
    ) ||
    me?.role === UserRole['super-admin']
  ) {
    return null;
  }

  if (loading || error || !me || !dateState[0]) return null;

  return (
    <Box sx={{ flexGrow: 0, marginRight: '20px' }}>
      <CheckInCheckOut
        buttonSize="small"
        allowAutomaticPopUp
        user={me}
        date={dateState[0]}
        onChange={handleChange}
        attendance={attendance[0]}
      />
    </Box>
  );
};

export default AttendancePopUp;
