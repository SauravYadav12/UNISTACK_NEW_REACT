import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import {
  IconBriefcase,
  IconChartBar,
  IconHeadset,
  IconRefresh,
  IconSettings,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import {
  LeaderboardResponse,
  MarketingMetrics,
  SupportMetrics,
} from '../../Interfaces/performance';
import {
  getMarketingLeaderboard,
  getSupportLeaderboard,
} from '../../services/performanceApi';
import Leaderboard from './Leaderboard';
import WeightsDrawer from './WeightsDrawer';

const MotionBox = motion.create(Box);

type TabKey = 'marketing' | 'support';
type Preset = 'this-month' | 'last-month' | 'quarter' | 'ytd' | 'custom';

function computeRange(preset: Preset, custom?: { from: string; to: string }) {
  const now = moment();
  switch (preset) {
    case 'this-month':
      return {
        from: now.clone().startOf('month').format('YYYY-MM-DD'),
        to: now.clone().endOf('month').format('YYYY-MM-DD'),
      };
    case 'last-month':
      return {
        from: now
          .clone()
          .subtract(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD'),
        to: now
          .clone()
          .subtract(1, 'month')
          .endOf('month')
          .format('YYYY-MM-DD'),
      };
    case 'quarter':
      return {
        from: now.clone().startOf('quarter').format('YYYY-MM-DD'),
        to: now.clone().endOf('quarter').format('YYYY-MM-DD'),
      };
    case 'ytd':
      return {
        from: now.clone().startOf('year').format('YYYY-MM-DD'),
        to: now.clone().format('YYYY-MM-DD'),
      };
    case 'custom':
      return custom || {
        from: now.clone().startOf('month').format('YYYY-MM-DD'),
        to: now.clone().endOf('month').format('YYYY-MM-DD'),
      };
  }
}

export default function PerformancePage() {
  const [tab, setTab] = useState<TabKey>('marketing');
  const [preset, setPreset] = useState<Preset>('this-month');
  const [customFrom, setCustomFrom] = useState(
    moment().startOf('month').format('YYYY-MM-DD')
  );
  const [customTo, setCustomTo] = useState(
    moment().endOf('month').format('YYYY-MM-DD')
  );
  const [weightsOpen, setWeightsOpen] = useState(false);

  const range = useMemo(
    () => computeRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo]
  );

  const [marketingData, setMarketingData] =
    useState<LeaderboardResponse<MarketingMetrics> | null>(null);
  const [supportData, setSupportData] =
    useState<LeaderboardResponse<SupportMetrics> | null>(null);
  const [loading, setLoading] = useState(false);

  const { iUser } = useAuth();
  const isSuperAdmin =
    iUser?.role?.includes(UserRole['super-admin']) || false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'marketing') {
        const res = await getMarketingLeaderboard(range.from, range.to);
        if (res.data?.data) setMarketingData(res.data.data);
      } else {
        const res = await getSupportLeaderboard(range.from, range.to);
        if (res.data?.data) setSupportData(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const activeData = tab === 'marketing' ? marketingData : supportData;

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -70,
            left: '25%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gradients.pinkBlue,
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconChartBar size={24} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                PERFORMANCE · LEADERBOARD
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>
                Team{' '}
                <Box
                  component="span"
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  scoreboard
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65) }}>
                {activeData?.rows?.length ?? 0} people · range{' '}
                {moment(range.from).format('MMM D')}–
                {moment(range.to).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Tooltip title="Refresh">
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconRefresh
                  size={18}
                  className={loading ? 'sync-icon-loading' : ''}
                />
              </IconButton>
            </Tooltip>
            {isSuperAdmin && (
              <Tooltip title="Edit weights">
                <IconButton
                  onClick={() => setWeightsOpen(true)}
                  sx={{
                    bgcolor: alpha('#fff', 0.1),
                    color: '#fff',
                    borderRadius: 2,
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: alpha('#fff', 0.18) },
                  }}
                >
                  <IconSettings size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </MotionBox>

      {/* Tabs + range picker */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as TabKey)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 44,
            },
            '& .Mui-selected': { color: tokens.colors.pinkDark },
            '& .MuiTabs-indicator': {
              bgcolor: tokens.colors.pink,
              height: 3,
              borderRadius: 3,
            },
          }}
        >
          <Tab
            value="marketing"
            icon={<IconBriefcase size={16} />}
            iconPosition="start"
            label="Marketing"
          />
          <Tab
            value="support"
            icon={<IconHeadset size={16} />}
            iconPosition="start"
            label="Support"
          />
        </Tabs>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ButtonGroup
            size="small"
            variant="outlined"
            sx={{
              '& .MuiButton-root': {
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 0,
                borderColor: alpha(tokens.colors.blue, 0.3),
                color: tokens.colors.lightText,
                '&.active': {
                  bgcolor: alpha(tokens.colors.pink, 0.12),
                  color: tokens.colors.pinkDark,
                  borderColor: tokens.colors.pink,
                },
              },
            }}
          >
            {(
              [
                ['this-month', 'This month'],
                ['last-month', 'Last month'],
                ['quarter', 'This quarter'],
                ['ytd', 'YTD'],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                onClick={() => setPreset(key)}
                className={preset === key ? 'active' : ''}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>

          <Select
            size="small"
            value={preset === 'custom' ? 'custom' : '__none__'}
            onChange={(e) =>
              e.target.value === 'custom' ? setPreset('custom') : undefined
            }
            sx={{
              minWidth: 110,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          >
            <MenuItem value="__none__" disabled>
              Custom
            </MenuItem>
            <MenuItem value="custom">Pick dates…</MenuItem>
          </Select>

          {preset === 'custom' && (
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          )}
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" justifyContent="center" py={8}>
          <CircularProgress size={28} />
        </Stack>
      ) : tab === 'marketing' ? (
        <Leaderboard
          role="marketing"
          data={marketingData}
        />
      ) : (
        <Leaderboard role="support" data={supportData} />
      )}

      <WeightsDrawer
        open={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        onSaved={load}
      />
    </Box>
  );
}
