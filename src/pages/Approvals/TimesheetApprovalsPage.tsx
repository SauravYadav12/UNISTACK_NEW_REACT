import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  IconCheck,
  IconClipboardCheck,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import {
  approveApproval,
  listApprovals,
  rejectApproval,
} from '../../services/timesheetApprovalApi';
import {
  ITimesheetApproval,
  TimesheetApprovalStatus,
} from '../../Interfaces/timesheet';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MotionBox = motion.create(Box);

const STATUS_COLORS: Record<TimesheetApprovalStatus, string> = {
  Pending: '#5A6A85',
  Requested: tokens.colors.blueDark,
  Approved: '#10B981',
  Rejected: '#EF4444',
};

/**
 * Super-admin inbox for timesheet approvals. Lists every Requested month
 * across all projects + organizations and offers inline approve/reject.
 */
export default function TimesheetApprovalsPage() {
  const [rows, setRows] = useState<ITimesheetApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ITimesheetApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { iUser } = useAuth();
  const canAct = !!iUser?.role?.includes(UserRole['super-admin']);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listApprovals({ status: 'Requested' });
      setRows(res.data?.data?.results || []);
    } catch {
      toast.error('Could not load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(row: ITimesheetApproval) {
    setActing(row._id);
    try {
      const res = await approveApproval(row._id);
      if (res.data?.data) {
        toast.success(`${row.projectId} ${row.periodMonth} approved`);
        setRows((prev) => prev.filter((r) => r._id !== row._id));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not approve';
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Reason is required');
      return;
    }
    setActing(rejectTarget._id);
    try {
      await rejectApproval(rejectTarget._id, reason);
      toast.success(`${rejectTarget.projectId} ${rejectTarget.periodMonth} rejected`);
      setRows((prev) => prev.filter((r) => r._id !== rejectTarget._id));
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not reject';
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  const hero = useMemo(
    () => (
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
          mb: 3,
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
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.3)} 0%, transparent 70%)`,
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
            background: `linear-gradient(90deg, ${tokens.colors.blue} 0%, ${tokens.colors.pink} 100%)`,
          }}
        />
        <Stack
          direction="row"
          spacing={1.75}
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.pink} 100%)`,
              color: '#fff',
            }}
          >
            <IconClipboardCheck size={24} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 700 }}
            >
              APPROVALS · TIMESHEET INBOX
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>
              Pending{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.pink} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                approvals
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.65) }}>
              {rows.length} project-month{rows.length === 1 ? '' : 's'} waiting on you
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <Button
              variant="outlined"
              onClick={load}
              startIcon={<IconRefresh size={16} />}
              sx={{
                bgcolor: alpha('#fff', 0.08),
                color: '#fff',
                borderColor: alpha('#fff', 0.2),
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': { bgcolor: alpha('#fff', 0.16), borderColor: alpha('#fff', 0.3) },
              }}
            >
              Refresh
            </Button>
          </Tooltip>
        </Stack>
      </MotionBox>
    ),
    [rows.length, load]
  );

  return (
    <Box>
      {hero}

      {loading ? (
        <Stack direction="row" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            borderRadius: 4,
            border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>Inbox zero</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            No timesheet approvals waiting. Admins will submit each month-end.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => {
            const color = STATUS_COLORS[row.status];
            const busy = acting === row._id;
            return (
              <Box
                key={row._id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: alpha(color, 0.25),
                  bgcolor: alpha(color, 0.03),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 240 }}>
                  <Typography fontWeight={800}>
                    {row.projectId} · {row.periodMonth}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.timesheetIds.length} week{row.timesheetIds.length === 1 ? '' : 's'}
                    {row.totalHoursAtSubmission != null
                      ? ` · ${row.totalHoursAtSubmission} h`
                      : ''}
                    {row.requestedAt
                      ? ` · requested ${moment(row.requestedAt).fromNow()}`
                      : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    disabled={!canAct || busy}
                    onClick={() => {
                      setRejectTarget(row);
                      setRejectReason('');
                    }}
                    startIcon={<IconX size={14} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      borderColor: '#EF4444',
                      color: '#EF4444',
                      '&:hover': {
                        bgcolor: alpha('#EF4444', 0.06),
                        borderColor: '#DC2626',
                      },
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!canAct || busy}
                    onClick={() => handleApprove(row)}
                    startIcon={
                      busy ? (
                        <CircularProgress size={14} sx={{ color: '#fff' }} />
                      ) : (
                        <IconCheck size={14} />
                      )
                    }
                    sx={{
                      bgcolor: '#10B981',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#059669' },
                    }}
                  >
                    {busy ? 'Approving…' : 'Approve'}
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onConfirm={handleReject}
        title="Reject this month?"
        description={
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The admin gets your reason and can edit + resubmit.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              multiline
              minRows={2}
              placeholder="Reason (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        }
        confirmLabel="Reject"
        tone="danger"
      />
    </Box>
  );
}
