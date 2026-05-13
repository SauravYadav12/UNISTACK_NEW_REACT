import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconAlertTriangle,
  IconBeach,
  IconBell,
  IconBriefcase,
  IconCash,
  IconTicket,
  IconX,
} from '@tabler/icons-react';
import moment from 'moment';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme/theme';
import { NotificationItem } from '../../Interfaces/notification';

interface Props {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  loading: boolean;
  markRead: (id: string) => void | Promise<void>;
  markAllRead: () => void | Promise<void>;
}

/**
 * Right-anchored drawer listing notifications grouped by day. Clicking a row
 * marks it read and navigates to the relevant module page via the link.kind
 * router below.
 */
export default function NotificationDrawer({
  open,
  onClose,
  items,
  loading,
  markRead,
  markAllRead,
}: Props) {
  const navigate = useNavigate();

  const groups = useMemo(() => groupByDay(items), [items]);

  const handleClick = async (n: NotificationItem) => {
    if (!n.readAt) {
      void markRead(n._id);
    }
    const target = resolveLink(n);
    if (target) {
      onClose();
      navigate(target);
    }
  };

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 440,
          maxWidth: '100vw',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
        }}
      >
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
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
            }}
          >
            <IconBell size={18} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ color: '#fff' }}>
              Notifications
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: alpha('#fff', 0.7), fontSize: '0.7rem' }}
            >
              {items.length} recent · 15-day history
            </Typography>
          </Box>
          {hasUnread && (
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => markAllRead()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') markAllRead();
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fff',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: alpha('#fff', 0.12),
                '&:hover': { bgcolor: alpha('#fff', 0.2) },
              }}
            >
              Mark all read
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: '#fff',
              bgcolor: alpha('#fff', 0.1),
              '&:hover': { bgcolor: alpha('#fff', 0.18) },
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.25 }}>
        {loading && items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={22} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography fontWeight={700}>You're all caught up</Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
            >
              No notifications in the last 15 days.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {groups.map((g) => (
              <Box key={g.label}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.66rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {g.label}
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {g.items.map((n) => (
                    <Row key={n._id} n={n} onClick={() => handleClick(n)} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

function Row({
  n,
  onClick,
}: {
  n: NotificationItem;
  onClick: () => void;
}) {
  const unread = !n.readAt;
  const Icon = iconForType(n.type);
  const color = colorForType(n.type);
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: unread ? alpha(color, 0.3) : 'grey.200',
        bgcolor: unread ? alpha(color, 0.04) : 'background.paper',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: alpha(color, 0.5),
          boxShadow: `0 2px 8px ${alpha(color, 0.1)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.12),
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.86rem',
            fontWeight: unread ? 800 : 600,
            lineHeight: 1.3,
          }}
        >
          {n.title}
        </Typography>
        {n.body && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              mt: 0.25,
            }}
          >
            {n.body}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.68rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            mt: 0.5,
            display: 'block',
          }}
        >
          {moment(n.createdAt).fromNow()}
          {n.actor?.name ? ` · ${n.actor.name}` : ''}
        </Typography>
      </Box>
      {unread && (
        <Box
          sx={{
            width: 8,
            height: 8,
            mt: 0.75,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function iconForType(type: string) {
  if (type.startsWith('REQUIREMENT')) return IconBriefcase;
  if (type.startsWith('INTERVIEW')) return IconTicket;
  if (type.startsWith('LEAVE')) return IconBeach;
  if (type.startsWith('SALARY')) return IconCash;
  if (type.startsWith('PERF_')) return IconAlertTriangle;
  if (type.startsWith('PROJECT') || type.startsWith('TIMESHEET'))
    return IconBriefcase;
  return IconBell;
}

function colorForType(type: string) {
  if (type.startsWith('PERF_')) return '#F59E0B'; // amber for warnings
  if (type.startsWith('INTERVIEW')) return tokens.colors.pinkDark;
  if (type.startsWith('REQUIREMENT')) return tokens.colors.blueDark;
  if (type.startsWith('SALARY')) return '#16A34A'; // green for money
  if (type.startsWith('LEAVE')) return '#7C3AED'; // purple
  if (type.startsWith('PROJECT')) return '#0EA5E9'; // sky
  if (type.startsWith('TIMESHEET')) return '#0EA5E9';
  return tokens.colors.blueDark;
}

function resolveLink(n: NotificationItem): string | null {
  const {
    kind,
    reqID,
    intId,
    slipMonth,
    filterReqIDs,
    projectId,
  } = n.link || {};
  switch (kind) {
    case 'requirement':
      return reqID ? `/requirements?openReqID=${encodeURIComponent(reqID)}` : '/requirements';
    case 'interview':
      return intId
        ? `/interviews?openIntId=${encodeURIComponent(intId)}`
        : '/interviews';
    case 'leave':
      return '/leaves';
    case 'salary':
      return slipMonth
        ? `/salary?year=${slipMonth.year}&month=${slipMonth.month}`
        : '/salary';
    case 'project':
      return projectId
        ? `/projects?openProjectId=${encodeURIComponent(projectId)}`
        : '/projects';
    case 'timesheet':
      // No dedicated /timesheets route yet — land on the relevant project,
      // where the timesheet approval lives inside the project drawer/page.
      return projectId
        ? `/projects?openProjectId=${encodeURIComponent(projectId)}`
        : '/projects';
    case 'filter':
      if (filterReqIDs && filterReqIDs.length > 0) {
        return `/requirements?reqIDs=${encodeURIComponent(filterReqIDs.join(','))}`;
      }
      return '/requirements';
    default:
      return null;
  }
}

interface DayGroup {
  label: string;
  items: NotificationItem[];
}
function groupByDay(items: NotificationItem[]): DayGroup[] {
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'day').startOf('day');
  const map = new Map<string, NotificationItem[]>();
  for (const n of items) {
    const m = moment(n.createdAt);
    let key: string;
    if (m.isSameOrAfter(today)) key = 'Today';
    else if (m.isSameOrAfter(yesterday)) key = 'Yesterday';
    else key = m.format('MMM D, YYYY');
    const arr = map.get(key) || [];
    arr.push(n);
    map.set(key, arr);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}
