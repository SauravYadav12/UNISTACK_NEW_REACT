import { Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import LeaveHistoryTable from '../../components/leave/LeaveHistoryTable';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import { useSearchParams } from 'react-router-dom';

type iTabs = (LeaveStatus | 'All')[];

const LeavesManagement = () => {
  const [searchQuery, setSearchQuery] = useSearchParams();
  const id = searchQuery.get('id');
  const tabs: iTabs = ['All', ...Object.values(LeaveStatus)];
  const [tab, setTab] = useState(tabs[0]);

  function clearIdFromSearch() {
    if (!id) return;
    searchQuery.delete('id');
    setSearchQuery(new URLSearchParams(searchQuery));
  }

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
                <LeaveHistoryTable
                  defaultOpenLeaveId={id || undefined}
                  forAdmin
                  status={t === 'All' ? undefined : t}
                  onClose={clearIdFromSearch}
                />
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
