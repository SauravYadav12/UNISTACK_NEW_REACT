import { Box, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import DateBar from '../../../components/reports/DateBar';
import {
  InterviewReports,
  MarketingReports,
  SupportReports,
} from '../../../components/reports/MyReports';

export type TabTypes = 'support' | 'marketing' | 'interview';

export default function Reports() {
  const [values, setValues] = useState({
    fromDate: undefined,
    toDate: undefined,
  });

  const [metaText, setMetaText] = useState('');

  const tabs: TabTypes[] = ['support', 'marketing', 'interview'];
  const [tab, setTab] = useState(0);

  const addValue = (key: any, newValue: any) => {
    if (key === 'fromDate' || key === 'toDate') {
      newValue = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
    }
    setValues((prevValues) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  useEffect(() => {
    if (!dayjs(values.fromDate).isValid() || !dayjs(values.toDate).isValid()) {
      setMetaText('Invalid Dates');
    } else {
      setMetaText('Loading');
    }
  }, [values, tab]);

  useEffect(() => {
    addValue('fromDate', new Date());
    addValue('toDate', new Date());
  }, []);
  return (
    <>
      <div style={{ marginRight: 25 }}>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tab}
              onChange={(v, t) => setTab(t)}
              aria-label="basic tabs example"
            >
              {tabs.map((t, i) => (
                <Tab key={i} label={t} {...a11yProps(i)} />
              ))}
            </Tabs>
          </Box>
          {tabs.map((t, i) => {
            return (
              <CustomTabPanel key={i} value={tab} index={i}>
                <DateBar metaText={metaText} {...values} addValue={addValue} />
                {dayjs(values.fromDate).isValid() &&
                dayjs(values.toDate).isValid() ? (
                  <>
                    {t === 'support' && (
                      <SupportReports setMetaText={setMetaText} {...values} />
                    )}
                    {t === 'interview' && (
                      <InterviewReports setMetaText={setMetaText} {...values} />
                    )}
                    {t === 'marketing' && (
                      <MarketingReports setMetaText={setMetaText} {...values} />
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ textAlign: 'center', color: 'red' }}>
                      <p>Please ensure that dates are valid</p>
                    </Box>
                  </>
                )}
              </CustomTabPanel>
            );
          })}
        </Box>
      </div>
    </>
  );
}

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
