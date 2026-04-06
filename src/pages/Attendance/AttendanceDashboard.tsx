import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import AttendanceGridMonthly from '../../components/attendance/AttendanceGridMonthly';
import AttendanceSummary from '../../components/attendance/AttendanceSummary';
import { iAttendance, iUser, UserRole } from '../../Interfaces/iUser';
import { usersList } from '../../services/authApi';
import WeeklyAttendanceTable from '../../components/attendance/WeeklyAttendence';
import MonthlyAttendanceTable from '../../components/attendance/MonthlyAttendanceTable';
import DailyAttendanceTable from '../../components/attendance/DailyAttendanceTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import CheckInCheckOut from '../../components/attendance/CheckInCheckOut';
import { iUseAttendance, useAttendance } from '../../hooks/attendanceHook';
import { dateFormate } from '../../components/constants';
import { useFetchData } from '../../hooks/fetchDataHook';
import { Sync } from '@mui/icons-material';
import { dateByUserShift } from '../../utils/dateUtil';
import moment, { Moment, unitOfTime } from 'moment';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import UpcomingHolidays from '../../components/holiday/UpcomingHolidays';
import { AttendanceTopBar } from '../../components/attendance/AttendanceTopBar';

const AttendanceDashboard = () => {
  const usersListState = useFetchData<iUser[]>(fetchUsers, []);

  const { data: users, loading, error, loadData } = usersListState;

  async function fetchUsers() {
    const { data } = await usersList('active=true');
    const { users } = data;
    return (users as iUser[])?.filter(
      (u) => !u.role.includes(UserRole['super-admin'])
    );
  }

  if (loading)
    return (
      <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
        <CircularProgress />
      </Box>
    );
  if (error) {
    return (
      <Box textAlign={'center'}>
        <Typography color="error">{error}</Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box>
      {users?.length ? (
        <MyDashBoardComponent
          users={users}
          onReload={() => usersListState.loadData()}
        />
      ) : (
        <>
          <Typography textAlign={'center'}>No employees found</Typography>
          <Box textAlign={'center'}>
            <IconButton onClick={loadData}>
              <Sync color="primary" />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AttendanceDashboard;

interface MyDashBoardComponentProp {
  users: iUser[];
  onReload: () => void;
}

function MyDashBoardComponent({ users, onReload }: MyDashBoardComponentProp) {
  const { myAttendanceState, iUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<iUser>(users[0]);
  const currentUserTodaysAttendance = useAttendance(
    {
      users: [currentUser],
    },
    [currentUser]
  );

  const attendanceGridMonthlyDateState = useState(
    dateByUserShift(iUser!.shift)
  );
  const currentUserMonthlyAttendance = useAttendance(
    {
      users: [currentUser],
      fromDate: moment(attendanceGridMonthlyDateState[0])
        .startOf('month')
        .format(dateFormate),
      toDate: moment(attendanceGridMonthlyDateState[0])
        .endOf('month')
        .format(dateFormate),
    },
    [currentUser, attendanceGridMonthlyDateState[0]]
  );

  const userWiseAttendanceOptions = Object.values(AttendanceTableType);
  const [userWiseAttendanceOption, setUserWiseAttendanceOption] = useState(
    userWiseAttendanceOptions[0]
  );

  const optionBasedAttendanceDateState = useState(
    dateByUserShift(iUser!.shift)
  );

  const { fromDate, toDate } = iDates(optionBasedAttendanceDateState[0]);

  const usersWiseOptionBasedAttendance = useAttendance(
    {
      fromDate: fromDate.format(dateFormate),
      toDate: toDate.format(dateFormate),
    },
    [users, optionBasedAttendanceDateState[0]]
  );

  function iDates(date: Moment) {
    if (userWiseAttendanceOption === AttendanceTableType.Daily) {
      const d = moment(date);
      return { fromDate: d, toDate: d };
    }

    let unit: unitOfTime.Base = 'week';
    if (userWiseAttendanceOption === AttendanceTableType.Monthly) {
      unit = 'month';
    }

    const fromDate = moment(date).startOf(unit);
    const toDate = moment(date).endOf(unit);
    return { fromDate, toDate };
  }

  function handleChangeAttendance(att: iAttendance) {
    const updateState = (hook: iUseAttendance) => {
      const { setResults } = hook;
      setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
    };
    const states = [
      currentUserMonthlyAttendance,
      currentUserTodaysAttendance,
      usersWiseOptionBasedAttendance,
    ];
    if (myAttendanceState && att.userRef === iUser?._id) {
      states.push(myAttendanceState);
    }
    for (const hook of states) {
      updateState(hook);
    }
  }

  function handleDeleteAttendance(attendanceId: string) {
    const removeFromState = (hook: iUseAttendance) => {
      hook.setResults((pre) => pre.filter((i) => i._id !== attendanceId));
    };
    const states = [
      currentUserMonthlyAttendance,
      currentUserTodaysAttendance,
      usersWiseOptionBasedAttendance,
    ];
    if (myAttendanceState) {
      states.push(myAttendanceState);
    }
    for (const hook of states) {
      removeFromState(hook);
    }
  }

  function reload() {
    onReload();
    currentUserTodaysAttendance.loadData();
    currentUserMonthlyAttendance.loadData();
    usersWiseOptionBasedAttendance.loadData();
    myAttendanceState?.loadData();
  }

  useEffect(() => {
    optionBasedAttendanceDateState[1](
      iDates(dateByUserShift(iUser!.shift)).fromDate
    );
  }, [userWiseAttendanceOption]);

  useEffect(() => {
    setCurrentUser(users[0]);
  }, [users]);

  return (
    <>
      <AttendanceTopBar reload={reload} users={users} />
      <Divider sx={{ mt: 1 }} />
      <Box
        sx={{
          py: 1,
          my: 2,
          display: 'flex',
          rowGap: '15px',
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Select
            labelId="month-dd"
            id="month-dd"
            value={currentUser?._id}
            size="small"
            onChange={(e) => {
              const selected = users?.find((u) => u._id === e.target.value);
              selected && setCurrentUser(selected);
            }}
          >
            {users?.map((o, i) => {
              return (
                <MenuItem key={i} value={o._id}>
                  {o.firstName + ' ' + o.lastName}
                </MenuItem>
              );
            })}
          </Select>
        </Box>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              columnGap: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            {!currentUserTodaysAttendance.loading && (
              <CheckInCheckOut
                forAdmin
                user={currentUser}
                date={dateByUserShift(iUser!.shift)}
                attendance={currentUserTodaysAttendance.attendance[0]}
                onChange={handleChangeAttendance}
              />
            )}
          </Box>
        </Box>{' '}
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <AttendanceGridMonthly
            user={currentUser}
            attendanceState={currentUserMonthlyAttendance}
            dateState={attendanceGridMonthlyDateState}
            onAttendanceDeleted={handleDeleteAttendance}
          />
        </Grid>
        <Grid item xs={12} lg={4} pt={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <AttendanceSummary />
            </Grid>
            <Grid item xs={12}>
              <AttendanceSummary />
              {/* <MonthlyProgress /> */}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {users?.length && (
        <Box sx={{ py: 1, my: 2 }}>
          <UserWiseAttendanceList
            dateState={optionBasedAttendanceDateState}
            users={users}
            attendanceState={usersWiseOptionBasedAttendance}
            onChangeAttendance={handleChangeAttendance}
            onAttendanceDeleted={handleDeleteAttendance}
            onChangeOption={setUserWiseAttendanceOption}
            options={userWiseAttendanceOptions}
            selectedOption={userWiseAttendanceOption}
          />
        </Box>
      )}
      <Box sx={{ mb: 2 }}>
        <UpcomingHolidays forAdmin />
      </Box>
    </>
  );
}

interface UserWiseAttendanceListProps {
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  options: AttendanceTableType[];
  selectedOption: AttendanceTableType;
  onChangeOption: (option: AttendanceTableType) => void;
  users: iUser[];
  attendanceState: iUseAttendance;
  onChangeAttendance?: (a: iAttendance) => void;
  onAttendanceDeleted?: (attendanceId: string) => void;
}

function UserWiseAttendanceList({
  dateState,
  users,
  attendanceState,
  selectedOption,
  options,
  onChangeAttendance,
  onAttendanceDeleted,
  onChangeOption,
}: UserWiseAttendanceListProps) {
  return (
    <ChartCardWrapper
      title={selectedOption + ' ' + 'Attendance'}
      action={
        <Select
          value={selectedOption}
          size="small"
          onChange={(e) => {
            onChangeOption(e.target.value as AttendanceTableType);
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
        {selectedOption === AttendanceTableType.Daily && (
          <DailyAttendanceTable
            dateState={dateState}
            users={users || []}
            attendanceState={attendanceState}
            onChange={onChangeAttendance}
            onAttendanceDeleted={onAttendanceDeleted}
            forEmployee={false}
          />
        )}
        {selectedOption === AttendanceTableType.Weekly && (
          <WeeklyAttendanceTable
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee={false}
            onAttendanceDeleted={onAttendanceDeleted}
          />
        )}
        {selectedOption === AttendanceTableType.Monthly && (
          <MonthlyAttendanceTable
            users={users}
            attendanceState={attendanceState}
            dateState={dateState}
            forEmployee={false}
            onAttendanceDeleted={onAttendanceDeleted}
          />
        )}
      </>
    </ChartCardWrapper>
  );
}

export enum AttendanceTableType {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}
