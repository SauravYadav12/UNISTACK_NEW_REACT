import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconLayoutGrid,
  IconUsersPlus,
  IconPlayerPlay,
  IconClockHour4,
  IconSend,
  IconUsersGroup,
  IconX,
  IconRocket,
  IconPlayerPause,
} from '@tabler/icons-react';
import { requirementsList } from '../../services/requirementApi';
import { archiveRequirementsList } from '../../services/archivesApi';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../ui/AnimatedCounter';
import { RequirementStatus } from '../../Interfaces/reports';

const MotionBox = motion.create(Box);

const STATUS_META: Record<
  'All' | 'AllAssigned' | RequirementStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  All: {
    label: 'All',
    color: tokens.colors.brand,
    icon: <IconLayoutGrid size={16} />,
  },
  // Total child requirements (per-marketer assignments) across every
  // parent. Sits next to "All" so the operator can see the parent vs
  // assignment split at a glance — `All` counts parents + standalones,
  // `AllAssigned` counts the children spawned underneath them.
  AllAssigned: {
    label: 'All Assigned',
    color: '#A855F7',
    icon: <IconUsersPlus size={16} />,
  },
  'New Working': {
    label: 'New Working',
    color: '#37B7EA',
    icon: <IconPlayerPlay size={16} />,
  },
  'Submission in progress': {
    label: 'In Progress',
    color: '#14B8A6',
    icon: <IconClockHour4 size={16} />,
  },
  Submitted: {
    label: 'Submitted',
    color: '#10B981',
    icon: <IconSend size={16} />,
  },
  Interviewed: {
    label: 'Interviewed',
    color: '#EC4599',
    icon: <IconUsersGroup size={16} />,
  },
  Cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    icon: <IconX size={16} />,
  },
  'Project Active': {
    label: 'Active',
    color: '#F59E0B',
    icon: <IconRocket size={16} />,
  },
  'Project Inactive': {
    label: 'Inactive',
    color: '#94A3B8',
    icon: <IconPlayerPause size={16} />,
  },
};

const STATUS_ORDER: (keyof typeof STATUS_META)[] = [
  'All',
  'AllAssigned',
  'New Working',
  'Submission in progress',
  'Submitted',
  'Interviewed',
  'Project Active',
  'Project Inactive',
  'Cancelled',
];

// Tiles that don't act as status filters — they're informational only and
// shouldn't drive the grid's reqStatus query when clicked.
const INFO_ONLY_TILES = new Set<keyof typeof STATUS_META>(['AllAssigned']);

interface Props {
  /** Currently active status filter (empty string = All) */
  activeStatus: string;
  /** Called when a status card is clicked */
  onStatusChange: (status: string) => void;
  /** Fetch from archive endpoint instead */
  archive?: boolean;
  /** Bump this to refetch (e.g. after an add/edit) */
  refreshKey?: number;
}

export default function PipelineSnapshot({
  activeStatus,
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
        const api = archive ? archiveRequirementsList : requirementsList;
        // Tiles fetched as real status filters — exclude All (no filter)
        // and AllAssigned (uses the dedicated `onlyChildren` server flag).
        const statuses = STATUS_ORDER.filter(
          (s) => s !== 'All' && s !== 'AllAssigned'
        );
        const results = await Promise.all([
          api('page=1&limit=1'), // total (All)
          api('onlyChildren=true&page=1&limit=1'), // total children (AllAssigned)
          ...statuses.map((s) => api(`reqStatus=${encodeURIComponent(s)}&page=1&limit=1`)),
        ]);
        if (cancelled) return;
        const next: Record<string, number> = {
          All: results[0].data.data?.totalDocuments || 0,
          AllAssigned: results[1].data.data?.totalDocuments || 0,
        };
        statuses.forEach((s, i) => {
          next[s] = results[i + 2].data.data?.totalDocuments || 0;
        });
        setCounts(next);
      } catch (e) {
        console.error('PipelineSnapshot load error', e);
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
      STATUS_ORDER.map((s) => {
        const meta = STATUS_META[s];
        const value = counts[s] || 0;
        // No share-bar on the All / AllAssigned summary tiles — they're
        // their own denominators, not slices of the parent total.
        const isSummary = s === 'All' || s === 'AllAssigned';
        const pct = !isSummary && total > 0 ? (value / total) * 100 : 0;
        const active = s === 'All' ? activeStatus === '' : activeStatus === s;
        // Click target — empty string clears the status filter; status
        // names route to the corresponding grid filter; AllAssigned is
        // info-only and clicking just no-ops.
        const key = s === 'All' || s === 'AllAssigned' ? '' : s;
        const clickable = !INFO_ONLY_TILES.has(s);
        return { tileKey: s, key, meta, value, pct, active, isSummary, clickable };
      }),
    [counts, total, activeStatus]
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(4, 1fr)',
          md: 'repeat(8, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {cards.map(({ tileKey, key, meta, value, pct, active, isSummary, clickable }) => (
        <MotionBox
          key={tileKey}
          whileHover={clickable ? { y: -2, transition: { duration: 0.15 } } : undefined}
          whileTap={clickable ? { scale: 0.98 } : undefined}
          onClick={clickable ? () => onStatusChange(key) : undefined}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : -1}
          onKeyDown={
            clickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStatusChange(key);
                  }
                }
              : undefined
          }
          sx={{
            cursor: clickable ? 'pointer' : 'default',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden',
            p: 1.75,
            borderRadius: 3,
            border: '1.5px solid',
            borderColor: active ? meta.color : 'divider',
            bgcolor: active ? alpha(meta.color, 0.08) : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': clickable
              ? {
                  borderColor: active ? meta.color : alpha(meta.color, 0.5),
                  boxShadow: `0 6px 16px ${alpha(meta.color, 0.12)}`,
                }
              : undefined,
          }}
        >
          {/* Active left accent */}
          {active && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 3,
                bgcolor: meta.color,
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
                bgcolor: alpha(meta.color, 0.15),
                color: meta.color,
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: active ? meta.color : 'text.secondary',
                letterSpacing: '0.02em',
                fontSize: '0.72rem',
                lineHeight: 1.1,
                flex: 1,
                minWidth: 0,
              }}
              noWrap
            >
              {meta.label}
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
              {!isSummary && total > 0 && (
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

          {/* Mini share bar — only on real status tiles (not summary cards) */}
          {!isSummary && !loading && (
            <Box
              sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(meta.color, 0.08),
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: '100%',
                  background: meta.color,
                  borderRadius: 2,
                }}
              />
            </Box>
          )}
        </MotionBox>
      ))}
    </Box>
  );
}
