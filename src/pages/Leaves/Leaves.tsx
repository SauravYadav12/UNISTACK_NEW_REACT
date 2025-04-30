import React, { useState } from 'react';
import ApplyLeave from '../../components/leave/ApplyLeave';
import { Box, Button, Grid, IconButton, Modal } from '@mui/material';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import RecentLeaveApplicationStatus from '../../components/leave/RecentLeaveApplicationStatus';
import { Sync } from '@mui/icons-material';
import LeavesSummery from './LeavesSummery';

const Leaves = () => {
  const [applyLeaveModal, setApplyLeaveModal] = useState(false);
  return (
    <>
      <Grid container spacing={3}>
        <Grid
          item
          container
          sm={12}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <h3 style={{ margin: 0, paddingLeft: '10px' }}>My Leaves</h3>
          <span>
            <Button
              style={{ borderRadius: '10px' }}
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setApplyLeaveModal(true)}
            >
              Apply
            </Button>
            <IconButton onClick={() => {}} disabled={false} sx={{ ml: 1 }}>
              <Sync
                className={false ? 'sync-icon-loading' : ''}
                color="primary"
              />
            </IconButton>
          </span>
        </Grid>
        <Grid item xs={12} lg={6}>
          <LeavesSummery />
        </Grid>
        <Grid item xs={12} lg={6} pt={0}>
          <RecentLeaveApplicationStatus />
        </Grid>
      </Grid>
      <Box sx={{ py: 1, my: 2 }}>
        <ChartCardWrapper title="Leave History">
          <LeaveHistoryTable />
        </ChartCardWrapper>
      </Box>

      <Modal
        open={applyLeaveModal}
        onClose={() => setApplyLeaveModal(false)}
        sx={{
          mx: 5,
          my: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '& .css-19i2hl5-MuiPaper-root-MuiCard-root': {
            width: 'fit-content !important',
            height: 'fit-content !important',
            maxWidth: '850px',
          },
        }}
      >
        <>
          <ApplyLeave />
        </>
      </Modal>
    </>
  );
};

export default Leaves;
