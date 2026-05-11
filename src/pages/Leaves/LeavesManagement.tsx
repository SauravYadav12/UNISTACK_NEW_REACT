import { useMemo, useState } from 'react';
import {
  Box, Tab, Tabs, Typography, Chip, alpha, Stack, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  IconButton, Tooltip, CircularProgress, LinearProgress, Divider,
  Popover,
} from '@mui/material';
import { motion } from 'framer-motion';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconRefresh,
  IconPlaneDeparture, IconCalendar, IconChecks, IconPencil,
  IconFlag, IconSettings,
} from '@tabler/icons-react';
import EditLeaveDialog from '../../components/leave/EditLeaveDialog';
import LeaveSplitBadges from '../../components/leave/LeaveSplitBadges';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import HolidayList from '../../components/holiday/HolidayList';
import SyncHolidaysCard from '../../components/holiday/SyncHolidaysCard';
import HolidayNoticeSettingsPanel from '../../components/holiday/HolidayNoticeSettingsPanel';
import { HolidayContextProvider } from '../../contextProviders/HolidayContextProvider';

import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { useFetchData } from '../../hooks/fetchDataHook';
import { tokens } from '../../theme/theme';
import { UserRole } from '../../Interfaces/iUser';
import { LeaveBalance, LeaveType } from '../../Interfaces/salary';
import {
  listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
  getSuggestedCode,
  getMyBalances, getYearBalances,
  updateAllocation, triggerYearlyReset,
} from '../../services/leaveTypesApi';
import { getLeaves, updateLeave, createLeave } from '../../services/leavesApi';
import { usersList } from '../../services/authApi';
import { iUser } from '../../Interfaces/iUser';
import { iLeave, LeaveStatus, HalfDayType } from '../../Interfaces/leaves';
import { PaginationResult } from '../../Interfaces/apiRes';

const MotionBox = motion.create(Box);

export default function LeavesManagement() {
  const { iUser: me } = useAuth();
  const isAdmin =
    !!me?.role?.includes(UserRole['super-admin']) ||
    !!me?.role?.includes(UserRole.admin);

  // Admins/super-admins don't get "My Leaves" or the Apply Leave button — they
  // administer the system for employees instead. If they legitimately need to
  // take leave themselves, they can log in as their user account (or we can
  // add a separate admin self-service flow later).
  type Tab = 'dashboard' | 'requests' | 'types' | 'balances' | 'holidays-in' | 'holidays-us' | 'settings';
  const defaultTab: Tab = isAdmin ? 'requests' : 'dashboard';
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} sx={{ mb: 3 }}>
        <Typography variant="h1" fontWeight={700}>
          Leaves{' '}
          <Box component="span" sx={{
            background: tokens.gradients.pinkBlue,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Management</Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isAdmin
            ? 'Approve requests, configure leave types, and manage employee balances.'
            : 'See your leave balances, apply for a leave, and track request status.'}
        </Typography>
      </MotionBox>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3, borderBottom: 1, borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: tokens.colors.pink },
          '& .MuiTabs-indicator': { bgcolor: tokens.colors.pink },
        }}
      >
        {!isAdmin && (
          <Tab value="dashboard" label="My Leaves" icon={<IconPlaneDeparture size={16} />} iconPosition="start" />
        )}
        {isAdmin && <Tab value="requests" label="All Requests" icon={<IconChecks size={16} />} iconPosition="start" />}
        {isAdmin && <Tab value="types" label="Leave Types" icon={<IconEdit size={16} />} iconPosition="start" />}
        {isAdmin && <Tab value="balances" label="Employee Balances" icon={<IconCalendar size={16} />} iconPosition="start" />}
        <Tab value="holidays-in" label="India Holidays" icon={<IconFlag size={16} />} iconPosition="start" />
        <Tab value="holidays-us" label="US Holidays" icon={<IconFlag size={16} />} iconPosition="start" />
        {isAdmin && <Tab value="settings" label="Settings" icon={<IconSettings size={16} />} iconPosition="start" />}
      </Tabs>

      {tab === 'dashboard' && !isAdmin && <MyDashboard />}
      {tab === 'requests' && isAdmin && <AllRequestsPanel />}
      {tab === 'types' && isAdmin && <LeaveTypesPanel />}
      {tab === 'balances' && isAdmin && <EmployeeBalancesPanel />}
      {tab === 'holidays-in' && (
        <HolidayContextProvider>
          <SyncHolidaysCard country="IN" visible={isAdmin} />
          <HolidayList lockCountry="IN" forAdmin={isAdmin} hideYearSelector />
        </HolidayContextProvider>
      )}
      {tab === 'holidays-us' && (
        <HolidayContextProvider>
          <SyncHolidaysCard country="US" visible={isAdmin} />
          <HolidayList lockCountry="US" forAdmin={isAdmin} hideYearSelector />
        </HolidayContextProvider>
      )}
      {tab === 'settings' && isAdmin && <HolidayNoticeSettingsPanel />}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD TAB — visible to everyone. Own balances + apply + recent apps.
// ─────────────────────────────────────────────────────────────────────────────
function MyDashboard() {
  const { iUser: me } = useAuth();
  const year = new Date().getFullYear();
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: balances, loading: loadingBalances, loadData: reloadBalances } =
    useFetchData<LeaveBalance[]>(async () => {
      const { data } = await getMyBalances(year);
      return data || [];
    }, []);

  const { data: myLeaves, loadData: reloadLeaves } = useFetchData<iLeave[]>(async () => {
    if (!me?._id) return [];
    const { data } = await getLeaves(`userRef=${me._id}&limit=20`);
    return data.data?.results || [];
  }, [me?._id]);

  const [editing, setEditing] = useState<iLeave | undefined>();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Balance · {year}</Typography>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => setApplyOpen(true)}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          Apply Leave
        </Button>
      </Stack>

      {loadingBalances ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : !balances || balances.length === 0 ? (
        <Typography color="text.secondary">No leave types configured yet.</Typography>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {balances.map((b) => {
            const type = typeof b.leaveType === 'object' ? b.leaveType : undefined;
            if (!type) return null;

            // UL (unpaid bucket) has no allocation — render a distinct "taken"
            // variant so the user sees how many unpaid days they've accumulated
            // without being confused by a "0 / 0 left" readout.
            if (type.isUnpaidBucket) {
              const accent = type.color || tokens.colors.warning;
              const taken = b.used || 0;
              return (
                <Grid key={b._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Box sx={{
                    p: 2.5, borderRadius: 3,
                    bgcolor: taken > 0 ? alpha(accent, 0.05) : 'background.paper',
                    border: '1px solid',
                    borderColor: taken > 0 ? alpha(accent, 0.35) : 'divider',
                    position: 'relative', overflow: 'hidden',
                    transition: 'box-shadow 0.25s',
                    '&:hover': { boxShadow: `0 8px 24px ${alpha(accent, 0.15)}` },
                  }}>
                    {/* Dashed top accent — visual cue that this bucket is uncapped */}
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 6px, transparent 6px 10px)`,
                      opacity: 0.8,
                    }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: tokens.colors.lightText }}>
                        {type.name}
                      </Typography>
                      <Chip label={type.code} size="small" sx={{
                        bgcolor: alpha(accent, 0.12), color: accent,
                        fontWeight: 700, fontSize: 10, height: 22,
                      }} />
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                      <Typography sx={{
                        fontSize: 28,
                        fontWeight: 800,
                        lineHeight: 1,
                        color: taken > 0 ? accent : tokens.colors.lightText,
                      }}>
                        {taken}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
                        {taken === 1 ? 'day taken' : 'days taken'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, mt: 0.5 }}>
                      {taken > 0
                        ? 'Deducted as loss-of-pay on your salary slip.'
                        : 'You haven\u2019t taken any unpaid leave.'}
                    </Typography>
                  </Box>
                </Grid>
              );
            }

            const remaining = Math.max((b.allocated || 0) - (b.used || 0), 0);
            const pct = b.allocated ? Math.min((b.used / b.allocated) * 100, 100) : 0;
            const accent = type.color || tokens.colors.pink;
            const hasMonthlyCap = type.monthlyQuota != null && !type.isUnpaidBucket;
            const monthlyAvailable = b.monthlyAvailable;
            return (
              <Grid key={b._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Box sx={{
                  p: 2.5, borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider',
                  position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.25s',
                  '&:hover': { boxShadow: `0 8px 24px ${alpha(accent, 0.15)}` },
                }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: accent, opacity: 0.7 }} />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: tokens.colors.lightText }}>
                      {type.name}
                    </Typography>
                    <Chip label={type.code} size="small" sx={{
                      bgcolor: alpha(accent, 0.12), color: accent,
                      fontWeight: 700, fontSize: 10, height: 22,
                    }} />
                  </Stack>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: tokens.colors.lightText, lineHeight: 1 }}>
                      {remaining}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
                      / {b.allocated} left
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={pct}
                    sx={{
                      height: 6, borderRadius: 3, bgcolor: alpha(accent, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: accent },
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, mt: 0.5 }}>
                    {b.used} used · {type.paid ? 'Paid' : 'Unpaid'}
                  </Typography>

                  {hasMonthlyCap && monthlyAvailable != null && (
                    <Box sx={{
                      mt: 1.25, pt: 1.25,
                      borderTop: `1px dashed ${alpha(accent, 0.25)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <Typography sx={{
                        fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
                        color: tokens.colors.lightTextSecondary, textTransform: 'uppercase',
                      }}>
                        Available this month
                      </Typography>
                      <Typography sx={{
                        fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {monthlyAvailable}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent applications</Typography>
      <MyLeavesList
        leaves={myLeaves || []}
        leaveTypes={
          (balances || [])
            .map((b) => (typeof b.leaveType === 'object' ? b.leaveType : null))
            .filter((t): t is LeaveType => !!t)
        }
        onEdit={(lv) => setEditing(lv)}
      />

      {applyOpen && (
        <ApplyLeaveDialog
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onCreated={() => { reloadBalances(); reloadLeaves(); }}
        />
      )}

      <EditLeaveDialog
        open={!!editing}
        leave={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          reloadLeaves();
        }}
      />
    </Box>
  );
}

function MyLeavesList({
  leaves,
  leaveTypes = [],
  onEdit,
}: {
  leaves: iLeave[];
  leaveTypes?: LeaveType[];
  onEdit?: (lv: iLeave) => void;
}) {
  if (!leaves.length) {
    return <Typography color="text.secondary">No applications yet.</Typography>;
  }
  return (
    <Stack spacing={1}>
      {leaves.map((lv) => (
        <Stack
          key={lv._id}
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{
            p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {(() => {
              const days = moment(lv.endDate).diff(moment(lv.startDate), 'days') + 1
                - (lv.isHalfDay ? 0.5 : 0);
              return (
                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                  {moment(lv.startDate).format('DD MMM')} — {moment(lv.endDate).format('DD MMM YYYY')}
                  <Box component="span" sx={{
                    ml: 0.75,
                    color: tokens.colors.pink,
                    fontWeight: 700,
                    fontSize: 11,
                  }}>
                    · {days} {days === 1 ? 'day' : 'days'}
                  </Box>
                  {lv.isHalfDay && (
                    <Box component="span" sx={{ ml: 0.5, color: tokens.colors.lightTextSecondary, fontSize: 11 }}>
                      ({lv.halfDayType})
                    </Box>
                  )}
                </Typography>
              );
            })()}
            <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
              {lv.reason || 'No reason provided'}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <LeaveSplitBadges split={lv.splitBreakdown} types={leaveTypes} size="xs" />
            </Box>
          </Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {lv.status === LeaveStatus.Pending && onEdit && (
              <Tooltip title="Edit request">
                <IconButton
                  size="small"
                  onClick={() => onEdit(lv)}
                  sx={{
                    color: tokens.colors.pink,
                    '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.1) },
                  }}
                >
                  <IconPencil size={14} />
                </IconButton>
              </Tooltip>
            )}
            <StatusChip status={lv.status} />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

function StatusChip({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { bg: string; color: string }> = {
    [LeaveStatus.Pending]: { bg: alpha(tokens.colors.yellowDark, 0.12), color: tokens.colors.yellowDark },
    [LeaveStatus.Approved]: { bg: alpha(tokens.colors.success, 0.12), color: tokens.colors.success },
    [LeaveStatus.Rejected]: { bg: alpha(tokens.colors.error, 0.12), color: tokens.colors.error },
  };
  const s = map[status];
  return <Chip label={status} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 10, height: 22 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY LEAVE DIALOG
// ─────────────────────────────────────────────────────────────────────────────
function ApplyLeaveDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { iUser: me } = useAuth();
  const [form, setForm] = useState({
    leaveTypeId: '',
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    isHalfDay: false,
    halfDayType: HalfDayType.FirstHalf,
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<LeaveType[]>([]);

  useMemo(() => {
    (async () => {
      try {
        const { data } = await listLeaveTypes();
        setTypes(data || []);
        if (data?.length && !form.leaveTypeId) {
          const paidFirst = data.find((t) => t.paid && !t.isUnpaidBucket) || data[0];
          setForm((f) => ({ ...f, leaveTypeId: paidFirst._id }));
        }
      } catch {
        toast.error('Failed to load leave types');
      }
    })();
  }, []);

  async function handleSubmit() {
    if (!me) return;
    if (!form.leaveTypeId) { toast.error('Pick a leave type'); return; }
    if (moment(form.endDate).isBefore(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      const fullname = `${me.firstName || ''} ${me.lastName || ''}`.trim() || me.email;
      await createLeave({
        userRef: me._id,
        name: fullname,
        startDate: moment(form.startDate).format('YYYY/MM/DD'),
        endDate: moment(form.endDate).format('YYYY/MM/DD'),
        leaveType: form.leaveTypeId,
        reason: form.reason,
        isHalfDay: form.isHalfDay,
        halfDayType: form.isHalfDay ? form.halfDayType : undefined,
      });
      toast.success('Leave request submitted');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to submit leave');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Leave type</InputLabel>
            <Select
              label="Leave type"
              value={form.leaveTypeId}
              onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
            >
              {types.filter((t) => t.active && !t.isUnpaidBucket).map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name} ({t.code}) — {t.paid ? 'Paid' : 'Unpaid'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start date" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  startDate: v,
                  // Keep end on or after start — bump it forward if it fell behind.
                  endDate: !f.endDate || f.endDate < v ? v : f.endDate,
                }));
              }}
            />
            <TextField
              label="End date" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={form.endDate}
              inputProps={{ min: form.startDate }}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={<Switch checked={form.isHalfDay} onChange={(e) => setForm((f) => ({ ...f, isHalfDay: e.target.checked }))} />}
              label="Half-day"
            />
            {form.isHalfDay && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Half</InputLabel>
                <Select
                  label="Half"
                  value={form.halfDayType}
                  onChange={(e) => setForm((f) => ({ ...f, halfDayType: e.target.value as HalfDayType }))}
                >
                  <MenuItem value={HalfDayType.FirstHalf}>First Half</MenuItem>
                  <MenuItem value={HalfDayType.SecondHalf}>Second Half</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
          <TextField
            label="Reason" multiline rows={3} fullWidth size="small"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <Typography variant="caption" color="text.secondary">
            If your balance is insufficient, the leave will be reclassified to Unpaid Leave (UL) on approval.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={saving}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          {saving ? 'Submitting…' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL REQUESTS TAB (admin) — approve/reject
// ─────────────────────────────────────────────────────────────────────────────
function AllRequestsPanel() {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>(LeaveStatus.Pending);
  const [pending, setPending] = useState<{ leave: iLeave; status: LeaveStatus } | null>(null);

  const { data, loading, loadData } = useFetchData<iLeave[]>(async () => {
    const q = new URLSearchParams({ limit: '500' });
    if (statusFilter !== 'all') q.set('status', statusFilter);
    const res = await getLeaves(q.toString());
    const pr = res.data.data as PaginationResult<iLeave>;
    return pr.results || [];
  }, [statusFilter]);

  async function handleConfirm() {
    if (!pending) return;
    try {
      await updateLeave(pending.leave._id, { status: pending.status });
      toast.success(`Leave ${pending.status.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update');
      throw err; // ConfirmDialog keeps the modal open on thrown errors
    }
  }

  const columns: GridColDef<iLeave>[] = useMemo(() => [
    { field: 'name', headerName: 'Employee', flex: 1, minWidth: 160 },
    {
      field: 'dates', headerName: 'Dates', width: 220,
      valueGetter: (_v, row) => {
        const days = moment(row.endDate).diff(moment(row.startDate), 'days') + 1
          - (row.isHalfDay ? 0.5 : 0);
        const range = `${moment(row.startDate).format('DD MMM')} – ${moment(row.endDate).format('DD MMM YY')}`;
        return `${range} · ${days} ${days === 1 ? 'day' : 'days'}`;
      },
      renderCell: ({ row }) => {
        const days = moment(row.endDate).diff(moment(row.startDate), 'days') + 1
          - (row.isHalfDay ? 0.5 : 0);
        return (
          <Box>
            <Typography sx={{ fontSize: 13, color: tokens.colors.lightText }}>
              {moment(row.startDate).format('DD MMM')} – {moment(row.endDate).format('DD MMM YY')}
            </Typography>
            <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary, fontWeight: 600 }}>
              {days} {days === 1 ? 'day' : 'days'}
              {row.isHalfDay && ' · half'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'type', headerName: 'Type', width: 130,
      renderCell: ({ row }) => row.type || row.leaveType || '—',
    },
    { field: 'isHalfDay', headerName: 'Half-day', width: 90, type: 'boolean' },
    { field: 'reason', headerName: 'Reason', flex: 1.2, minWidth: 200 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ value }) => <StatusChip status={value as LeaveStatus} />,
    },
    {
      field: 'actions', headerName: '', width: 130, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        row.status === LeaveStatus.Pending ? (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Approve">
              <IconButton size="small" onClick={() => setPending({ leave: row, status: LeaveStatus.Approved })}>
                <IconCheck size={16} color={tokens.colors.success} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject">
              <IconButton size="small" onClick={() => setPending({ leave: row, status: LeaveStatus.Rejected })}>
                <IconX size={16} color={tokens.colors.error} />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null
      ),
    },
  ], []);

  const isApprove = pending?.status === LeaveStatus.Approved;
  const daysLabel = pending
    ? (() => {
        const d = moment(pending.leave.endDate).diff(moment(pending.leave.startDate), 'days') + 1
          - (pending.leave.isHalfDay ? 0.5 : 0);
        return `${d} ${d === 1 ? 'day' : 'days'}`;
      })()
    : '';

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'all')}>
            <MenuItem value="all">All</MenuItem>
            {Object.values(LeaveStatus).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData}><IconRefresh size={18} /></IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ minHeight: 400 }}>
        <DataGrid
          loading={loading}
          rows={data || []}
          columns={columns}
          getRowId={(r) => r._id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          getRowHeight={() => 56}
          sx={defaultGridSx}
        />
      </Box>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        tone={isApprove ? 'success' : 'danger'}
        title={isApprove ? 'Approve this leave request?' : 'Reject this leave request?'}
        confirmLabel={isApprove ? 'Yes, approve' : 'Yes, reject'}
        cancelLabel="Keep reviewing"
        icon={isApprove
          ? <IconCheck size={28} stroke={2.5} />
          : <IconX size={28} stroke={2.5} />}
        description={pending ? (
          <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: tokens.colors.lightText, fontWeight: 600 }}>
              {pending.leave.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {moment(pending.leave.startDate).format('DD MMM')} — {moment(pending.leave.endDate).format('DD MMM YYYY')}
              {pending.leave.isHalfDay && ` · ${pending.leave.halfDayType}`} · {daysLabel}
            </Typography>
            {pending.leave.reason && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mt: 0.75,
                  fontStyle: 'italic',
                }}
              >
                “{pending.leave.reason}”
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {isApprove
                ? 'The applicant will be emailed and their attendance auto-marked.'
                : 'The applicant will be notified by email.'}
            </Typography>
          </Stack>
        ) : undefined}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE TYPES TAB (admin)
// ─────────────────────────────────────────────────────────────────────────────
function LeaveTypesPanel() {
  const { data: types, loadData, loading } = useFetchData<LeaveType[]>(async () => {
    const { data } = await listLeaveTypes(true);
    return data || [];
  }, []);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [adding, setAdding] = useState(false);

  const columns: GridColDef<LeaveType>[] = useMemo(() => [
    {
      field: 'name', headerName: 'Name', flex: 1, minWidth: 180,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color || tokens.colors.pink }} />
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{row.name}</Typography>
        </Stack>
      ),
    },
    {
      field: 'code', headerName: 'Code', width: 90,
      renderCell: ({ value }) => <Chip label={value} size="small" sx={{
        bgcolor: alpha(tokens.colors.pink, 0.1), color: tokens.colors.pink,
        fontWeight: 700, fontSize: 11, height: 22,
      }} />,
    },
    { field: 'paid', headerName: 'Paid', width: 80, type: 'boolean' },
    { field: 'defaultAllocationPerYear', headerName: 'Default / yr', width: 110, type: 'number' },
    {
      field: 'isUnpaidBucket', headerName: 'UL bucket', width: 100, type: 'boolean',
    },
    { field: 'active', headerName: 'Active', width: 80, type: 'boolean' },
    {
      field: 'actions', headerName: '', width: 120, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => setEditing(row)}>
            <IconEdit size={16} />
          </IconButton>
          <IconButton
            size="small"
            disabled={row.isUnpaidBucket}
            onClick={async () => {
              if (!window.confirm(`Deactivate ${row.name}?`)) return;
              await deleteLeaveType(row._id);
              loadData();
            }}
          >
            <IconTrash size={16} color={row.isUnpaidBucket ? undefined : tokens.colors.error} />
          </IconButton>
        </Stack>
      ),
    },
  ], [loadData]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Leave Types</Typography>
        <Button
          variant="contained" startIcon={<IconPlus size={16} />}
          onClick={() => setAdding(true)}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          Add Type
        </Button>
      </Stack>
      <Box sx={{ minHeight: 400 }}>
        <DataGrid
          loading={loading}
          rows={types || []}
          columns={columns}
          getRowId={(r) => r._id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          sx={defaultGridSx}
        />
      </Box>
      {(adding || editing) && (
        <LeaveTypeDialog
          open={adding || !!editing}
          type={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); loadData(); }}
        />
      )}
    </Box>
  );
}

function LeaveTypeDialog({
  open, type, onClose, onSaved,
}: { open: boolean; type: LeaveType | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<LeaveType>>(
    type || { name: '', code: '', paid: true, defaultAllocationPerYear: 0, color: '' },
  );
  const [saving, setSaving] = useState(false);

  async function onNameChange(name: string) {
    setForm((f) => ({ ...f, name }));
    if (!type && name.trim().length >= 2) {
      try {
        const { code } = await getSuggestedCode(name);
        setForm((f) => ({ ...f, code }));
      } catch { /* ignore */ }
    }
  }

  async function handleSave() {
    if (!form.name || !form.code) { toast.error('Name and code required'); return; }
    setSaving(true);
    try {
      if (type) await updateLeaveType(type._id, form);
      else await createLeaveType(form);
      toast.success('Saved');
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{type ? 'Edit' : 'New'} Leave Type</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name" fullWidth size="small"
            value={form.name || ''}
            onChange={(e) => onNameChange(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Code" size="small" sx={{ maxWidth: 140 }}
              value={form.code || ''}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              helperText="Auto-suggested from name"
            />
            <TextField
              label="Default / year" type="number" size="small" sx={{ maxWidth: 160 }}
              value={form.defaultAllocationPerYear ?? 0}
              // step 0.5 — half-day allocations count as 0.5; lets HR set
              // a 9.5/year default, and the spinner steps in half-day units.
              inputProps={{ min: 0, step: 0.5 }}
              onChange={(e) => setForm((f) => ({ ...f, defaultAllocationPerYear: Number(e.target.value) || 0 }))}
            />
            <TextField
              label="Color" type="color" size="small" sx={{ maxWidth: 100 }}
              value={form.color || '#EC4599'}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
          </Stack>
          {/* Monthly quota — the per-employee accrual rate the type uses
              by default. Blank → uncapped (the full annual balance is
              available immediately, used by ML / UL). Number → cumulative
              `min(month × quota, allocated)` ceiling per employee. Per-user
              overrides are set on the Allocation cell. */}
          <TextField
            label="Monthly quota"
            type="number"
            size="small"
            sx={{ maxWidth: 200 }}
            value={form.monthlyQuota == null ? '' : String(form.monthlyQuota)}
            inputProps={{ min: 0, step: 0.5 }}
            placeholder="Leave blank for uncapped"
            helperText={
              form.monthlyQuota == null
                ? 'Uncapped — full annual balance available immediately'
                : `${form.monthlyQuota} day${form.monthlyQuota === 1 ? '' : 's'} per month, cumulative`
            }
            onChange={(e) => {
              const raw = e.target.value;
              setForm((f) => ({
                ...f,
                monthlyQuota: raw.trim() === '' ? null : Number(raw),
              }));
            }}
          />
          <TextField
            label="Description" multiline rows={2} fullWidth size="small"
            value={form.description || ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <FormControlLabel
            control={<Switch checked={!!form.paid} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))} />}
            label="Paid (counts toward salary)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={saving}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE BALANCES TAB (admin)
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeBalancesPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [pendingReset, setPendingReset] = useState<'seed' | 'force' | null>(null);

  const { data, loading, loadData } = useFetchData<{ balances: LeaveBalance[]; users: iUser[]; types: LeaveType[] }>(
    async () => {
      const [b, u, t] = await Promise.all([
        getYearBalances(year),
        usersList(),
        listLeaveTypes(),
      ]);
      return {
        balances: b.data || [],
        // Super-admins are not paid employees — exclude them from the
        // per-user leave-balance grid so the table only lists people who
        // actually accrue / consume leave.
        users: (u.data.users || []).filter(
          (x) => x.active && !x.role?.includes(UserRole['super-admin']),
        ),
        types: t.data || [],
      };
    },
    [year],
  );

  async function handleAllocationChange(
    userId: string,
    leaveTypeId: string,
    allocated: number,
    // monthlyQuota patch:
    //   undefined → don't touch the existing override
    //   null      → clear the override (revert to type default)
    //   number    → set the override
    monthlyQuota?: number | null,
  ) {
    try {
      await updateAllocation(userId, year, leaveTypeId, allocated, monthlyQuota);
      loadData();
    } catch {
      toast.error('Update failed');
    }
  }

  async function runReset() {
    if (!pendingReset) return;
    const force = pendingReset === 'force';
    try {
      const { data: result } = await triggerYearlyReset(year, force);
      toast.success(`Reset complete — ${result.upserted} rows updated`);
      loadData();
    } catch (err) {
      toast.error('Reset failed');
      throw err; // keep ConfirmDialog open so admin can retry
    }
  }

  const users = data?.users || [];
  const types = (data?.types || []).filter((t) => t.active);

  // Defensive key builder — some Mongo drivers return ObjectId instances
  // after `.lean()`, which stringify fine but fail strict equality checks.
  const asId = (v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v !== null && '_id' in v) {
      return String((v as { _id: unknown })._id);
    }
    return String(v);
  };

  const balMap = useMemo(() => {
    const m = new Map<string, LeaveBalance>();
    for (const b of data?.balances || []) {
      const uId = asId(b.user);
      const tId = asId(b.leaveType);
      if (!uId || !tId) continue;
      m.set(`${uId}:${tId}`, b);
    }
    return m;
  }, [data]);

  const missingBalanceUsers = users.filter(
    (u) => !types.some((t) => balMap.has(`${u._id}:${t._id}`)),
  ).length;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh balances">
            <IconButton
              size="small"
              onClick={loadData}
              disabled={loading}
              sx={{
                bgcolor: alpha(tokens.colors.pink, 0.08),
                color: tokens.colors.pink,
                '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.15) },
              }}
            >
              <IconRefresh
                size={16}
                style={{
                  animation: loading ? 'spin 0.9s linear infinite' : undefined,
                }}
              />
            </IconButton>
          </Tooltip>
          <Box sx={{ minWidth: 260 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {users.length} employees · {types.length} types · {(data?.balances || []).length} balance rows
            </Typography>
            {missingBalanceUsers > 0 && !loading && (
              <Typography variant="caption" sx={{ color: tokens.colors.warning, fontWeight: 600 }}>
                {missingBalanceUsers} employee{missingBalanceUsers === 1 ? '' : 's'} not seeded — click Seed Missing
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined" size="small"
            onClick={() => setPendingReset('seed')}
          >
            Seed Missing
          </Button>
          <Button
            variant="outlined" color="error" size="small"
            onClick={() => setPendingReset('force')}
          >
            Force Reset
          </Button>
        </Stack>
      </Stack>

      {/* Global keyframes for the refresh spin (scoped to this panel only). */}
      <Box component="style">{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{
          overflowX: 'auto', bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider', borderRadius: 2,
        }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <Box component="thead" sx={{ bgcolor: '#F6F9FC' }}>
              <Box component="tr">
                <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#2A3547' }}>
                  Employee
                </Box>
                {types.map((t) => (
                  <Box component="th" key={t._id} sx={{
                    p: 1.5, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#2A3547',
                    minWidth: 100,
                  }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color || tokens.colors.pink }} />
                      <span>{t.code}</span>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {users.map((u) => (
                <Box component="tr" key={u._id} sx={{ '&:hover': { bgcolor: '#F6F9FC' } }}>
                  <Box component="td" sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'grey.100' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {u.firstName} {u.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                      {u.email}
                    </Typography>
                  </Box>
                  {types.map((t) => {
                    const bal = balMap.get(`${u._id}:${t._id}`);
                    return (
                      <Box component="td" key={t._id} sx={{ p: 1, borderTop: '1px solid', borderColor: 'grey.100', textAlign: 'center' }}>
                        <AllocationCell
                          hasRow={!!bal}
                          isUnpaidBucket={!!t.isUnpaidBucket}
                          allocated={bal?.allocated ?? t.defaultAllocationPerYear ?? 0}
                          used={bal?.used ?? 0}
                          monthlyAvailable={t.monthlyQuota != null && !t.isUnpaidBucket ? bal?.monthlyAvailable : undefined}
                          monthlyQuota={t.monthlyQuota}
                          monthlyQuotaOverride={bal?.monthlyQuota}
                          onSave={(v, mq) => handleAllocationChange(u._id, t._id, v, mq)}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.secondary">
        Allocations auto-seed for every active employee × active leave type. Used count auto-updates when leaves are approved.
        On Jan 1 00:00 EST, a full reset runs automatically.
      </Typography>

      <ConfirmDialog
        open={pendingReset === 'seed'}
        onClose={() => setPendingReset(null)}
        onConfirm={runReset}
        tone="neutral"
        title={`Seed missing balances for ${year}?`}
        confirmLabel="Yes, seed"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              This fills in any <strong>missing</strong> balance rows for every active employee × active leave type, using each leave type&rsquo;s <strong>default annual allocation</strong>.
            </Typography>
            <Box sx={{
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.success, 0.08),
              border: `1px solid ${alpha(tokens.colors.success, 0.25)}`,
            }}>
              <Typography variant="caption" sx={{ color: tokens.colors.success, fontWeight: 700, letterSpacing: 1 }}>
                NON-DESTRUCTIVE
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                Existing allocations and <strong>used</strong> counters are untouched. Safe to run anytime — e.g. after adding a new employee or leave type.
              </Typography>
            </Box>
          </Stack>
        }
      />

      <ConfirmDialog
        open={pendingReset === 'force'}
        onClose={() => setPendingReset(null)}
        onConfirm={runReset}
        tone="danger"
        title={`Force reset all balances for ${year}?`}
        confirmLabel="Yes, force reset"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              This will <strong>overwrite</strong> every employee&rsquo;s allocation back to the leave type&rsquo;s default, and reset every <strong>used</strong> counter to <strong>0</strong> for {year}.
            </Typography>
            <Box sx={{
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.error, 0.06),
              border: `1px solid ${alpha(tokens.colors.error, 0.25)}`,
            }}>
              <Typography variant="caption" sx={{ color: tokens.colors.error, fontWeight: 700, letterSpacing: 1 }}>
                DESTRUCTIVE — CANNOT BE UNDONE
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                Any custom allocations you&rsquo;ve set for individuals will be lost. Approved-leave history stays in place, but those days will no longer show as &ldquo;used&rdquo; against balances.
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Normally this only runs automatically at midnight on Jan 1 EST. Use only if you intentionally want to wipe this year&rsquo;s balance state.
            </Typography>
          </Stack>
        }
      />
    </Box>
  );
}

function AllocationCell({
  hasRow,
  isUnpaidBucket,
  allocated,
  used,
  monthlyAvailable,
  monthlyQuota,
  monthlyQuotaOverride,
  onSave,
}: {
  hasRow: boolean;
  isUnpaidBucket?: boolean;
  allocated: number;
  used: number;
  /** Present only for types with a monthlyQuota and not the unpaid bucket. */
  monthlyAvailable?: number;
  /** The LeaveType's global `monthlyQuota` (default rate, used as the
   *  placeholder for the override input when no override is set). */
  monthlyQuota?: number | null;
  /** The user's per-row override of the type's global `monthlyQuota`, when
   *  set. `null`/undefined = no override (use the global default). */
  monthlyQuotaOverride?: number | null;
  /** Save callback. `monthlyQuota` is `undefined` when not changed,
   *  `null` to clear the override, or a number to set/update it. */
  onSave: (allocated: number, monthlyQuota?: number | null) => void;
}) {
  const [v, setV] = useState<string>(String(allocated));
  // Empty string → not set (= "use default"). Accepts numeric strings.
  const [q, setQ] = useState<string>(
    monthlyQuotaOverride != null ? String(monthlyQuotaOverride) : "",
  );
  // Popover anchor — set on click, cleared on close. Replaces the inline
  // edit mode; the editor floats above the table cell so a tall two-field
  // form doesn't overlap with neighbour cells.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const editing = Boolean(anchorEl);

  const remaining = Math.max(allocated - used, 0);
  const isOverUsed = used > allocated;
  const hasQuotaOverride = monthlyQuotaOverride != null;
  // Type doesn't use a monthly cap (UL / ML) — hide the override field
  // in the editor. UL skips this whole branch anyway.
  const supportsMonthlyQuota = monthlyQuota != null && !isUnpaidBucket;
  // Default per-month rate when there is no admin override — comes from
  // the LeaveType (e.g. PL = 1/mo). Shown in the editor's helper text so
  // admins know what they're overriding when entering a custom value.
  const defaultPerMonth = supportsMonthlyQuota
    ? (monthlyQuota as number)
    : null;

  function openEditor(e: React.MouseEvent<HTMLElement>) {
    setV(String(allocated));
    setQ(monthlyQuotaOverride != null ? String(monthlyQuotaOverride) : "");
    setAnchorEl(e.currentTarget);
  }
  function closeEditor() {
    setAnchorEl(null);
  }

  function commit() {
    const n = Number(v);
    const allocChanged = !hasRow || n !== allocated;
    const allocValid = Number.isFinite(n);

    // Resolve monthlyQuota patch: empty string means "clear override"; a
    // numeric string means "set/update". Skip the patch entirely when
    // the input matches the existing override (no-op).
    let quotaPatch: number | null | undefined = undefined;
    if (supportsMonthlyQuota) {
      if (q.trim() === "") {
        if (hasQuotaOverride) quotaPatch = null;
      } else {
        const parsed = Number(q);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed !== monthlyQuotaOverride) {
          quotaPatch = parsed;
        }
      }
    }

    const nothingChanged =
      !allocChanged && quotaPatch === undefined;
    if (nothingChanged || !allocValid) {
      closeEditor();
      return;
    }
    onSave(Math.max(0, n), quotaPatch);
    closeEditor();
  }

  // UL has no allocation — always show the "days taken" view. It's still
  // clickable so HR can grant a custom allocation if they really want to.
  if (isUnpaidBucket) {
    const accent = used > 0 ? tokens.colors.warning : tokens.colors.lightTextSecondary;
    return (
      <>
        <Tooltip
          title={
            hasRow
              ? `Unpaid days taken: ${used}${allocated ? ` · Custom allocation: ${allocated}` : ''} · Click to override`
              : 'Click to override allocation'
          }
          placement="top"
          arrow
        >
          <Box
            onClick={openEditor}
            sx={{
              cursor: 'pointer', py: 0.5, px: 1, borderRadius: 1,
              '&:hover': { bgcolor: alpha(tokens.colors.warning, 0.08) },
            }}
          >
            <Typography sx={{
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1,
              color: accent,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {used}
            </Typography>
            <Typography sx={{
              fontSize: 10,
              color: tokens.colors.lightTextSecondary,
              mt: 0.25,
            }}>
              {used === 1 ? 'day taken' : 'days taken'}
            </Typography>
          </Box>
        </Tooltip>
        <AllocationEditor
          anchorEl={anchorEl}
          onClose={closeEditor}
          v={v}
          setV={setV}
          q={q}
          setQ={setQ}
          supportsMonthlyQuota={supportsMonthlyQuota}
          defaultPerMonth={defaultPerMonth}
          hasQuotaOverride={hasQuotaOverride}
          commit={commit}
        />
      </>
    );
  }

  const tooltipBase = hasRow
    ? `Allocated: ${allocated} · Used: ${used}`
    : 'Click to set allocation';
  const tooltipMonthly = hasRow && monthlyAvailable != null && monthlyQuota != null
    ? ` · This month: ${monthlyAvailable} (${monthlyQuota}/mo + carry-forward)`
    : '';
  const tooltipEdit = hasRow ? ' · Click to edit allocation' : '';
  return (
    <>
      <Tooltip
        title={`${tooltipBase}${tooltipMonthly}${tooltipEdit}`}
        placement="top"
        arrow
      >
        <Box
          onClick={openEditor}
          sx={{
            cursor: 'pointer', py: 0.5, px: 1, borderRadius: 1,
            '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.06) },
          }}
        >
          <Typography sx={{
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1,
            color: !hasRow
              ? tokens.colors.lightTextSecondary
              : isOverUsed
                ? tokens.colors.error
                : remaining === 0
                  ? tokens.colors.warning
                  : tokens.colors.lightText,
          }}>
            {hasRow ? remaining : '—'}
          </Typography>
          <Typography sx={{
            fontSize: 10,
            color: tokens.colors.lightTextSecondary,
            mt: 0.25,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {hasRow ? `of ${allocated}` : 'not seeded'}
          </Typography>
          {/* Available this month — the server-computed per-employee
              ceiling for the current month (carry-forward + accrual).
              Highlighted in pink because that's the number admins are
              actually looking at when triaging "how many leaves can this
              person take this month". The per-month rate / "1.5/mo" chip
              is intentionally hidden — admins want the available number,
              not the rate, in the listing. */}
          {hasRow && monthlyAvailable != null && (
            <Typography sx={{
              fontSize: 9.5,
              color: hasQuotaOverride ? tokens.colors.warning : tokens.colors.pink,
              fontWeight: 700,
              mt: 0.25,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 0.3,
            }}>
              {monthlyAvailable} avail this mo
              {hasQuotaOverride ? ' · custom' : ''}
            </Typography>
          )}
        </Box>
      </Tooltip>
      <AllocationEditor
        anchorEl={anchorEl}
        onClose={closeEditor}
        v={v}
        setV={setV}
        q={q}
        setQ={setQ}
        supportsMonthlyQuota={supportsMonthlyQuota}
        defaultPerMonth={defaultPerMonth}
        hasQuotaOverride={hasQuotaOverride}
        commit={commit}
      />
    </>
  );
}

// Floating editor — anchored to the cell's display element via Popover so
// the two-input form doesn't squeeze inside the table column. Stays open
// until the admin clicks Save / Cancel or clicks outside.
function AllocationEditor({
  anchorEl,
  onClose,
  v,
  setV,
  q,
  setQ,
  supportsMonthlyQuota,
  defaultPerMonth,
  hasQuotaOverride,
  commit,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  v: string;
  setV: (s: string) => void;
  q: string;
  setQ: (s: string) => void;
  supportsMonthlyQuota: boolean;
  /** `allocated / 12` for the current value of `Allocated` — shown in the
   *  helper text so the admin can compare their override against the
   *  default proration before saving. */
  defaultPerMonth: number | null;
  hasQuotaOverride: boolean;
  commit: () => void;
}) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ paper: { sx: { p: 2, width: 240, borderRadius: 2 } } }}
    >
      <Stack spacing={1.5}>
        <TextField
          value={v}
          size="small"
          type="number"
          autoFocus
          label="Allocated (yearly)"
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') onClose();
          }}
          // step 0.5 supports half-day allocations (e.g. an employee with
          // 9.5 paid leaves for the year). Mongoose stores any number; the
          // earlier integer-only spinner just made decimals look unsupported.
          inputProps={{ min: 0, step: 0.5 }}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        {supportsMonthlyQuota && (
          <Stack spacing={0.75}>
            <TextField
              value={q}
              size="small"
              type="number"
              label="Monthly quota"
              placeholder={defaultPerMonth != null ? String(defaultPerMonth) : ''}
              helperText={
                hasQuotaOverride
                  ? `Override active — type default is ${defaultPerMonth}/mo`
                  : `Type default ${defaultPerMonth}/mo — override for mid-year joiners`
              }
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') onClose();
              }}
              inputProps={{ min: 0, step: 0.5 }}
              InputLabelProps={{ shrink: true }}
              FormHelperTextProps={{ sx: { fontSize: 10, mx: 0 } }}
              fullWidth
            />
            {/* Quick actions for the three common admin operations:
                 - Reset:    drop the override, revert to type default.
                 - +1 / +0.5: bump the current quota for stacking grants.
                 - Set 0:    no monthly accrual (carry-forward only).
                Each just mutates the input — admin still hits Save to persist. */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                disabled={q === '' && !hasQuotaOverride}
                onClick={() => setQ('')}
                sx={{ fontSize: 10, py: 0.25, minWidth: 'auto' }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const baseline = q.trim() === ''
                    ? (defaultPerMonth ?? 0)
                    : Number(q) || 0;
                  setQ(String(baseline + 1));
                }}
                sx={{ fontSize: 10, py: 0.25, minWidth: 'auto' }}
              >
                +1
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setQ('0')}
                sx={{ fontSize: 10, py: 0.25, minWidth: 'auto' }}
              >
                Set 0
              </Button>
            </Stack>
          </Stack>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={commit}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}

const defaultGridSx = {
  border: 'none', fontSize: '0.875rem',
  '& .MuiDataGrid-toolbarContainer': {
    px: 2, py: 1.25, gap: 1, bgcolor: '#fff', borderRadius: '12px',
    border: '1px solid', borderColor: 'grey.200',
    boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)', mb: 1.5,
  },
  '& .MuiDataGrid-main': {
    bgcolor: '#fff', borderRadius: '12px 12px 0 0',
    border: '1px solid', borderColor: 'grey.200', borderBottom: 'none',
    boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)', overflow: 'hidden',
  },
  '& .MuiDataGrid-columnHeaders': { bgcolor: '#F6F9FC' },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8125rem', color: '#2A3547' },
  '& .MuiDataGrid-columnSeparator': { display: 'none' },
  '& .MuiDataGrid-cell': { px: 2, display: 'flex', alignItems: 'center' },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F6F9FC' },
  '& .MuiDataGrid-footerContainer': {
    bgcolor: '#fff', borderRadius: '0 0 12px 12px',
    border: '1px solid', borderColor: 'grey.200',
    boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
  },
};
