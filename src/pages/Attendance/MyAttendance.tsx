import { getJUser } from '../../utils/utils';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import DailyAttendanceTable from '../../components/attendance/DailyAttendanceTable';
import CheckInCheckOut from '../../components/attendance/CheckInCheckOut';
import { iAttendance } from '../../Interfaces/iUser';
import { useAttendance } from '../../hooks/attendanceHook';

import SyncIcon from '@mui/icons-material/Sync';
import { useState } from 'react';
import { dateByUserShift } from '../../utils/dateUtil';

const MyAttendance = () => {
  const me = getJUser()!;
  const myAttendanceState = useAttendance({
    users: [me],
  });
  const { loading, error, attendance, setResults, loadData } =
    myAttendanceState;

  const dateState = useState(new Date(dateByUserShift(me.shift)));

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  if (loading)
    return (
      <Box height={100} className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography color="error">{error}</Typography>
        <IconButton onClick={loadData}>
          <SyncIcon color="primary" />
        </IconButton>
      </div>
    );
  }

  return (
    <>
      <Box sx={{ py: 1, my: 2 }}>
        <ChartCardWrapper
          title={'Daily Attendance'}
          action={
            <Box>
              <CheckInCheckOut
                user={me}
                date={dateState[0]}
                onChange={handleChange}
                attendance={attendance[0]}
              />
            </Box>
          }
        >
          <DailyAttendanceTable
            dateState={dateState}
            onChange={handleChange}
            users={[me]}
            attendanceState={myAttendanceState}
            forEmployee
          />
        </ChartCardWrapper>
      </Box>
    </>
  );
};

export default MyAttendance;
