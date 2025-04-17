import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Interviews from '../../pages/Marketing/Interviews/Interviews';
import { useSearchParams } from 'react-router-dom';
import { InterviewStatus } from '../../Interfaces/reports';
import { createInterviewQueryParam } from '../../pages/Marketing/Interviews/interviewValues';

export default function InterviewTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [archive, setArchive] = useState(false);
  const [value, setValue] = useState(0);
  const tabs: { label: string; status?: InterviewStatus }[] = [
    {
      label: 'Confirmed',
      status: 'Interview Confirm',
    },
    {
      label: 'Completed',
      status: 'Interview Completed',
    },
    {
      label: 'Tentative',
      status: 'Interview Tentative',
    },
    {
      label: 'Re-Scheduled',
      status: 'Interview Re-Scheduled',
    },
    {
      label: 'Cancelled',
      status: 'Interview Cancelled',
    },
    {
      label: 'All',
    },
  ];
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    searchParams.toString().length && setSearchParams({});
  };

  React.useEffect(() => {
    const interviewStatus = searchParams.get('interviewStatus');
    if (searchParams.toString().length && !interviewStatus) {
      setValue(tabs.length - 1);
      return;
    }
    const i = tabs.findIndex((t) => t.status === interviewStatus);
    if (i >= 1) {
      setValue(i);
    }
  }, []);
  return (
    <Box display={'flex'} flexDirection={'column'} height={'100%'}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          sx={{
            '& .MuiTabs-scroller':{
              overflowX:'auto !important',
              scrollbarWidth:'thin'
            }
          }}
        >
          {tabs.map((t, i) => {
            return <Tab key={i} label={t.label} {...a11yProps(i)} />;
          })}
        </Tabs>
      </Box>
      {tabs.map((t, i) => {
        if (value !== i) return null;
        const myParams = new URLSearchParams(searchParams);
        myParams.delete(createInterviewQueryParam);
        const p = myParams.toString();
        const query = p.length
          ? p
          : t.status
          ? `interviewStatus=${t.status}`
          : '';
        return (
          <div key={i} style={{ flex: 1, minHeight: '300px' }}>
            <Interviews
              query={query}
              label={t.label + ' Interviews'}
              archiveState={[archive, setArchive]}
            />
          </div>
        );
      })}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
