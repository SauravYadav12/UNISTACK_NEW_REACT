import {
  Box,
  Typography,
  Stack,
  alpha,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import {
  IconReportAnalytics,
  IconHeadset,
  IconTargetArrow,
  IconCalendarEvent,
  IconAlertCircle,
  IconDownload,
} from '@tabler/icons-react';
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
import { tokens } from '../../../theme/theme';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';

type MyReport = SupportReport | InterviewReport | MarketingReport;
export type TabTypes = 'support' | 'marketing' | 'interview';

const MotionBox = motion.create(Box);

interface TabConfig {
  key: TabTypes;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    key: 'support',
    label: 'Support',
    icon: <IconHeadset size={16} />,
    color: tokens.colors.blue,
    gradient: 'linear-gradient(135deg, #37B7EA 0%, #1A9FD4 100%)',
    description: 'Positions entered by support team',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    icon: <IconTargetArrow size={16} />,
    color: tokens.colors.pink,
    gradient: tokens.gradients.pinkBlue,
    description: 'Positions assigned to marketers',
  },
  {
    key: 'interview',
    label: 'Interview',
    icon: <IconCalendarEvent size={16} />,
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4599 100%)',
    description: 'Interviews scheduled & status',
  },
];

export default function Reports() {
  const [report, setReport] = useState<MyReport[]>();
  const [dates, setDates] = useState({
    fromDate: dayjs(new Date()).format(dateFormate),
    toDate: dayjs(new Date()).format(dateFormate),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metaText, setMetaText] = useState('');
  const [activeTab, setActiveTab] = useState<TabTypes>('support');
  const [grandTotal, setGrandTotal] = useState(0);

  const isDatesValid =
    dayjs(dates.fromDate).isValid() && dayjs(dates.toDate).isValid();

  const onDateChange = (key: 'fromDate' | 'toDate', newValue: any) => {
    const formatted = newValue ? dayjs(newValue).format(dateFormate) : '';
    setDates((prev) => ({ ...prev, [key]: formatted }));
  };

  const loadReport = async () => {
    if (!isDatesValid) {
      setMetaText('Invalid dates');
      setError('Invalid dates');
      return;
    }
    try {
      const { fromDate, toDate } = dates;
      setError('');
      setLoading(true);
      setMetaText('Loading…');
      if (activeTab === 'support') {
        const { data } = await getSupportReport(fromDate, toDate);
        const totalPosition = data.data?.reduce(
          (sum, r) => sum + (r.totalPositions || 0),
          0
        );
        setReport(data.data);
        setGrandTotal(totalPosition || 0);
        setMetaText(`${totalPosition || 0} positions entered`);
      } else if (activeTab === 'marketing') {
        const { data } = await getMarketingReport(fromDate, toDate);
        setReport(data.data);
        const totalAssigned = data.data?.reduce(
          (sum, r) => sum + (r.totalAssigned || 0),
          0
        );
        setGrandTotal(totalAssigned || 0);
        setMetaText(`${totalAssigned || 0} positions assigned`);
      } else if (activeTab === 'interview') {
        const { data } = await getInterviewReport(fromDate, toDate);
        setReport(data.data?.report);
        setGrandTotal(data.data?.totalInterviews || 0);
        setMetaText(`${data.data?.totalInterviews || 0} interviews`);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load report');
      setMetaText('Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, activeTab]);

  const activeConfig = useMemo(
    () => TAB_CONFIGS.find((t) => t.key === activeTab) || TAB_CONFIGS[0],
    [activeTab]
  );

  const activeContributors = useMemo(() => (report || []).length, [report]);
  const avgPerPerson = activeContributors > 0 ? Math.round(grandTotal / activeContributors) : 0;

  return (
    <Box>
      {/* ── Hero banner ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
        }}
      >
        {/* orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: '25%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gradients.brand,
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={3}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconReportAnalytics size={26} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.05em', fontWeight: 600 }}
              >
                REPORTS INTELLIGENCE
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Team performance,{' '}
                <Box
                  component="span"
                  sx={{
                    background: activeConfig.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  at a glance
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65), mt: 0.5 }}>
                Leaderboards, conversion funnels, and drill-downs for every domain.
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Export (coming soon)">
              <span>
                <IconButton
                  disabled
                  sx={{
                    bgcolor: alpha('#fff', 0.1),
                    color: '#fff',
                    borderRadius: 2,
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: alpha('#fff', 0.18) },
                    '&.Mui-disabled': { color: alpha('#fff', 0.4) },
                  }}
                >
                  <IconDownload size={18} />
                </IconButton>
              </span>
            </Tooltip>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={22} sx={{ color: '#fff' }} />
              </Box>
            )}
          </Stack>
        </Stack>
      </MotionBox>

      {/* ── Segmented tab navigation ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          flexWrap: 'wrap',
          mb: 2.5,
          p: 0.75,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {TAB_CONFIGS.map((t) => {
          const active = activeTab === t.key;
          return (
            <motion.div
              key={t.key}
              whileHover={{ scale: active ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                onClick={() => setActiveTab(t.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab(t.key);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  px: 2.25,
                  py: 1,
                  borderRadius: 2.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: active ? t.gradient : 'transparent',
                  color: active ? '#fff' : 'text.secondary',
                  boxShadow: active ? `0 6px 16px ${alpha(t.color, 0.3)}` : 'none',
                  transition: 'all 0.25s ease',
                  '&:hover': !active
                    ? {
                        bgcolor: alpha(t.color, 0.08),
                        color: t.color,
                      }
                    : undefined,
                }}
              >
                {t.icon}
                {t.label}
              </Box>
            </motion.div>
          );
        })}
      </Box>

      {/* Description chip */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {activeConfig.description}
      </Typography>

      {/* ── Date filter bar ── */}
      <DateBar
        metaText={!isDatesValid ? 'Invalid dates' : metaText}
        {...dates}
        loading={loading}
        onDateChange={onDateChange}
        reload={isDatesValid ? loadReport : undefined}
      />

      {/* ── Summary strip ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: activeTab === 'interview' ? 'Interviews' : 'Positions',
            value: grandTotal,
            color: activeConfig.color,
          },
          {
            label: 'Contributors',
            value: activeContributors,
            color: tokens.colors.blue,
          },
          {
            label: 'Avg per person',
            value: avgPerPerson,
            color: tokens.colors.success,
          },
          {
            label: 'Range',
            value: dayjs(dates.toDate).diff(dayjs(dates.fromDate), 'day') + 1 || 0,
            suffix: ' days',
            color: tokens.colors.warning,
          },
        ].map((s) => (
          <Box
            key={s.label}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 3,
                bgcolor: s.color,
                opacity: 0.8,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: '0.04em', fontWeight: 600 }}
            >
              {s.label.toUpperCase()}
            </Typography>
            <AnimatedCounter
              value={s.value}
              suffix={s.suffix || ''}
              variant="h4"
              fontWeight={800}
              color="text.primary"
              sx={{ display: 'block', mt: 0.5, lineHeight: 1 }}
            />
          </Box>
        ))}
      </Box>

      {/* ── Main report body ── */}
      {error ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: alpha(tokens.colors.error, 0.2),
            borderRadius: 4,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha(tokens.colors.error, 0.08),
              color: tokens.colors.error,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <IconAlertCircle size={26} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="error.main">
            {error}
          </Typography>
          {isDatesValid && (
            <IconButton onClick={loadReport} sx={{ mt: 1 }}>
              <SyncIcon color="primary" />
            </IconButton>
          )}
        </Box>
      ) : (
        <>
          {activeTab === 'support' && (
            <SupportReports report={report as SupportReport[]} {...dates} loading={loading} />
          )}
          {activeTab === 'marketing' && (
            <MarketingReports report={report as MarketingReport[]} {...dates} loading={loading} />
          )}
          {activeTab === 'interview' && (
            <InterviewReports report={report as InterviewReport[]} {...dates} loading={loading} />
          )}
        </>
      )}
    </Box>
  );
}
