import { Box, Tabs, Tab } from '@mui/material';
import React, { useState } from 'react';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';

type iTabs = (LeaveStatus | 'All')[];

const LeavesManagement = () => {
  const tabs: iTabs = [...Object.values(LeaveStatus), 'All'];
  const [tab, setTab] = useState(tabs[0]);
  return (
    <>
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
                <LeaveHistoryTable />
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
