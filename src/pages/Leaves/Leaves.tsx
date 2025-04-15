import React from 'react';
import ApplyLeave from '../../components/leave/ApplyLeave';
import { Box, Grid } from '@mui/material';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import RecentLeaveApplicationStatus from '../../components/leave/RecentLeaveApplicationStatus';

const Leaves = () => {
  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <ApplyLeave />
        </Grid>
        <Grid item xs={12} lg={4} pt={0}>
          <RecentLeaveApplicationStatus />
        </Grid>
      </Grid>
      <Box sx={{ py: 1, my: 2 }}>
        <ChartCardWrapper title="Leave History">
          <LeaveHistoryTable />
        </ChartCardWrapper>
      </Box>
    </>
  );
};

export default Leaves;
