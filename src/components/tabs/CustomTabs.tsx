import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Interviews from '../../pages/Marketing/Interviews/Interviews';
import { useSearchParams } from 'react-router-dom';
import { InterviewStatus } from '../../Interfaces/reports';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export default function ListTabs() {
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
    const i = tabs.findIndex((t) => t.status === interviewStatus);
    if (i >= 1) {
      setValue(i);
    }
  }, []);
  return (
    <Box sx={{ width: '100%' }}>
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
        return (
          <CustomTabPanel key={i} value={value} index={i}>
            <Interviews
              query={t.status || ''}
              label={t.label + ' Interviews'}
            />
          </CustomTabPanel>
        );
      })}
    </Box>
  );
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
