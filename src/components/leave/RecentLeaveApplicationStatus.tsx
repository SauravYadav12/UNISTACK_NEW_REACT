import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  IconActivity,
  IconCircleCheck,
  IconCircleX,
  IconHourglass,
  IconRefresh,
  IconInbox,
  IconPencil,
} from '@tabler/icons-react';
import moment from 'moment';
import { motion } from 'framer-motion';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getLeaves } from '../../services/leavesApi';
import { listLeaveTypes } from '../../services/leaveTypesApi';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { iLeave, LeaveStatus } from '../../Interfaces/leaves';
import { LeaveType } from '../../Interfaces/salary';
import { tokens } from '../../theme/theme';
import EditLeaveDialog from './EditLeaveDialog';
import LeaveSplitBadges from './LeaveSplitBadges';

interface Props {
  refreshTrigger?: number;
}

const STATUS_META = {
  [LeaveStatus.Pending]: {
    color: tokens.colors.warning,
    bg: alpha(tokens.colors.warning, 0.12),
    icon: <IconHourglass size={14} />,
    label: 'Pending',
  },
  [LeaveStatus.Approved]: {
    color: tokens.colors.success,
    bg: alpha(tokens.colors.success, 0.12),
    icon: <IconCircleCheck size={14} />,
    label: 'Approved',
  },
  [LeaveStatus.Rejected]: {
    color: tokens.colors.error,
    bg: alpha(tokens.colors.error, 0.12),
    icon: <IconCircleX size={14} />,
    label: 'Rejected',
  },
};

const RecentLeaveApplicationStatus = ({ refreshTrigger = 0 }: Props) => {
  const { iUser } = useAuth();
  const [editing, setEditing] = useState<iLeave | undefined>();

  const { data, loading, loadData } = useFetchData<iLeave[]>(async () => {
    if (!iUser) return [];
    const { data } = await getLeaves(`userRef=${iUser._id}&limit=6`);
    return data.data?.results || [];
  }, [iUser]);

  const { data: leaveTypes } = useFetchData<LeaveType[]>(async () => {
    const res = await listLeaveTypes(true);
    return res.data || [];
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: alpha(tokens.colors.blue, 0.02),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(tokens.colors.blue, 0.12),
              color: tokens.colors.blue,
            }}
          >
            <IconActivity size={18} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Activity Timeline
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your recent requests
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={loadData} disabled={loading}>
            <IconRefresh size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, p: 2.5, overflowY: 'auto', maxHeight: 520 }}>
        {loading && !data?.length ? (
          <Stack spacing={2}>
            {[0, 1, 2].map((i) => (
              <Stack key={i} direction="row" spacing={1.5}>
                <Skeleton variant="circular" width={12} height={12} sx={{ mt: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={18} />
                  <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 2, mt: 1 }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : !data?.length ? (
          <EmptyState />
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* connecting vertical line */}
            <Box
              sx={{
                position: 'absolute',
                left: 5,
                top: 6,
                bottom: 6,
                width: 2,
                bgcolor: 'divider',
                borderRadius: 1,
              }}
            />
            <Stack spacing={2.25}>
              {data.map((leave, i) => {
                const meta = STATUS_META[leave.status];
                const isRange = leave.startDate !== leave.endDate;
                const dateText = isRange
                  ? `${moment(leave.startDate).format('MMM D')} – ${moment(leave.endDate).format('MMM D')}`
                  : moment(leave.startDate).format('MMM D, YYYY');
                const days =
                  moment(leave.endDate).diff(moment(leave.startDate), 'days') +
                  1 -
                  (leave.isHalfDay ? 0.5 : 0);

                return (
                  <motion.div
                    key={leave._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Stack direction="row" spacing={1.75} alignItems="flex-start">
                      {/* dot */}
                      <Box sx={{ pt: 0.75, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: meta.color,
                            boxShadow: `0 0 0 3px ${alpha(meta.color, 0.15)}, 0 0 0 5px ${alpha(meta.color, 0.08)}`,
                          }}
                        />
                      </Box>
                      {/* card */}
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: alpha(meta.color, 0.4),
                            boxShadow: `0 4px 12px ${alpha(meta.color, 0.08)}`,
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {dateText}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {leave.status === LeaveStatus.Pending && (
                              <Tooltip title="Edit request">
                                <IconButton
                                  size="small"
                                  onClick={() => setEditing(leave)}
                                  sx={{
                                    color: tokens.colors.pink,
                                    '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.1) },
                                  }}
                                >
                                  <IconPencil size={14} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 1.5,
                                bgcolor: meta.bg,
                                color: meta.color,
                              }}
                            >
                              {meta.icon}
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>
                                {meta.label}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {leave.type}
                            <Box
                              component="span"
                              sx={{ ml: 0.75, color: 'text.secondary', fontWeight: 500, fontSize: '0.72rem' }}
                            >
                              · {days} {days === 1 ? 'day' : 'days'}
                              {leave.isHalfDay && ' (half)'}
                            </Box>
                          </Typography>
                          <LeaveSplitBadges split={leave.splitBreakdown} types={leaveTypes || []} size="xs" />
                        </Stack>
                        {leave.reason && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                            }}
                          >
                            {leave.reason}
                          </Typography>
                        )}
                        {leave.status === LeaveStatus.Rejected && leave.rejectionReason && (
                          <Box
                            sx={{
                              mt: 0.75,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1.5,
                              bgcolor: alpha(tokens.colors.error, 0.06),
                              border: `1px solid ${alpha(tokens.colors.error, 0.15)}`,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: tokens.colors.error, fontSize: '0.7rem' }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>Reason:</Box> {leave.rejectionReason}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </motion.div>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      <EditLeaveDialog
        open={!!editing}
        leave={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          loadData();
        }}
      />
    </Box>
  );
};

function EmptyState() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: alpha(tokens.colors.blue, 0.08),
          color: tokens.colors.blue,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
        }}
      >
        <IconInbox size={26} />
      </Box>
      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
        No requests yet
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Submit your first leave using the form on the left.
      </Typography>
    </Box>
  );
}

export default RecentLeaveApplicationStatus;
