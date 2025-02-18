import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Interviews from '../../pages/Marketing/Interviews/Interviews';
import { useSearchParams } from 'react-router-dom';
import { InterviewStatus } from '../../Interfaces/reports';

export default function InterviewTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = React.useState(0);
  const tabs: { label: string; status?: InterviewStatus }[] = [
    {
      label: 'Confirmed',
      status: 'Interview Confirm',
    },
    {
      label: 'Tentative',
      status: 'Interview Tentative',
    },
    {
      label: 'Completed',
      status: 'Interview Completed',
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
        >
          {tabs.map((t, i) => {
            return <Tab key={i} label={t.label} {...a11yProps(i)} />;
          })}
        </Tabs>
      </Box>
      {tabs.map((t, i) => {
        if (value !== i) return null;
        const myParams = new URLSearchParams(searchParams);
        myParams.delete('createInterviewByReq');
        const p = myParams.toString();
        const query = p.length
          ? p
          : t.status
          ? `interviewStatus=${t.status}`
          : '';
        return (
          <div key={i} style={{ flex: 1 }}>
            <Interviews query={query} label={t.label + ' Interviews'} />
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
