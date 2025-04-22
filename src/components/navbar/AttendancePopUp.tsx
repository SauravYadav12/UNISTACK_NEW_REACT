import React from 'react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { iAttendance, UserRole } from '../../Interfaces/iUser';
import { dateByUserShift } from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';
import CheckInCheckOut from '../attendance/CheckInCheckOut';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { Box } from '@mui/material';

const AttendancePopUp = () => {
  const me = getJUser();
  const { myAttendanceState, isModuleAllowed } = useAuth();
  if (!myAttendanceState || !me) return null;
  const { loading, error, attendance, setResults } = myAttendanceState;

  const dateState = React.useState(dateByUserShift(me.shift));

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  if (loading || error) return null;

  if (
    !isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Attendance)
    ) ||
    me?.role === UserRole['super-admin']
  ) {
    return null;
  }

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
