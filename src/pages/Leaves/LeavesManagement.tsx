import {
  Box,
  Tabs,
  Tab,
  Select,
  IconButton,
  MenuItem,
  CircularProgress,
  Typography,
  Grid,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import { Sync } from '@mui/icons-material';
import { useFetchData } from '../../hooks/fetchDataHook';
import { usersList } from '../../services/authApi';
import { iUser } from '../../Interfaces/iUser';
import RecentLeaveApplicationStatus from '../../components/leave/RecentLeaveApplicationStatus';
import LeavesChart from './LeavesChart';

type iTabs = (LeaveStatus | 'All')[];

const LeavesManagement = () => {
  const usersState = useFetchData<iUser[]>(async () => {
    const { data } = await usersList(`active=true`);
    return data.users || [];
  }, []);
  const [selectedUser, setSelectedUser] = useState<iUser>();
  const tabs: iTabs = [LeaveStatus.Approved, LeaveStatus.Rejected, 'All'];
  const [tab, setTab] = useState(tabs[0]);

  useEffect(() => {
    const { data } = usersState;
    data?.length && setSelectedUser(data[0]);
  }, [usersState.data]);

  if (usersState.loading)
    return (
      <Box height={100} className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );
  if (usersState.error) {
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
        <Typography color="error">{usersState.error}</Typography>
        <IconButton onClick={usersState.loadData}>
          <Sync color="primary" />
        </IconButton>
      </div>
    );
  }
  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <LeavesChart employees={usersState.data || []} />
        </Grid>
        <Grid item xs={12} lg={4} pt={0}>
          <RecentLeaveApplicationStatus />
        </Grid>
      </Grid>

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
            value={selectedUser?._id || ''}
            size="small"
            onChange={(e) => {
              const selected = usersState.data?.find(
                (u) => u._id === e.target.value
              )!;
              setSelectedUser(selected);
            }}
          >
            {usersState.data?.map((o, i) => {
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
            <Box sx={{ height: 'fit-content', display: 'flex', columnGap: 2 }}>
              {/* <AttendanceExportModal
                open={exportModal}
                onOpen={() => setExportModal(true)}
                onClose={() => setExportModal(false)}
                users={users || []}
              /> */}
            </Box>
            <div>
              <IconButton onClick={() => {}}>
                <Sync color="primary" />
              </IconButton>
            </div>
          </Box>
        </Box>{' '}
      </Box>

      <Box display={'flex'} flexDirection={'column'} height={'100%'}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            aria-label="Leaves tabs"
          >
            {tabs.map((t, i) => {
              return <Tab value={t} key={i} label={t} {...a11yProps(i)} />;
            })}
          </Tabs>
        </Box>
        {tabs.map((t) => {
          if (tab !== t) return null;

          return (
            <Box sx={{ py: 1, my: 2 }} key={t}>
              <ChartCardWrapper title={`${tab} Leaves`}>
                <LeaveHistoryTable forAdmin />
              </ChartCardWrapper>
            </Box>
          );
        })}
      </Box>
    </>
  );
};

export default LeavesManagement;
function a11yProps(index: number) {
  return {
    id: `leaves-tab-${index}`,
    'aria-controls': `leaves-tabpanel-${index}`,
  };
}

enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}
