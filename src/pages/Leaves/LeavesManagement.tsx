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
  IconPlaneDeparture, IconCalendar, IconChecks, IconPencil, IconArrowBackUp,
  IconFlag, IconSettings, IconPaperclip, IconUpload, IconFileText,
} from '@tabler/icons-react';
import { uploadFile } from '../../services/storageApi';
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
  reseedUserBalances,
  getMyProbationStatus,
  ProbationStatus,
} from '../../services/leaveTypesApi';
import { getLeaves, updateLeave, createLeave, revokeLeave } from '../../services/leavesApi';
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
  type Tab = 'dashboard' | 'requests' | 'types' | 'balances' | 'holidays' | 'settings';
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
        {/* One unified "Holidays" tab: employees see their shift + ALL;
            admins see the full list with country dropdown for management. */}
        <Tab value="holidays" label="Holidays" icon={<IconFlag size={16} />} iconPosition="start" />
        {isAdmin && <Tab value="settings" label="Settings" icon={<IconSettings size={16} />} iconPosition="start" />}
      </Tabs>

      {tab === 'dashboard' && !isAdmin && <MyDashboard />}
      {tab === 'requests' && isAdmin && <AllRequestsPanel />}
      {tab === 'types' && isAdmin && <LeaveTypesPanel />}
      {tab === 'balances' && isAdmin && <EmployeeBalancesPanel />}
      {tab === 'holidays' && (
        <HolidayContextProvider>
          {/* Admins still need to sync both national calendars — show both
              cards stacked. Hidden for non-admins via the `visible` prop. */}
          {isAdmin && (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <SyncHolidaysCard country="IN" visible={isAdmin} />
              <SyncHolidaysCard country="US" visible={isAdmin} />
            </Stack>
          )}
          {/* For admins: full list with country dropdown.
              For employees: filtered to their shift + ALL company-wide. */}
          <HolidayList
            forAdmin={isAdmin}
            lockByUserShift={!isAdmin}
            hideYearSelector
          />
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

            const accent = type.color || tokens.colors.pink;
            const hasMonthlyCap = type.monthlyQuota != null && !type.isUnpaidBucket;
            // Per-month accrual rate to use as the denominator. Prefer
            // the per-user override when present, fall back to the type
            // default.
            const effectiveQuota =
              b.effectiveMonthlyQuota ?? b.monthlyQuota ?? type.monthlyQuota ?? null;
            // Cap the cumulative `monthlyAvailable` (which the server
            // computes as min(monthsElapsed × quota, allocated) - used)
            // at the per-month quota so the employee card reflects
            // STRICT monthly allowance — not the carry-forward stack.
            // Example: quota=1, no usage by June → server returns 6,
            // we display 1. Server-side overflow-to-UL logic still
            // uses the cumulative number; this is a display rule only.
            const cumulativeAvailable = b.monthlyAvailable;
            const monthlyAvailable = (() => {
              if (cumulativeAvailable == null) return cumulativeAvailable;
              if (effectiveQuota == null) return cumulativeAvailable;
              return Math.min(cumulativeAvailable, effectiveQuota);
            })();
            // Employee-facing view shows ONLY the monthly slice — the
            // yearly allocation is admin context and would just confuse
            // the employee at the apply-leave stage. Annual figures
            // stay visible in the admin grid (LeaveBalancesPanel),
            // where they're relevant.
            const monthlyPct =
              effectiveQuota && monthlyAvailable != null
                ? Math.min(
                    Math.max(
                      ((effectiveQuota - monthlyAvailable) / effectiveQuota) * 100,
                      0,
                    ),
                    100,
                  )
                : 0;
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
                  {/* Primary metric: monthly available. */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: tokens.colors.lightText, lineHeight: 1 }}>
                      {monthlyAvailable != null ? monthlyAvailable : '—'}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
                      {hasMonthlyCap && effectiveQuota
                        ? `/ ${effectiveQuota} this month`
                        : 'available'}
                    </Typography>
                  </Box>
                  {hasMonthlyCap && effectiveQuota != null && (
                    <LinearProgress
                      variant="determinate"
                      value={monthlyPct}
                      sx={{
                        height: 6, borderRadius: 3, bgcolor: alpha(accent, 0.1),
                        '& .MuiLinearProgress-bar': { bgcolor: accent },
                      }}
                    />
                  )}
                  <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, mt: 0.5 }}>
                    {hasMonthlyCap ? 'Monthly accrual' : 'Available balance'} · {type.paid ? 'Paid' : 'Unpaid'}
                  </Typography>
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
    // Revoked = HR undid an Approved leave. Rendered with the same
    // muted grey as "cancelled" states elsewhere in the app.
    [LeaveStatus.Revoked]: { bg: alpha('#64748B', 0.14), color: '#475569' },
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
  // Probation snapshot — drives the type filter (UL-only) and the
  // banner shown at the top of the dialog. Best-effort: if the lookup
  // fails the user is treated as non-probation so the dialog stays
  // usable; the server-side guard still 400s for any genuinely-on-
  // probation user who tries to apply for paid leave.
  const [probation, setProbation] = useState<ProbationStatus | null>(null);
  // Uploaded supporting documents (e.g. medical certificate for ML).
  // Stored as DO Spaces URLs once each upload succeeds — losing a
  // re-render mid-upload doesn't lose progress because the URL is the
  // single source of truth (the picked File is not retained).
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Filter the type picker:
  //  - probationary users see ONLY the unpaid bucket (UL) since they
  //    don't accrue any paid balance during probation;
  //  - everyone else sees only the paid types — the dialog's footer
  //    note explains the auto-overflow to UL on insufficient balance.
  const visibleTypes = useMemo(() => {
    if (probation?.onProbation) {
      return types.filter((t) => t.active && t.isUnpaidBucket);
    }
    return types.filter((t) => t.active && !t.isUnpaidBucket);
  }, [types, probation]);

  // Derive the selected type so we can light up the attachment block
  // for types that mandate supporting documentation (Medical Leave).
  const selectedType = useMemo(
    () => types.find((t) => t._id === form.leaveTypeId),
    [types, form.leaveTypeId],
  );
  // Attachment requirement is gated on TWO conditions:
  //   1. either the type's `requiresAttachment` flag is true OR the
  //      canonical Medical Leave code ("ML") is selected, AND
  //   2. it's NOT the unpaid bucket (UL).
  //
  // Rule (2) protects against a careless admin (or stale data) that
  // accidentally turned the flag on for UL — Unpaid Leave is loss-of-
  // pay, not a medical claim, so demanding a doctor's note for it is
  // never the right ask.
  //
  // The OR on `code === 'ML'` is the hard guarantee: even when an
  // older DB row never had `requiresAttachment` set, picking Medical
  // Leave still shows the attachment block. The server's self-heal
  // will eventually flip the flag, but this keeps the UI correct in
  // the meantime.
  const isMedicalLeaveCode = (selectedType?.code || '').toUpperCase() === 'ML';
  const requiresAttachment =
    (!!selectedType?.requiresAttachment || isMedicalLeaveCode) &&
    !selectedType?.isUnpaidBucket;

  useMemo(() => {
    (async () => {
      try {
        // Fetch types + probation in parallel. Probation is best-
        // effort — older servers without the endpoint return a
        // shape that triggers the catch, and we degrade to
        // non-probation so the dialog remains usable.
        const [typesRes, probationData] = await Promise.all([
          listLeaveTypes(),
          getMyProbationStatus()
            .then((r) => r.data)
            .catch(() => ({ onProbation: false } as ProbationStatus)),
        ]);
        const data = typesRes.data || [];
        setTypes(data);
        setProbation(probationData);
        // Default-pick honours the same rule as the dropdown filter:
        // probation users default to UL; everyone else defaults to
        // Paid Leave (code "PL"). Falling back to "first paid non-UL"
        // covers the edge case where an org renamed/removed PL.
        // Explicit PL preference avoids defaulting to Medical Leave
        // (which alphabetically sorts above PL) — picking ML by
        // default would surface the "supporting document required"
        // block on every open, which is the wrong primary action.
        if (data.length && !form.leaveTypeId) {
          const onProb = !!probationData?.onProbation;
          const firstChoice = onProb
            ? data.find((t) => t.active && t.isUnpaidBucket)
            : data.find(
                (t) =>
                  t.active &&
                  t.paid &&
                  !t.isUnpaidBucket &&
                  (t.code || '').toUpperCase() === 'PL',
              ) ||
              data.find((t) => t.active && t.paid && !t.isUnpaidBucket) ||
              data[0];
          if (firstChoice) {
            setForm((f) => ({ ...f, leaveTypeId: firstChoice._id }));
          }
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
    // Attachment gate — the server enforces the same check, but
    // surfacing it client-side avoids a needless round-trip and the
    // user gets a clean toast instead of a 400.
    if (requiresAttachment && attachments.length === 0) {
      toast.error(
        `${selectedType?.name || 'This leave type'} requires supporting documentation. Please attach a file before submitting.`,
      );
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
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      toast.success('Leave request submitted');
      // Reset attachments so a new request next time starts clean.
      setAttachments([]);
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to submit leave');
    } finally {
      setSaving(false);
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Upload sequentially — leave attachments are rarely more than a
      // couple of files, and sequential keeps error attribution simple.
      for (const file of Array.from(files)) {
        const res = await uploadFile(file, 'docn');
        const url = res.data?.data?.url;
        if (url) setAttachments((prev) => [...prev, url]);
      }
    } catch {
      toast.error('Upload failed. Try again.');
    } finally {
      setUploading(false);
      // Reset the input so picking the same file again re-fires change.
      e.target.value = '';
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Probation banner — visible only when the user is in the
              probation window. The picker below is auto-narrowed to
              UL when this is true. */}
          {probation?.onProbation && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha('#f59e0b', 0.4),
                bgcolor: alpha('#f59e0b', 0.08),
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: '#92400e' }}>
                Probation period
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#78350f', mt: 0.25 }}>
                Paid leaves aren&rsquo;t available until{' '}
                {probation.probationEnd
                  ? moment(probation.probationEnd).format('DD MMM YYYY')
                  : 'your probation ends'}
                . Any leave during this period must be filed as Unpaid Leave (UL).
              </Typography>
            </Box>
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>Leave type</InputLabel>
            <Select
              label="Leave type"
              value={form.leaveTypeId}
              onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
            >
              {visibleTypes.map((t) => (
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

          {/* Attachment block — shown when the picked leave type
              requires supporting documentation (e.g. Medical Leave).
              Files upload inline; the URL is stored in `attachments`
              and persists across re-renders even if MUI tears down
              the inner file input. */}
          {requiresAttachment && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: attachments.length === 0
                  ? alpha('#EF4444', 0.4)
                  : alpha(tokens.colors.success, 0.4),
                bgcolor: attachments.length === 0
                  ? alpha('#EF4444', 0.04)
                  : alpha(tokens.colors.success, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <IconPaperclip size={16} color={tokens.colors.pink} />
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                  Supporting document required
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                {/* Medical Leave is the canonical use case (medical
                    cert / doctor's note); other admin-flagged types
                    get a generic "supporting documentation" prompt. */}
                {selectedType?.code === 'ML'
                  ? <>Medical Leave needs a medical certificate or doctor&rsquo;s note. Attach at least one PDF or image before submitting.</>
                  : <>{selectedType?.name || 'This leave type'} needs supporting documentation. Attach at least one PDF or image before submitting.</>}
              </Typography>

              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={
                  uploading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <IconUpload size={14} />
                  )
                }
                disabled={uploading || saving}
                sx={{ textTransform: 'none' }}
              >
                {uploading ? 'Uploading…' : 'Attach file'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="application/pdf,image/*"
                  onChange={handleFilePick}
                />
              </Button>

              {attachments.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                  {attachments.map((url, idx) => (
                    <Stack
                      key={url + idx}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <IconFileText size={14} color={tokens.colors.lightTextSecondary} />
                      <Typography
                        sx={{
                          fontSize: 12,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: tokens.colors.blue,
                            textDecoration: 'none',
                          }}
                        >
                          Attachment {idx + 1}
                        </a>
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        disabled={saving}
                      >
                        <IconX size={14} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {!probation?.onProbation && (
            <Typography variant="caption" color="text.secondary">
              If your balance is insufficient, the leave will be reclassified to Unpaid Leave (UL) on approval.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          // Block submit while an upload is in-flight or the required
          // attachment for the picked type is still missing. Server
          // enforces the same; this is the cooperative UI.
          disabled={
            saving ||
            uploading ||
            (requiresAttachment && attachments.length === 0)
          }
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
  const { iUser: me } = useAuth();
  const canRevoke =
    !!me?.role?.includes(UserRole['super-admin']) ||
    !!me?.role?.includes(UserRole.admin) ||
    !!me?.role?.includes(UserRole.hr);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>(LeaveStatus.Pending);
  const [pending, setPending] = useState<{ leave: iLeave; status: LeaveStatus } | null>(null);
  // Free-text reason captured only when rejecting. Persisted to
  // Leave.rejectionReason so the employee sees why + the audit trail
  // survives.
  const [rejectReason, setRejectReason] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  // Revoke dialog state — separate from the approve/reject flow because
  // it needs its own free-text reason input.
  const [revokeTarget, setRevokeTarget] = useState<iLeave | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const { data, loading, loadData } = useFetchData<iLeave[]>(async () => {
    const q = new URLSearchParams({ limit: '500' });
    if (statusFilter !== 'all') q.set('status', statusFilter);
    const res = await getLeaves(q.toString());
    const pr = res.data.data as PaginationResult<iLeave>;
    return pr.results || [];
  }, [statusFilter]);

  async function handleConfirm() {
    if (!pending) return;
    // Reject flow: reason is required — the server has no schema
    // constraint on it (Leave.rejectionReason is a free-text string),
    // so we enforce it here. Trim to defeat whitespace-only input.
    if (
      pending.status === LeaveStatus.Rejected &&
      !rejectReason.trim()
    ) {
      toast.error('Please add a rejection reason');
      return;
    }
    setDecisionSubmitting(true);
    try {
      const body: Partial<iLeave> = { status: pending.status };
      if (pending.status === LeaveStatus.Rejected) {
        body.rejectionReason = rejectReason.trim();
      }
      await updateLeave(pending.leave._id, body);
      toast.success(`Leave ${pending.status.toLowerCase()}`);
      setPending(null);
      setRejectReason('');
      loadData();
    } catch {
      toast.error('Failed to update');
    } finally {
      setDecisionSubmitting(false);
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
      field: 'actions', headerName: '', width: 160, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        if (row.status === LeaveStatus.Pending) {
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  onClick={() => {
                    setRejectReason('');
                    setPending({ leave: row, status: LeaveStatus.Approved });
                  }}
                >
                  <IconCheck size={16} color={tokens.colors.success} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  onClick={() => {
                    setRejectReason('');
                    setPending({ leave: row, status: LeaveStatus.Rejected });
                  }}
                >
                  <IconX size={16} color={tokens.colors.error} />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }
        // Approved → offer Revoke (HR/Admin/SuperAdmin only). Restores
        // the balance + unmarks the attendance stamps + flips status to
        // Revoked so the employee can apply for a fresh date.
        if (row.status === LeaveStatus.Approved && canRevoke) {
          return (
            <Tooltip title="Revoke leave (restore balance)">
              <IconButton
                size="small"
                onClick={() => {
                  setRevokeTarget(row);
                  setRevokeReason('');
                }}
              >
                <IconArrowBackUp size={16} color="#475569" />
              </IconButton>
            </Tooltip>
          );
        }
        return null;
      },
    },
  ], [canRevoke]);

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

      {/* Approve / reject decision dialog — richer than a plain confirm
          so the admin can review the applicant's uploaded attachments
          (e.g. medical certificates) before deciding, and so rejections
          capture a mandatory reason that lands on Leave.rejectionReason
          for audit + the applicant's email. */}
      <Dialog
        open={!!pending}
        onClose={decisionSubmitting ? undefined : () => setPending(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: isApprove ? tokens.colors.success : tokens.colors.error,
          }}
        >
          {isApprove
            ? <IconCheck size={22} stroke={2.5} />
            : <IconX size={22} stroke={2.5} />}
          {isApprove ? 'Approve this leave request?' : 'Reject this leave request?'}
        </DialogTitle>
        <DialogContent dividers>
          {pending && (
            <Stack spacing={2}>
              {/* Applicant + range + reason */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {pending.leave.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {moment(pending.leave.startDate).format('DD MMM')} —{' '}
                  {moment(pending.leave.endDate).format('DD MMM YYYY')}
                  {pending.leave.isHalfDay && ` · ${pending.leave.halfDayType}`}
                  {' '}· {daysLabel}
                  {' '}·{' '}
                  {pending.leave.type || pending.leave.leaveType || '—'}
                </Typography>
                {pending.leave.reason && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, fontStyle: 'italic' }}
                  >
                    “{pending.leave.reason}”
                  </Typography>
                )}
              </Box>

              {/* Attachments — one click each opens the file in a new
                  tab so the admin can preview the medical certificate /
                  supporting doc. Rendered even for empty arrays so the
                  admin always knows whether one was attached. */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: tokens.colors.lightTextSecondary,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Attachments
                </Typography>
                {pending.leave.attachments && pending.leave.attachments.length > 0 ? (
                  <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                    {pending.leave.attachments.map((url, i) => {
                      const fileName =
                        (() => {
                          try {
                            const u = new URL(url);
                            const last = u.pathname.split('/').pop() || `File ${i + 1}`;
                            return decodeURIComponent(last);
                          } catch {
                            return `File ${i + 1}`;
                          }
                        })();
                      return (
                        <Button
                          key={url + i}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          startIcon={<IconPaperclip size={14} />}
                          sx={{
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            color: tokens.colors.primary,
                            bgcolor: alpha(tokens.colors.primary, 0.06),
                            '&:hover': {
                              bgcolor: alpha(tokens.colors.primary, 0.12),
                            },
                            px: 1.25,
                            py: 0.5,
                          }}
                        >
                          {fileName}
                        </Button>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    No attachments uploaded.
                  </Typography>
                )}
              </Box>

              {/* Reject-only reason input. Required — validation lives
                  in handleConfirm; button also disables when empty. */}
              {!isApprove && (
                <TextField
                  label="Rejection reason"
                  placeholder="Explain why you're rejecting — the applicant will see this in the notification email."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  multiline
                  minRows={3}
                  required
                  fullWidth
                  autoFocus
                  disabled={decisionSubmitting}
                />
              )}

              <Typography variant="caption" color="text.secondary">
                {isApprove
                  ? 'The applicant will be emailed and their attendance auto-marked.'
                  : 'The applicant will be notified by email with the reason above.'}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPending(null)}
            disabled={decisionSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Keep reviewing
          </Button>
          <Button
            variant="contained"
            color={isApprove ? 'success' : 'error'}
            onClick={handleConfirm}
            disabled={
              decisionSubmitting ||
              (!isApprove && !rejectReason.trim())
            }
            startIcon={
              decisionSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : isApprove ? (
                <IconCheck size={16} />
              ) : (
                <IconX size={16} />
              )
            }
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isApprove ? 'Yes, approve' : 'Yes, reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke dialog — free-text reason input separate from the
          approve/reject ConfirmDialog above. The server refuses if any
          month in the leave range already has a published salary slip;
          that error surfaces as a toast. */}
      <Dialog
        open={!!revokeTarget}
        onClose={revoking ? undefined : () => setRevokeTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Revoke this approved leave?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This restores the employee's leave balance, unmarks the
              attendance stamps for those days, and flips the status to
              Revoked. The employee will be notified — they can then
              apply for a new date.
            </Typography>
            {revokeTarget && (
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: alpha('#64748B', 0.06),
                  border: `1px solid ${alpha('#64748B', 0.15)}`,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                  {revokeTarget.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {moment(revokeTarget.startDate).format('DD MMM')} —{' '}
                  {moment(revokeTarget.endDate).format('DD MMM YYYY')}
                  {revokeTarget.isHalfDay && ` · ${revokeTarget.halfDayType}`}
                </Typography>
              </Box>
            )}
            <TextField
              size="small"
              label="Reason (optional)"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              disabled={revoking}
              multiline
              minRows={2}
              maxRows={4}
              helperText="Shown in the notification the employee receives."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRevokeTarget(null)}
            disabled={revoking}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={revoking || !revokeTarget}
            onClick={async () => {
              if (!revokeTarget) return;
              setRevoking(true);
              try {
                await revokeLeave(revokeTarget._id, revokeReason.trim() || undefined);
                toast.success('Leave revoked — balance restored');
                setRevokeTarget(null);
                setRevokeReason('');
                loadData();
              } catch (e: unknown) {
                const msg =
                  (e as { response?: { data?: { error?: string } } })?.response
                    ?.data?.error || 'Failed to revoke leave';
                toast.error(msg);
              } finally {
                setRevoking(false);
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#475569',
              '&:hover': { bgcolor: '#334155' },
            }}
          >
            {revoking ? 'Revoking…' : 'Revoke leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE TYPES TAB (admin)
// ─────────────────────────────────────────────────────────────────────────────
function LeaveTypesPanel() {
  // Show only active types by default — soft-deleted ones used to
  // linger in the listing, which made "delete" look broken because
  // the row stayed visible (just with active=false). Admins can flip
  // the toggle below to audit the full history.
  const [showInactive, setShowInactive] = useState(false);
  const { data: types, loadData, loading } = useFetchData<LeaveType[]>(async () => {
    const { data } = await listLeaveTypes(showInactive);
    return data || [];
  }, [showInactive]);
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
              if (
                !window.confirm(
                  `Delete "${row.name}"? Past leaves/balances that reference this type will keep working; the type just won't appear in new requests.`,
                )
              )
                return;
              try {
                const res = await deleteLeaveType(row._id);
                // Server returns { hardDeleted: true } when no refs
                // exist and the doc was fully removed; otherwise it
                // soft-deleted and tells us why. Surface either path
                // so admins know which one happened.
                const r = (res as unknown as {
                  data?: { hardDeleted?: boolean };
                  message?: string;
                });
                toast.success(
                  r?.message ||
                    (r?.data?.hardDeleted
                      ? `"${row.name}" deleted.`
                      : `"${row.name}" deactivated.`),
                );
              } catch (e) {
                toast.error(
                  (e as { response?: { data?: { error?: string } } })
                    ?.response?.data?.error || 'Failed to delete.',
                );
              }
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Leave Types</Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Show inactive
              </Typography>
            }
          />
          <Button
            variant="contained" startIcon={<IconPlus size={16} />}
            onClick={() => setAdding(true)}
            sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
          >
            Add Type
          </Button>
        </Stack>
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
          <FormControlLabel
            control={
              <Switch
                checked={!!form.requiresAttachment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requiresAttachment: e.target.checked }))
                }
              />
            }
            label="Requires attachment on apply (e.g. medical certificate)"
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

  // Per-row reseed busy state — keyed by userId so each row's spinner
  // is independent. Confirm dialog is the same pattern the bulk reset
  // uses; the action itself is destructive (overwrites `used` too),
  // so we make sure HR agrees before firing.
  const [reseedBusy, setReseedBusy] = useState<string | null>(null);
  const [pendingUserReseed, setPendingUserReseed] = useState<iUser | null>(null);
  async function runUserReseed(u: iUser) {
    setReseedBusy(u._id);
    try {
      const { data: result } = await reseedUserBalances(u._id, year);
      toast.success(
        `${u.firstName} ${u.lastName}'s balances reseeded — ${result.upserted} rows updated (multiplier ${result.multiplier}).`,
      );
      loadData();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        'Reseed failed.';
      toast.error(msg);
    } finally {
      setReseedBusy(null);
      setPendingUserReseed(null);
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
                {types.map((t) => {
                  // Render a short policy hint under the column code so
                  // admins can immediately tell "PL = 1/mo accrual, 12
                  // yearly" without opening a tooltip. Without this hint
                  // the big number in each cell ("9") was ambiguous —
                  // is it monthly? yearly? remaining? Now the column
                  // header anchors it.
                  const policyHint =
                    t.isUnpaidBucket
                      ? 'unpaid · days taken'
                      : t.monthlyQuota != null
                        ? `${t.monthlyQuota}/mo · ${t.defaultAllocationPerYear ?? 0}/yr`
                        : `${t.defaultAllocationPerYear ?? 0}/yr`;
                  return (
                    <Box component="th" key={t._id} sx={{
                      p: 1.5, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#2A3547',
                      minWidth: 110,
                    }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color || tokens.colors.pink }} />
                        <span>{t.code}</span>
                      </Stack>
                      <Typography sx={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: tokens.colors.lightTextSecondary,
                        mt: 0.25,
                        letterSpacing: 0.2,
                      }}>
                        {policyHint}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Box component="tbody">
              {users.map((u) => (
                <Box component="tr" key={u._id} sx={{ '&:hover': { bgcolor: '#F6F9FC' } }}>
                  <Box component="td" sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'grey.100' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {u.firstName} {u.lastName}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                          {u.email}
                        </Typography>
                      </Box>
                      {/* Per-user reseed — opens a confirm dialog so the
                          destructive overwrite ("used" resets to 0) is
                          explicit. Useful when policy changed and HR
                          wants to migrate a single employee without
                          touching everyone. */}
                      <Tooltip title={`Reseed ${u.firstName}'s balances for ${year} from current LeaveType defaults (resets used)`}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={reseedBusy === u._id}
                            onClick={() => setPendingUserReseed(u)}
                          >
                            {reseedBusy === u._id ? (
                              <CircularProgress size={14} />
                            ) : (
                              <IconRefresh size={14} color={tokens.colors.blue} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
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
                          leaveStartMonth={bal?.leaveStartMonth}
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

      {/* Per-user reseed — used when an HR change (new leave type, changed
          monthlyQuota / yearly allocation) needs to migrate ONE employee
          without disturbing the rest. Same destructive contract as the
          force-reset above: allocated + monthly quota come from the current
          LeaveType defaults, `used` resets to 0 for the year. */}
      <ConfirmDialog
        open={pendingUserReseed != null}
        onClose={() => setPendingUserReseed(null)}
        onConfirm={async () => {
          if (pendingUserReseed) await runUserReseed(pendingUserReseed);
        }}
        tone="danger"
        title={
          pendingUserReseed
            ? `Reseed ${pendingUserReseed.firstName} ${pendingUserReseed.lastName}'s balances for ${year}?`
            : 'Reseed balances?'
        }
        confirmLabel="Yes, reseed"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              Overwrites this employee&rsquo;s allocations and monthly quotas for {year} using the <strong>current LeaveType defaults</strong>. Their <strong>used</strong> counter for every leave type also resets to <strong>0</strong>.
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
                Any per-user overrides on allocation or monthly quota for this employee will be lost. Their approved-leave history stays in place, but those days will no longer show as &ldquo;used&rdquo; against {year} balances.
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Use when you&rsquo;ve changed a LeaveType policy (e.g. switched paid leave to 1/month) and want this one employee to pick up the new defaults without touching everyone else.
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
  leaveStartMonth,
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
  /** 1-indexed month accrual begins. > 1 indicates a probationary
   *  joiner; the cell renders a "Starts <MMM>" hint so it's obvious
   *  the allocation is dormant until then. */
  leaveStartMonth?: number | null;
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

  // Probation-aware accrual start. We only treat the row as "probationary"
  // for display purposes if accrual has NOT yet started — i.e. the
  // leave-start month is still in the future relative to TODAY. Once the
  // user crosses that month, the row should look identical to a non-
  // probationary one: monthlyAvailable already reflects the real accrual,
  // and a "Starts Apr 1" chip in June is just misleading clutter.
  const currentMonthIdx = moment().month() + 1; // 1..12
  // Server uses `leaveStartMonth = 13` as a SENTINEL for "probation in
  // progress, nothing accrues this year — leaves will be prorated from
  // the admin-set confirmation date once HR confirms via the Onboarding
  // / Probation Approvals tab". Treating 13 as a real month number
  // breaks badly: `new Date(2000, 12, 1)` wraps to January 2001 and the
  // cell ends up labelling Satvik-joined-Jun-2026 as "Starts Jan 1".
  // Branch the sentinel case so it renders a clear "Awaiting probation
  // confirmation" pill instead of a misleading start-month chip.
  const isPendingProbation =
    hasRow && leaveStartMonth === 13;
  const hasFutureStartMonth =
    hasRow &&
    typeof leaveStartMonth === 'number' &&
    leaveStartMonth > 1 &&
    leaveStartMonth <= 12;
  // Only render the "Starts MMM 1" chip when accrual is genuinely in
  // the future calendar month. Past-month hints (e.g. June showing
  // "Starts Apr 1") cause more confusion than they prevent.
  const isProbationary =
    hasFutureStartMonth && (leaveStartMonth as number) > currentMonthIdx;
  const startMonthLabel = hasFutureStartMonth
    ? new Date(2000, (leaveStartMonth as number) - 1, 1).toLocaleString(
        undefined,
        { month: 'short' },
      )
    : null;

  // Effective per-month accrual rate (override → type default). Drives
  // the "(1/mo)" hint in the tooltip so admins can confirm policy without
  // opening the editor.
  const perMonthRate = supportsMonthlyQuota
    ? (monthlyQuotaOverride ?? (monthlyQuota as number))
    : null;

  const tooltipBase = hasRow
    ? `Yearly allocation: ${allocated} · Used so far: ${used}`
    : 'Click to set allocation';
  const tooltipProbation = isPendingProbation
    ? ' · Awaiting probation confirmation — leaves will be prorated from the confirmation date set on the Onboarding tab.'
    : isProbationary
      ? ` · Accrual starts ${startMonthLabel} 1 (probation period)`
      : '';
  const tooltipMonthly = hasRow && monthlyAvailable != null && perMonthRate != null
    ? ` · Available this month: ${monthlyAvailable} (${perMonthRate}/mo + carry-forward)`
    : '';
  const tooltipEdit = hasRow ? ' · Click to edit allocation' : '';

  // Two display modes. When the type has a monthlyQuota, the headline
  // number is "what can they take THIS MONTH" (carry-forward aware).
  // Otherwise (UL / ML without quota) we fall back to yearly remaining.
  // The user explicitly asked for crystal-clear "yearly vs monthly"
  // separation in the listing, so we always show both lines, labelled.
  const showMonthly = hasRow && monthlyAvailable != null && perMonthRate != null;
  const headlineValue = showMonthly ? monthlyAvailable : remaining;
  const headlineColor = !hasRow
    ? tokens.colors.lightTextSecondary
    : isOverUsed
      ? tokens.colors.error
      : (headlineValue ?? 0) === 0
        ? tokens.colors.warning
        : tokens.colors.pink;

  return (
    <>
      <Tooltip
        title={`${tooltipBase}${tooltipProbation}${tooltipMonthly}${tooltipEdit}`}
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
          {/* Headline — "Available now" is what admins are scanning for
              when triaging "can this employee take a leave next week?". */}
          <Typography sx={{
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1,
            color: headlineColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {hasRow ? headlineValue : '—'}
          </Typography>
          <Typography sx={{
            fontSize: 9,
            color: tokens.colors.lightTextSecondary,
            mt: 0.25,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            {hasRow
              ? showMonthly
                ? 'available this month'
                : 'available yearly'
              : 'not seeded'}
          </Typography>
          {/* Yearly breakdown — small, neutral, always present so admins
              can answer "how many total this year?" without opening the
              tooltip. Shows used + total side-by-side. */}
          {hasRow && (
            <Typography sx={{
              fontSize: 10,
              color: tokens.colors.lightTextSecondary,
              mt: 0.5,
              fontVariantNumeric: 'tabular-nums',
            }}>
              Used <strong style={{ color: tokens.colors.lightText }}>{used}</strong>
              {' / '}
              Yearly <strong style={{ color: tokens.colors.lightText }}>{allocated}</strong>
            </Typography>
          )}
          {/* Probation chip — three states:
              1. Pending confirmation (sentinel startMonth=13) → "Awaiting
                 confirmation". Tells admin the employee is in probation
                 and leaves will be prorated from the date HR enters on
                 the Onboarding / Probation Approvals tab.
              2. Future start month (e.g. confirmed July, currently May)
                 → "Starts Jul 1".
              3. Past or no start month → no chip (accrual already live;
                 monthlyAvailable reflects it).
              Earlier versions of this code couldn't tell #1 apart from
              #2 and treated 13 as a real month, wrapping it to January
              and displaying "Starts Jan 1" — that was the Satvik bug. */}
          {isPendingProbation && (
            <Typography sx={{
              fontSize: 9.5,
              color: tokens.colors.warning,
              fontWeight: 700,
              mt: 0.25,
              letterSpacing: 0.3,
              lineHeight: 1.2,
            }}>
              Awaiting confirmation
            </Typography>
          )}
          {isProbationary && !isPendingProbation && (
            <Typography sx={{
              fontSize: 9.5,
              color: tokens.colors.warning,
              fontWeight: 700,
              mt: 0.25,
              letterSpacing: 0.3,
            }}>
              Starts {startMonthLabel} 1
            </Typography>
          )}
          {/* "custom" marker stays — visually different from probation
              and admins find it useful to see at-a-glance which cells
              have per-user overrides without checking the tooltip. */}
          {hasRow && hasQuotaOverride && !isProbationary && !isPendingProbation && (
            <Typography sx={{
              fontSize: 9.5,
              color: tokens.colors.blue,
              fontWeight: 700,
              mt: 0.25,
              letterSpacing: 0.3,
            }}>
              custom quota
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
      slotProps={{ paper: { sx: { p: 2, width: 280, borderRadius: 2 } } }}
    >
      <Stack spacing={1.5}>
        {/* Header — anchors the form so admins know they're editing one
            employee's leave allocation, not a global policy. Without it
            the popover felt like a settings dialog. */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.colors.lightText }}>
            Edit leave allocation
          </Typography>
          <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, mt: 0.25 }}>
            Overrides apply to this employee only.
          </Typography>
        </Box>

        {/* Yearly total — relabelled from cryptic "Allocated (yearly)"
            to plain English so first-time admins don't have to guess. */}
        <TextField
          value={v}
          size="small"
          type="number"
          autoFocus
          label="Total leaves for the year"
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') onClose();
          }}
          helperText="Annual cap. The employee won't accrue more than this in a year."
          // step 0.5 supports half-day allocations (e.g. an employee with
          // 9.5 paid leaves for the year). Mongoose stores any number; the
          // earlier integer-only spinner just made decimals look unsupported.
          inputProps={{ min: 0, step: 0.5 }}
          InputLabelProps={{ shrink: true }}
          FormHelperTextProps={{ sx: { fontSize: 10, mx: 0 } }}
          fullWidth
        />
        {supportsMonthlyQuota && (
          <Stack spacing={0.75}>
            <TextField
              value={q}
              size="small"
              type="number"
              label="Accrued each month"
              placeholder={defaultPerMonth != null ? String(defaultPerMonth) : ''}
              helperText={
                hasQuotaOverride
                  ? `Custom rate set — leave blank to revert to the policy default (${defaultPerMonth}/mo).`
                  : `Policy default ${defaultPerMonth}/mo. Override here for mid-year joiners or special arrangements.`
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
            {/* Quick actions — relabelled for clarity. Previously
                "Reset / +1 / Set 0" gave no hint what they did. */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Tooltip title={`Revert to the leave-type's default (${defaultPerMonth}/mo)`}>
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={q === '' && !hasQuotaOverride}
                    onClick={() => setQ('')}
                    sx={{ fontSize: 10, py: 0.25, minWidth: 'auto' }}
                  >
                    Use default
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Add 1 leave to this employee's monthly accrual">
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
                  +1/mo
                </Button>
              </Tooltip>
              <Tooltip title="No leaves accrue each month (existing yearly balance still applies)">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQ('0')}
                  sx={{ fontSize: 10, py: 0.25, minWidth: 'auto' }}
                >
                  Pause accrual
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        )}
        {/* What-changes summary — translates the two numbers into plain
            English so the admin can verify intent before hitting Save.
            E.g. "9 yearly · 1 per month — employee accrues 1 leave each
            month, capped at 9 for the year." */}
        {supportsMonthlyQuota && (
          <Box sx={{
            p: 1, borderRadius: 1.5,
            bgcolor: alpha(tokens.colors.blue, 0.06),
            border: `1px solid ${alpha(tokens.colors.blue, 0.18)}`,
          }}>
            <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, lineHeight: 1.4 }}>
              {(() => {
                const yearly = Number(v) || 0;
                const rate = q.trim() === ''
                  ? (defaultPerMonth ?? 0)
                  : Number(q) || 0;
                if (rate === 0) {
                  return `Employee gets ${yearly} leaves for the year. No monthly accrual — they can use the full ${yearly} whenever needed.`;
                }
                return `Employee accrues ${rate} leave${rate === 1 ? '' : 's'} per month, capped at ${yearly} for the year. Unused months carry forward.`;
              })()}
            </Typography>
          </Box>
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
