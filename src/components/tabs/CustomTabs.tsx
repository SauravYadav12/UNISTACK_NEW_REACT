import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Interviews from '../../pages/Marketing/Interviews/Interviews';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

export default function ListTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Confirmed" {...a11yProps(0)} />
          <Tab label="Tentative" {...a11yProps(1)} />
          <Tab label="Completed " {...a11yProps(2)} />
          <Tab label="Cancelled " {...a11yProps(3)} />
          <Tab label="All Interviews" {...a11yProps(4)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        {/* Confirmed Interviews */}
        <Interviews
          query={'Interview Confirm'}
          label={'Confirmed Interviews'}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        {/* Tentative Interviews */}
        <Interviews
          query={'Interview Tentative'}
          label={'Tentative Interviews'}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        {/* Completed Interviews */}
        <Interviews
          query={'Interview Completed'}
          label={'Completed Interviews'}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        {/* Cancelled Interviews */}
        <Interviews
          query={'Interview Cancelled'}
          label={'Cancelled Interviews'}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        <Interviews query={''} label={'All Interviews'} />
      </CustomTabPanel>
    </Box>
  );
}
