import { Box, Grid } from '@mui/material';
import {
  IconChartBar,
  IconMicrophone,
  IconUserCheck,
  IconBriefcase,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { DashboardReport } from '../../Interfaces/reports';
import { toast } from 'react-toastify';
import { getDashboardReport } from '../../services/reportsApi';
import { requirementCounts } from '../../services/requirementApi';
import { interviewsList } from '../../services/interviewApi';
import TodaysInterviews from '../../components/dashboard/TodaysInterviews';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import AiDailyBriefing from '../../components/dashboard/AiDailyBriefing';
import CommandHero from '../../components/dashboard/CommandHero';
import PulseStatCard from '../../components/dashboard/PulseStatCard';
import ActivityHeatmap from '../../components/dashboard/ActivityHeatmap';
import ConversionFunnel from '../../components/dashboard/ConversionFunnel';
import RequirementTrendChart from '../../components/dashboard/RequirementTrendChart';
import TeamHighlights from '../../components/dashboard/TeamHighlights';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { staggerContainer, staggerItem } from '../../theme/animations';
import { tokens } from '../../theme/theme';
import { UserRole, UserShift } from '../../Interfaces/iUser';
import { dateByUserShift } from '../../utils/dateUtil';
import UserDashboard from './UserDashboard';

const MotionBox = motion.create(Box);

function Dashboard() {
  const { iUser } = useAuth();

  // Plain users (no admin/hr/marketing/support/etc. role) get a minimal,
  // personal dashboard focused on their leave balance, upcoming time off,
  // and the next holiday — none of the recruitment operations surface.
  const isPlainUser =
    !!iUser &&
    !!iUser.role?.length &&
    iUser.role.every((r) => r === UserRole.user);

  const [report, setReport] = useState<DashboardReport>();
  const [loading, setLoading] = useState(true);
  const [todayInterviewCount, setTodayInterviewCount] = useState(0);
  const [recentReqCount, setRecentReqCount] = useState(0);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await getDashboardReport();
      setReport(data.data);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRequirements = async () => {
    try {
      // Last 2 days of requirement counts for "New reqs (24h)"
      const dates: string[] = [];
      for (let i = 1; i >= 0; i--) {
        dates.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
      }
      const response = await requirementCounts(dates, '', false);
      const data = response.data || [];
      const last24 = data.reduce((sum, c) => sum + (c.count || 0), 0);
      setRecentReqCount(last24);
    } catch (e) {
      console.error('Recent requirements fetch error', e);
      setRecentReqCount(0);
    }
  };

  const fetchTodayInterviews = async () => {
    if (!iUser) return;
    try {
      const today = dateByUserShift(iUser.shift || UserShift.India).format('YYYY/MM/DD');
      const int = await interviewsList('interviewDate=' + today);
      setTodayInterviewCount(int.data.data?.results?.length || 0);
    } catch (e) {
      console.error('Today interviews fetch error', e);
      setTodayInterviewCount(0);
    }
  };

  const refreshAll = () => {
    fetchDashboard();
    fetchRecentRequirements();
    fetchTodayInterviews();
  };

  useEffect(() => {
    // Plain users see the minimal UserDashboard and don't need the
    // ops aggregations — skip the fetches entirely for them.
    if (isPlainUser) {
      setLoading(false);
      return;
    }
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iUser?._id, isPlainUser]);

  if (isPlainUser) {
    return <UserDashboard />;
  }

  const statCards = useMemo(
    () => [
      {
        title: 'Requirements',
        value: report?.totalRequirements || 0,
        icon: <IconChartBar size={20} stroke={2} />,
        color: tokens.colors.pink,
      },
      {
        title: 'Interviews',
        value: report?.totalInterviews || 0,
        icon: <IconMicrophone size={20} stroke={2} />,
        color: tokens.colors.blue,
      },
      {
        title: 'Completed',
        value: report?.totalConfirmInterviews || 0,
        icon: <IconUserCheck size={20} stroke={2} />,
        color: tokens.colors.success,
      },
      {
        title: 'Projects',
        value: 0,
        icon: <IconBriefcase size={20} stroke={2} />,
        color: tokens.colors.yellowDark,
      },
      {
        title: 'Active Users',
        value: report?.totalActiveUsers || 0,
        icon: <IconUsersGroup size={20} stroke={2} />,
        color: tokens.colors.brand,
      },
      {
        title: 'Total Employees',
        value: report?.totalUsers || 0,
        icon: <IconUsers size={20} stroke={2} />,
        color: tokens.colors.blueDark,
      },
    ],
    [report]
  );

  if (loading || !iUser) {
    return (
      <Box>
        <SkeletonLoader variant="stats" count={6} />
        <Box mt={3}>
          <SkeletonLoader variant="card" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Command Hero — live clock + quick stats + mission ring ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CommandHero
          user={iUser}
          todayInterviews={todayInterviewCount}
          newRequirements={recentReqCount}
          activeTeammates={report?.totalActiveUsers || 0}
          onRefresh={refreshAll}
        />
      </MotionBox>

      {/* ── AI Daily Briefing (existing) ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <AiDailyBriefing
          userName={iUser?.firstName}
          onRefresh={refreshAll}
          insights={
            report
              ? [
                  { text: `${todayInterviewCount} interviews scheduled today`, type: 'blue' as const },
                  { text: `${report.totalRequirements || 0} total requirements`, type: 'pink' as const },
                  { text: `${report.totalActiveUsers || 0} team members active`, type: 'yellow' as const },
                  { text: `${report.totalConfirmInterviews || 0} confirmed interviews`, type: 'default' as const },
                ]
              : undefined
          }
        />
      </MotionBox>

      {/* ── Pulse stat cards ── */}
      <MotionBox variants={staggerContainer} initial="initial" animate="animate">
        <Grid container spacing={2}>
          {statCards.map((card) => (
            <Grid key={card.title} size={{ xs: 6, sm: 4, md: 2 }}>
              <MotionBox variants={staggerItem}>
                <PulseStatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                />
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>

      {/* ── Activity heatmap + Team highlights ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ActivityHeatmap />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <TeamHighlights />
          </Grid>
        </Grid>
      </MotionBox>

      {/* ── Requirement trend chart + Conversion funnel ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <RequirementTrendChart />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ConversionFunnel />
          </Grid>
        </Grid>
      </MotionBox>

      {/* ── Today's interviews table (existing) ── */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <TodaysInterviews />
      </MotionBox>
    </Box>
  );
}

export default Dashboard;
