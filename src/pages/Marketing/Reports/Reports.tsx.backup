import { Box, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import DateBar from '../../../components/reports/DateBar';
import { InterviewReports } from '../../../components/reports/InterviewReports';
import { MarketingReports } from '../../../components/reports/MarketingReports';
import { SupportReports } from '../../../components/reports/SupportReports';
import { dateFormate } from '../../../components/constants';
import {
  InterviewReport,
  MarketingReport,
  SupportReport,
} from '../../../Interfaces/reports';
import {
  getInterviewReport,
  getMarketingReport,
  getSupportReport,
} from '../../../services/reportsApi';

import SyncIcon from '@mui/icons-material/Sync';
type MyReport = SupportReport | InterviewReport | MarketingReport;
export type TabTypes = 'support' | 'marketing' | 'interview';

export default function Reports() {
  const [report, setReport] = useState<MyReport[]>();
  const [dates, setDates] = useState({
    fromDate: dayjs(new Date()).format(dateFormate),
    toDate: dayjs(new Date()).format(dateFormate),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metaText, setMetaText] = useState('');
  const isDatesValid =
    dayjs(dates.fromDate).isValid() && dayjs(dates.toDate).isValid();
  const tabs: TabTypes[] = ['support', 'marketing', 'interview'];
  const [tab, setTab] = useState(0);

  const onDateChange = (key: string, newValue: Date | null | string) => {
    newValue = newValue ? dayjs(newValue).format(dateFormate) : null;
    setDates((prevValues) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  const loadReport = async () => {
    if (!isDatesValid) {
      setMetaText('Invalid Dates');
      setError('Invalid Dates');
      return;
    }
    try {
      const { fromDate, toDate } = dates;
      const currentTab = tabs[tab];
      setError('');
      setLoading(true);
      setMetaText('Loading');
      if (currentTab === 'support') {
        const { data } = await getSupportReport(fromDate, toDate);
        const totalPosition = data.data?.reduce((sum, report) => {
          return sum + (report.totalPositions || 0);
        }, 0);
        setReport(data.data);
        setMetaText(`Total Position: ${totalPosition || 0}`);
      } else if (currentTab === 'marketing') {
        const { data } = await getMarketingReport(fromDate, toDate);
        setReport(data.data);
        const totalAssigned = data.data?.reduce((sum, report) => {
          return sum + (report.totalAssigned || 0);
        }, 0);
        setMetaText(`Total Assigned: ${totalAssigned || 0} `);
      } else if (currentTab === 'interview') {
        const { data } = await getInterviewReport(fromDate, toDate);
        setReport(data.data?.report);
        setMetaText(`Total Interviews: ${data.data?.totalInterviews || 0}`);
      }
    } catch (error) {
      setError('Failed to load');
      setMetaText('Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dates, tab]);

  return (
    <>
      <div style={{ marginRight: 25 }}>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tab}
              onChange={(v, t) => setTab(t)}
              aria-label="Reports tabs"
              sx={{
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                  scrollbarWidth: 'thin',
                },
              }}
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
                  metaText={!isDatesValid ? '___-__-___' : metaText}
                  {...dates}
                  loading={loading}
                  onDateChange={onDateChange}
                  reload={isDatesValid ? loadReport : undefined}
                />
                {!error ? (
                  <>
                    {t === 'support' && (
                      <SupportReports
                        report={report}
                        {...dates}
                        loading={loading}
                      />
                    )}
                    {t === 'interview' && (
                      <InterviewReports
                        report={report}
                        {...dates}
                        loading={loading}
                      />
                    )}
                    {t === 'marketing' && (
                      <MarketingReports
                        report={report}
                        {...dates}
                        loading={loading}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                      <Typography color="error">{error}</Typography>
                      {isDatesValid && (
                        <IconButton onClick={loadReport}>
                          <SyncIcon color="primary" />
                        </IconButton>
                      )}
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
