import { Box, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import DateBar from '../../../components/reports/DateBar';
import { InterviewReports } from '../../../components/reports/InterviewReports';
import { MarketingReports } from '../../../components/reports/MarketingReports';
import { SupportReports } from '../../../components/reports/SupportReports';
import { dateFormate } from '../../../components/constants';

export type TabTypes = 'support' | 'marketing' | 'interview';

export default function Reports() {
  const [values, setValues] = useState({
    fromDate: undefined,
    toDate: undefined,
  });

  const [metaText, setMetaText] = useState('');
  const [error, setError] = useState(false);

  const tabs: TabTypes[] = ['support', 'marketing', 'interview'];
  const [tab, setTab] = useState(0);

  const addValue = (key: any, newValue: any) => {
    if (key === 'fromDate' || key === 'toDate') {
      newValue = newValue ? dayjs(newValue).format(dateFormate) : null;
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
    setError(false);
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
              aria-label="Reports tabs"
            >
              {tabs.map((t, i) => (
                <Tab key={i} label={t} {...a11yProps(i)} />
              ))}
            </Tabs>
          </Box>
          {tabs.map((t, i) => {
            return (
              <CustomTabPanel key={i} value={tab} index={i}>
                <DateBar
                  metaText={error ? '___-__-___' : metaText}
                  {...values}
                  addValue={addValue}
                />
                {!error && (
                  <>
                    {dayjs(values.fromDate).isValid() &&
                    dayjs(values.toDate).isValid() ? (
                      <>
                        {t === 'support' && (
                          <SupportReports
                            setError={setError}
                            setMetaText={setMetaText}
                            {...values}
                          />
                        )}
                        {t === 'interview' && (
                          <InterviewReports
                            setError={setError}
                            setMetaText={setMetaText}
                            {...values}
                          />
                        )}
                        {t === 'marketing' && (
                          <MarketingReports
                            setError={setError}
                            setMetaText={setMetaText}
                            {...values}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Box sx={{ textAlign: 'center', color: 'red', py: 10 }}>
                          <p>Please ensure that dates are valid</p>
                        </Box>
                      </>
                    )}
                  </>
                )}

                {error && (
                  <Box sx={{ textAlign: 'center', color: 'red', py: 10 }}>
                    <p>Something went wrong</p>
                  </Box>
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
