import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
} from '@mui/material';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import DailyAttendanceTable from '../../components/attendance/DailyAttendanceTable';
import CheckInCheckOut from '../../components/attendance/CheckInCheckOut';
import { iAttendance, iUser } from '../../Interfaces/iUser';

import SyncIcon from '@mui/icons-material/Sync';
import { useEffect, useState } from 'react';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Moment, unitOfTime } from 'moment';
import MonthlyAttendanceTable from '../../components/attendance/MonthlyAttendanceTable';
import WeeklyAttendanceTable from '../../components/attendance/WeeklyAttendence';
import { useAttendance } from '../../hooks/attendanceHook';
import moment from 'moment';
import { dateFormate } from '../../components/constants';
import UpcomingHolidays from '../../components/holiday/UpcomingHolidays';

const MyAttendance = () => {
  const { myAttendanceState, iUser } = useAuth();
  const me = iUser!;
  const dateState = useState(dateByUserShift(me.shift));

  if (!myAttendanceState || myAttendanceState?.loading)
    return (
      <Box height={100} className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  const { error, attendance, setResults, loadData } = myAttendanceState;

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

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
      <Box
        sx={{
          py: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          rowGap: 2,
        }}
      >
        <ChartCardWrapper
          title={'Daily Attendance'}
          action={
            <Box
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
            >
              <CheckInCheckOut
                user={me}
                date={dateState[0]}
                onChange={handleChange}
                attendance={attendance[0]}
              />
              <IconButton onClick={loadData} sx={{ ml: 1 }}>
                <SyncIcon color="primary" />
              </IconButton>
            </Box>
          }
        >
          <DailyAttendanceTable
            tableContainerHeight={140}
            dateState={dateState}
            onChange={handleChange}
            users={[me]}
            attendanceState={myAttendanceState}
            forEmployee
          />
        </ChartCardWrapper>
        <MyAttendanceHistory users={[me]} />

        <UpcomingHolidays />
      </Box>
    </>
  );
};

export default MyAttendance;

enum AttendanceOption {
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}
interface MyAttendanceHistoryProps {
  users: iUser[];
}

function MyAttendanceHistory({ users }: MyAttendanceHistoryProps) {
  const { iUser } = useAuth();
  const options = Object.values(AttendanceOption);
  const [option, setOption] = useState(options[0]);

  const dateState = useState(dateByUserShift(iUser!.shift));

  const { fromDate, toDate } = iDates(dateState[0]);

  const attendanceState = useAttendance(
    {
      fromDate: fromDate.format(dateFormate),
      toDate: toDate.format(dateFormate),
      users,
    },
    [users, dateState[0]]
  );

  function iDates(date: Moment) {
    let unit: unitOfTime.Base = 'week';
    if (option === AttendanceOption.Monthly) {
      unit = 'month';
    }

    const fromDate = moment(date).startOf(unit);
    const toDate = moment(date).endOf(unit);
    return { fromDate, toDate };
  }

  useEffect(() => {
    dateState[1](iDates(dateByUserShift(iUser!.shift)).fromDate);
  }, [option]);

  return (
    <ChartCardWrapper
      title={option + ' ' + 'Attendance'}
      action={
        <Select
          value={option}
          size="small"
          onChange={(e) => {
            setOption(e.target.value as AttendanceOption);
          }}
        >
          {options.map((o, i) => {
            return (
              <MenuItem key={i} value={o}>
                {o}
              </MenuItem>
            );
          })}
        </Select>
      }
    >
      <>
        {option === AttendanceOption.Weekly && (
          <WeeklyAttendanceTable
            tableContainerHeight={140}
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee
          />
        )}
        {option === AttendanceOption.Monthly && (
          <MonthlyAttendanceTable
            tableContainerHeight={150}
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee
          />
        )}
      </>
    </ChartCardWrapper>
  );
}
