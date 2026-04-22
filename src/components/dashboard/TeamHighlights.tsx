import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Skeleton,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import { IconTrophy, IconHeadset, IconTargetArrow } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import {
  getMarketingLeaderboard,
  getSupportLeaderboard,
} from '../../services/performanceApi';
import {
  LeaderboardRow,
  MarketingMetrics,
  SupportMetrics,
} from '../../Interfaces/performance';

type Tab = 'support' | 'marketing';

interface Performer {
  id: string;
  name: string;
  score: number;
  summary: string;
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function marketingSummary(row: LeaderboardRow<MarketingMetrics>): string {
  const m = row.metrics;
  const completed = m.interviewsCompleted;
  const confirmed = m.interviewsConfirmed;
  return `${m.submissions} subs · ${completed} completed / ${confirmed} confirmed · ${m.conversionPct}%`;
}

function supportSummary(row: LeaderboardRow<SupportMetrics>): string {
  const m = row.metrics;
  return `${m.requirementsEntered} entered · ${m.entriesReachedSubmitted} submitted · ${m.entriesReachedInterviewed} interviewed`;
}

export default function TeamHighlights() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('marketing');
  const [loading, setLoading] = useState(true);
  const [supportRows, setSupportRows] = useState<
    LeaderboardRow<SupportMetrics>[]
  >([]);
  const [marketingRows, setMarketingRows] = useState<
    LeaderboardRow<MarketingMetrics>[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const fromDate = moment().startOf('month').format('YYYY-MM-DD');
        const toDate = moment().endOf('month').format('YYYY-MM-DD');
        const [marketing, support] = await Promise.all([
          getMarketingLeaderboard(fromDate, toDate),
          getSupportLeaderboard(fromDate, toDate),
        ]);
        if (cancelled) return;
        setMarketingRows(marketing.data?.data?.rows || []);
        setSupportRows(support.data?.data?.rows || []);
      } catch (e) {
        console.error('TeamHighlights load error', e);
        if (!cancelled) {
          setSupportRows([]);
          setMarketingRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const performers: Performer[] = useMemo(() => {
    if (tab === 'support') {
      return supportRows.slice(0, 5).map((r) => ({
        id: r.user._id,
        name: r.user.name || 'Unknown',
        score: r.score,
        summary: supportSummary(r),
      }));
    }
    return marketingRows.slice(0, 5).map((r) => ({
      id: r.user._id,
      name: r.user.name || 'Unknown',
      score: r.score,
      summary: marketingSummary(r),
    }));
  }, [tab, supportRows, marketingRows]);

  const maxScore = performers[0]?.score || 1;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)',
              color: '#7C5800',
            }}
          >
            <IconTrophy size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Team highlights
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Top 5 · this month · composite score
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ bgcolor: alpha(tokens.colors.brand, 0.04), p: 0.5, borderRadius: 2 }}>
          {([
            { key: 'marketing', label: 'Marketing', icon: <IconTargetArrow size={14} /> },
            { key: 'support', label: 'Support', icon: <IconHeadset size={14} /> },
          ] as const).map((t) => {
            const active = tab === t.key;
            return (
              <Box
                key={t.key}
                onClick={() => setTab(t.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTab(t.key);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: active ? '#fff' : 'text.secondary',
                  background: active ? tokens.gradients.pinkBlue : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': !active ? { bgcolor: alpha(tokens.colors.pink, 0.08) } : undefined,
                }}
              >
                {t.icon}
                {t.label}
              </Box>
            );
          })}
        </Stack>
      </Stack>

      {loading ? (
        <Stack spacing={1.5}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : !performers.length ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            No contributors yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Data appears after activity is logged.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {performers.map((p, i) => {
            const widthPct = maxScore > 0 ? (p.score / maxScore) * 100 : 0;
            const isTop = i === 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <Box
                  onClick={() => navigate('/performance')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/performance');
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    p: 1.25,
                    pl: 1.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: isTop ? alpha(tokens.colors.pink, 0.25) : 'divider',
                    bgcolor: isTop ? alpha(tokens.colors.pink, 0.03) : 'background.paper',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(tokens.colors.pink, 0.35),
                      boxShadow: `0 4px 12px ${alpha(tokens.colors.pink, 0.08)}`,
                    },
                  }}
                >
                  {/* Background fill bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      background: alpha(tokens.colors.pink, 0.06),
                      zIndex: 0,
                    }}
                  />

                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                      sx={{
                        minWidth: 22,
                        height: 22,
                        px: 0.75,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isTop
                          ? 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)'
                          : alpha(tokens.colors.brand, 0.08),
                        color: isTop ? '#7C5800' : tokens.colors.brand,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}
                    >
                      {isTop ? <IconTrophy size={12} /> : `#${i + 1}`}
                    </Box>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: isTop ? tokens.gradients.pinkBlue : alpha(tokens.colors.blue, 0.12),
                        color: isTop ? '#fff' : tokens.colors.blueDark,
                      }}
                    >
                      {getInitials(p.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: 'text.primary', lineHeight: 1.2 }}
                        noWrap
                      >
                        {p.name}
                      </Typography>
                      <Tooltip title={p.summary}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                          noWrap
                          component="div"
                        >
                          {p.summary}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Chip
                      label={p.score}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        bgcolor: isTop ? tokens.colors.pink : alpha(tokens.colors.pink, 0.1),
                        color: isTop ? '#fff' : tokens.colors.pinkDark,
                        minWidth: 36,
                      }}
                    />
                  </Stack>
                </Box>
              </motion.div>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
