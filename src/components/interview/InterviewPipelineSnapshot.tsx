import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconLayoutGrid,
  IconCircleCheck,
  IconFlag,
  IconClock,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { interviewsList } from '../../services/interviewApi';
import { archiveInterviewsList } from '../../services/archivesApi';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../ui/AnimatedCounter';
import { InterviewStatus } from '../../Interfaces/reports';
import { interviewStatusColors } from '../../pages/Marketing/Interviews/interviewValues';

const MotionBox = motion.create(Box);

interface CardDef {
  /** Tab key matches the interviewTabs index label */
  key: 'All' | InterviewStatus;
  label: string;
  short: string;
  color: string;
  icon: React.ReactNode;
}

const CARDS: CardDef[] = [
  {
    key: 'All',
    label: 'All interviews',
    short: 'All',
    color: tokens.colors.brand,
    icon: <IconLayoutGrid size={16} />,
  },
  {
    key: 'Interview Confirm',
    label: 'Confirmed',
    short: 'Confirmed',
    color: interviewStatusColors['Interview Confirm'],
    icon: <IconCircleCheck size={16} />,
  },
  {
    key: 'Interview Completed',
    label: 'Completed',
    short: 'Completed',
    color: interviewStatusColors['Interview Completed'],
    icon: <IconFlag size={16} />,
  },
  {
    key: 'Interview Tentative',
    label: 'Tentative',
    short: 'Tentative',
    color: interviewStatusColors['Interview Tentative'],
    icon: <IconClock size={16} />,
  },
  {
    key: 'Interview Re-Scheduled',
    label: 'Re-Scheduled',
    short: 'Rescheduled',
    color: interviewStatusColors['Interview Re-Scheduled'],
    icon: <IconRefresh size={16} />,
  },
  {
    key: 'Interview Cancelled',
    label: 'Cancelled',
    short: 'Cancelled',
    color: interviewStatusColors['Interview Cancelled'],
    icon: <IconX size={16} />,
  },
];

interface Props {
  /** Currently active status — '' or undefined = All */
  activeStatus?: InterviewStatus | '';
  onStatusChange: (status: InterviewStatus | '') => void;
  archive?: boolean;
  refreshKey?: number;
}

export default function InterviewPipelineSnapshot({
  activeStatus = '',
  onStatusChange,
  archive = false,
  refreshKey = 0,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const api = archive ? archiveInterviewsList : interviewsList;
        const statuses = CARDS.filter((c) => c.key !== 'All');
        const results = await Promise.all([
          api('page=1&limit=1'),
          ...statuses.map((s) =>
            api(`interviewStatus=${encodeURIComponent(s.key)}&page=1&limit=1`)
          ),
        ]);
        if (cancelled) return;
        const next: Record<string, number> = {
          All: results[0].data.data?.totalDocuments || 0,
        };
        statuses.forEach((s, i) => {
          next[s.key] = results[i + 1].data.data?.totalDocuments || 0;
        });
        setCounts(next);
      } catch (e) {
        console.error('InterviewPipelineSnapshot load error', e);
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [archive, refreshKey]);

  const total = counts.All || 0;

  const cards = useMemo(
    () =>
      CARDS.map((c) => {
        const value = counts[c.key] || 0;
        const pct = total > 0 && c.key !== 'All' ? (value / total) * 100 : 0;
        const active = c.key === 'All' ? activeStatus === '' : activeStatus === c.key;
        const selectKey: InterviewStatus | '' = c.key === 'All' ? '' : c.key;
        return { ...c, value, pct, active, selectKey };
      }),
    [counts, total, activeStatus]
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(6, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {cards.map(({ key, short, color, icon, value, pct, active, selectKey }) => (
        <MotionBox
          key={key}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStatusChange(selectKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStatusChange(selectKey);
            }
          }}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden',
            p: 1.75,
            borderRadius: 3,
            border: '1.5px solid',
            borderColor: active ? color : 'divider',
            bgcolor: active ? alpha(color, 0.08) : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: active ? color : alpha(color, 0.5),
              boxShadow: `0 6px 16px ${alpha(color, 0.12)}`,
            },
          }}
        >
          {active && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 3,
                bgcolor: color,
              }}
            />
          )}

          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, 0.15),
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: active ? color : 'text.secondary',
                letterSpacing: '0.02em',
                fontSize: '0.72rem',
                lineHeight: 1.1,
                flex: 1,
                minWidth: 0,
              }}
              noWrap
            >
              {short}
            </Typography>
          </Stack>

          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Stack direction="row" alignItems="baseline" spacing={0.5}>
              <AnimatedCounter
                value={value}
                variant="h4"
                fontWeight={800}
                sx={{ lineHeight: 1, color: 'text.primary' }}
              />
              {key !== 'All' && total > 0 && (
                <Tooltip title={`${pct.toFixed(1)}% of total`} arrow>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  >
                    · {pct.toFixed(0)}%
                  </Typography>
                </Tooltip>
              )}
            </Stack>
          )}

          {key !== 'All' && !loading && (
            <Box
              sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(color, 0.08),
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', background: color, borderRadius: 2 }}
              />
            </Box>
          )}
        </MotionBox>
      ))}
    </Box>
  );
}
