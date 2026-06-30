import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconCalendarTime,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClipboardCheck,
  IconCloudUpload,
  IconDeviceFloppy,
  IconFileInvoice,
  IconPhoto,
  IconSend,
  IconTrash,
  IconX,
  IconZoomIn,
} from '@tabler/icons-react';
import { tokens } from '../../../../theme/theme';
import { IProject } from '../../../../Interfaces/project';
import {
  ITimesheet,
  ITimesheetApproval,
  ITimesheetEntry,
  ITimesheetScreenshot,
  TimesheetApprovalStatus,
} from '../../../../Interfaces/timesheet';
import { UserRole } from '../../../../Interfaces/iUser';
import { useAuth } from '../../../../AuthGaurd/AuthContextProvider';
import {
  approveApproval,
  getApproval,
  rejectApproval,
  submitApproval,
} from '../../../../services/timesheetApprovalApi';
import {
  addTimesheetScreenshot,
  getTimesheetByMonth,
  markTimesheetComplete,
  removeTimesheetScreenshot,
  upsertTimesheet,
} from '../../../../services/timesheetApi';
import { uploadFile } from '../../../../services/storageApi';
import { generateInvoiceOverride } from '../../../../services/invoiceApi';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';

interface Props {
  project: IProject;
  /** Deep-link target — YYYY-MM. When set on open, panel opens at this month
   *  instead of the current one. Used by email "Review" CTAs. */
  initialPeriodMonth?: string;
  /** Fired when an invoice is auto-generated (after approve or override). */
  onInvoiceMaybeCreated?: () => void;
}

type DayCell = { date: string; hours: number | null };

function buildBlankMonth(periodMonth: string): DayCell[] {
  const start = moment(periodMonth + '-01', 'YYYY-MM-DD', true);
  const n = start.daysInMonth();
  return Array.from({ length: n }, (_, i) => ({
    date: start.clone().add(i, 'day').format('YYYY-MM-DD'),
    hours: null,
  }));
}

function hydrateMonth(
  periodMonth: string,
  stored?: ITimesheet | null
): DayCell[] {
  const blank = buildBlankMonth(periodMonth);
  if (!stored) return blank;
  const map = new Map(stored.entries.map((e) => [e.date, e.hours]));
  return blank.map((c) =>
    map.has(c.date) ? { date: c.date, hours: map.get(c.date) ?? 0 } : c
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 10-year window centered on the current year (5 back, current, 4 forward). */
function buildYearOptions(): number[] {
  const now = moment().year();
  return Array.from({ length: 10 }, (_, i) => now - 5 + i);
}

const APPROVAL_STATUS_COLORS: Record<TimesheetApprovalStatus, string> = {
  Pending: '#5A6A85',
  Requested: tokens.colors.blueDark,
  Approved: '#10B981',
  Rejected: '#EF4444',
};

export default function TimesheetsPanel({
  project,
  initialPeriodMonth,
  onInvoiceMaybeCreated,
}: Props) {
  const yearOptions = useMemo(buildYearOptions, []);
  const [periodMonth, setPeriodMonth] = useState<string>(
    () => initialPeriodMonth || moment().format('YYYY-MM')
  );
  // If a deep-link lands while the panel is already mounted (e.g. user has
  // the drawer open when clicking a second email link), jump to the new
  // month.
  useEffect(() => {
    if (initialPeriodMonth && initialPeriodMonth !== periodMonth) {
      setPeriodMonth(initialPeriodMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPeriodMonth]);

  const [doc, setDoc] = useState<ITimesheet | null>(null);
  const [cells, setCells] = useState<DayCell[]>(() => buildBlankMonth(periodMonth));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Monthly approval + generate flow state
  const [approval, setApproval] = useState<ITimesheetApproval | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [override, setOverride] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [acting, setActing] = useState<'approve' | 'reject' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [markCompleteOpen, setMarkCompleteOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  const { iUser } = useAuth();
  const isSuperAdmin = iUser?.role?.includes(UserRole['super-admin']) || false;
  const isAdmin = iUser?.role?.includes(UserRole.admin) || false;
  const canOverride = isSuperAdmin || isAdmin;

  // Edit lock: only marketing/project-coordinator are locked when the month
  // is under review. Admin/super-admin can always edit.
  const lockedForViewer = useMemo(() => {
    if (canOverride) return false;
    if (!approval) return false;
    return ['Requested', 'Approved'].includes(approval.status);
  }, [approval, canOverride]);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    try {
      const [tsRes, apRes] = await Promise.all([
        getTimesheetByMonth(project._id, periodMonth),
        getApproval(project._id, periodMonth),
      ]);
      const stored = tsRes.data?.data || null;
      setDoc(stored);
      setCells(hydrateMonth(periodMonth, stored));
      setApproval(apRes.data?.data || null);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, [project._id, periodMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Reset override + switch the cells skeleton when the month changes.
  useEffect(() => {
    setOverride(false);
  }, [periodMonth]);

  const setCell = (idx: number, raw: string) => {
    if (raw === '') {
      setCells((prev) => prev.map((c, i) => (i === idx ? { ...c, hours: null } : c)));
    } else {
      const n = Number(raw);
      const safe = Number.isFinite(n) ? Math.max(0, Math.min(24, n)) : 0;
      setCells((prev) => prev.map((c, i) => (i === idx ? { ...c, hours: safe } : c)));
    }
    setDirty(true);
  };

  const totalHours = cells.reduce(
    (acc, c) => acc + (c.hours != null ? c.hours : 0),
    0
  );
  const filledCount = cells.filter((c) => c.hours != null).length;
  const allFilled = filledCount === cells.length;
  const isCompleted = !!doc?.completed;
  const isMonthDirty = dirty;

  async function handleSave() {
    if (lockedForViewer) {
      toast.info('This month is locked — ask an admin to edit.');
      return;
    }
    setSaving(true);
    try {
      // Send null for unfilled days — server decides how to store + tracks
      // `allFilled` from the null-ness rather than relying on 0 as sentinel.
      const entries: ITimesheetEntry[] = cells.map((c) => ({
        date: c.date,
        // Cast through unknown — JSON will serialise null faithfully; server
        // handles both numbers and null in its validator.
        hours: (c.hours as unknown) as number,
      }));
      const res = await upsertTimesheet({
        projectRef: project._id,
        periodMonth,
        entries,
      });
      if (res.data?.data) {
        setDoc(res.data.data);
        setDirty(false);
        toast.success('Month saved');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkComplete() {
    setMarking(true);
    try {
      const res = await markTimesheetComplete(project._id, periodMonth);
      if (res.data?.data) {
        setDoc(res.data.data);
        toast.success('Month marked complete');
        setMarkCompleteOpen(false);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not mark complete';
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  }

  async function handleSubmitForApproval() {
    setSubmitting(true);
    try {
      const res = await submitApproval(project._id, periodMonth);
      if (res.data?.data) {
        setApproval(res.data.data);
        toast.success('Sent for approval');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not submit';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setSubmitConfirm(false);
    }
  }

  async function handleGenerateOverride() {
    setGenerating(true);
    try {
      const res = await generateInvoiceOverride(project._id, periodMonth);
      if (res.data?.data) {
        toast.success('Invoice draft generated');
        // Reload approval state so the UI reflects the skipped handshake.
        const apRes = await getApproval(project._id, periodMonth);
        setApproval(apRes.data?.data || null);
        onInvoiceMaybeCreated?.();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not generate';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    if (!approval) return;
    setActing('approve');
    try {
      const res = await approveApproval(approval._id);
      if (res.data?.data) {
        setApproval(res.data.data.approval);
        toast.success('Approved — invoice drafted');
        onInvoiceMaybeCreated?.();
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
    if (!approval) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    setActing('reject');
    try {
      const res = await rejectApproval(approval._id, reason);
      if (res.data?.data) {
        setApproval(res.data.data);
        toast.success('Rejected');
        setRejectOpen(false);
        setRejectReason('');
      }
    } catch {
      toast.error('Could not reject');
    } finally {
      setActing(null);
    }
  }

  const approvalColor = approval
    ? APPROVAL_STATUS_COLORS[approval.status]
    : APPROVAL_STATUS_COLORS.Pending;

  const canSubmit =
    !approval || approval.status === 'Pending' || approval.status === 'Rejected';
  // Submit-for-approval requires Mark complete too. Override path (admin
  // only) still only needs all-filled, matching server-side.
  const canGenerateStandard = canSubmit && allFilled && isCompleted;
  const canMarkComplete =
    canSubmit && allFilled && !isCompleted && !isMonthDirty && !lockedForViewer;

  return (
    <Stack spacing={2}>
      {/* Month switcher */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(tokens.colors.blue, 0.1),
              color: tokens.colors.blueDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCalendarTime size={18} />
          </Box>
          <Box>
            <Typography fontWeight={800}>
              {moment(periodMonth + '-01').format('MMMM YYYY')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filledCount} / {cells.length} days filled
              {doc?.filledBy && ` · last by ${doc.filledBy}`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Previous month">
            <IconButton
              size="small"
              onClick={() =>
                setPeriodMonth(
                  moment(periodMonth + '-01').subtract(1, 'month').format('YYYY-MM')
                )
              }
            >
              <IconChevronLeft size={18} />
            </IconButton>
          </Tooltip>
          {/* Month + year split so any month/year combo is reachable without
              a fixed window. periodMonth stays YYYY-MM as the source of truth. */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Month</InputLabel>
            <Select
              label="Month"
              value={Number(periodMonth.slice(5, 7))}
              onChange={(e) => {
                const mm = String(Number(e.target.value)).padStart(2, '0');
                setPeriodMonth(`${periodMonth.slice(0, 4)}-${mm}`);
              }}
              sx={{ borderRadius: 2 }}
            >
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={name} value={i + 1}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={Number(periodMonth.slice(0, 4))}
              onChange={(e) => {
                setPeriodMonth(`${e.target.value}-${periodMonth.slice(5, 7)}`);
              }}
              sx={{ borderRadius: 2 }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Next month">
            <IconButton
              size="small"
              onClick={() =>
                setPeriodMonth(
                  moment(periodMonth + '-01').add(1, 'month').format('YYYY-MM')
                )
              }
            >
              <IconChevronRight size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Day grid */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          bgcolor: lockedForViewer ? alpha(tokens.colors.blue, 0.02) : 'background.paper',
        }}
      >
        {loading ? (
          <Stack direction="row" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 1,
              }}
            >
              {cells.map((c, i) => {
                const d = moment(c.date);
                const isWeekend = d.isoWeekday() > 5;
                const unfilled = c.hours == null;
                return (
                  <Box
                    key={c.date}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isWeekend
                        ? alpha(tokens.colors.pink, 0.15)
                        : alpha(tokens.colors.blue, 0.15),
                      bgcolor: isWeekend
                        ? alpha(tokens.colors.pink, 0.04)
                        : unfilled
                          ? alpha('#F59E0B', 0.04)
                          : 'background.paper',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: isWeekend ? tokens.colors.pinkDark : tokens.colors.blueDark,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.66rem',
                      }}
                    >
                      {d.format('ddd')} · {d.format('D')}
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      placeholder={unfilled ? '—' : undefined}
                      inputProps={{ min: 0, max: 24, step: 0.25 }}
                      value={c.hours == null ? '' : String(c.hours)}
                      disabled={lockedForViewer}
                      onChange={(e) => setCell(i, e.target.value)}
                      sx={{
                        mt: 0.5,
                        width: '100%',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              sx={{ mt: 2 }}
            >
              <Typography sx={{ fontWeight: 800, color: tokens.colors.lightText }}>
                Total: {totalHours.toFixed(2)} h
                {!allFilled && (
                  <Typography
                    component="span"
                    sx={{
                      ml: 1.5,
                      fontSize: '0.72rem',
                      color: '#B45309',
                      fontWeight: 600,
                    }}
                  >
                    — some days are still empty
                  </Typography>
                )}
              </Typography>
              <Button
                variant="contained"
                size="small"
                disabled={!dirty || saving || lockedForViewer}
                onClick={handleSave}
                startIcon={
                  saving ? (
                    <CircularProgress size={14} sx={{ color: '#fff' }} />
                  ) : (
                    <IconDeviceFloppy size={16} />
                  )
                }
                sx={{
                  bgcolor: tokens.colors.pink,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: tokens.colors.pinkDark },
                }}
              >
                Save month
              </Button>
            </Stack>
          </>
        )}
      </Box>

      {/* Approval / generation state */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(approvalColor, 0.3),
          bgcolor: alpha(approvalColor, 0.04),
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 1.5,
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: approvalColor,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
            }}
          >
            {periodMonth} · {approval?.status || 'Pending'}
          </Typography>
          {approval?.status === 'Requested' && (
            <Typography sx={{ fontWeight: 700 }}>
              Awaiting super-admin approval
              {approval.requestedAt && ` · ${moment(approval.requestedAt).fromNow()}`}
            </Typography>
          )}
          {approval?.status === 'Approved' && approval.generatedInvoiceRef && (
            <Typography sx={{ fontWeight: 700 }}>
              Approved — invoice drafted
              {approval.approvedAt && ` · ${moment(approval.approvedAt).fromNow()}`}
            </Typography>
          )}
          {approval?.status === 'Approved' && !approval.generatedInvoiceRef && (
            <Typography sx={{ fontWeight: 700, color: '#B45309' }}>
              Approved — invoice was removed. Ask super-admin to regenerate.
            </Typography>
          )}
          {approval?.status === 'Rejected' && (
            <>
              <Typography sx={{ fontWeight: 700 }}>
                Rejected — edit and resubmit
              </Typography>
              {approval.rejectionReason && (
                <Typography variant="caption" color="text.secondary">
                  Reason: {approval.rejectionReason}
                </Typography>
              )}
            </>
          )}
          {(!approval || approval.status === 'Pending') && (
            <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {allFilled
                ? 'All days filled — ready to generate the invoice.'
                : 'Fill every day of the month to enable invoice generation.'}
            </Typography>
          )}
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ md: 'center' }}
        >
          {/* Mark complete — the bridge between "still editing" and
              "ready for approval". Available to anyone who can edit the
              month. Hidden entirely on the override path (admin bypass).
              Tooltip explains why it's disabled when it is. */}
          {canSubmit && !(canOverride && override) && (
            <Tooltip
              title={
                isCompleted
                  ? `Marked complete${doc?.completedBy ? ' by ' + doc.completedBy : ''}`
                  : lockedForViewer
                    ? 'This month is locked'
                    : !allFilled
                      ? 'Fill every day of the month first'
                      : isMonthDirty
                        ? 'Save your latest changes first'
                        : 'Confirm the month is finalised'
              }
            >
              <span>
                <Button
                  variant={isCompleted ? 'contained' : 'outlined'}
                  disabled={!canMarkComplete && !isCompleted}
                  onClick={() => !isCompleted && setMarkCompleteOpen(true)}
                  startIcon={<IconClipboardCheck size={16} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    ...(isCompleted
                      ? {
                          bgcolor: '#10B981',
                          color: '#fff',
                          '&:hover': { bgcolor: '#059669' },
                          pointerEvents: 'none',
                        }
                      : {
                          borderColor: '#10B981',
                          color: '#059669',
                          '&:hover': {
                            bgcolor: alpha('#10B981', 0.06),
                            borderColor: '#059669',
                          },
                          '&.Mui-disabled': { opacity: 0.5 },
                        }),
                  }}
                >
                  {isCompleted ? 'Completed' : 'Mark complete'}
                </Button>
              </span>
            </Tooltip>
          )}

          {/* Admin / super-admin: full control — submit for approval, or
              override with the "skip approval" checkbox. */}
          {canOverride && canSubmit && (
            <FormControlLabel
              sx={{ mr: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={override}
                  onChange={(e) => setOverride(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Skip approval — generate now
                </Typography>
              }
            />
          )}

          {canOverride && canSubmit && (
            <>
              {override ? (
                <Button
                  variant="contained"
                  onClick={handleGenerateOverride}
                  disabled={generating}
                  startIcon={
                    generating ? (
                      <CircularProgress size={14} sx={{ color: '#fff' }} />
                    ) : (
                      <IconFileInvoice size={16} />
                    )
                  }
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    },
                  }}
                >
                  {generating ? 'Generating…' : 'Generate invoice'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={!canGenerateStandard}
                  onClick={() => setSubmitConfirm(true)}
                  startIcon={<IconSend size={16} />}
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    },
                    '&.Mui-disabled': { opacity: 0.5 },
                  }}
                >
                  Generate invoice
                </Button>
              )}
            </>
          )}

          {/* Project-coordinator: two discrete actions so the flow mirrors
              the underlying state machine.
               · "Submit for approval"  — enabled once the month is fully
                 filled, disabled while Requested/Approved
               · "Generate invoice"     — enabled only after super-admin
                 approves; clicking it deep-links into the drafted invoice.
              No "skip approval" shortcut — PC can't bypass super-admin. */}
          {!canOverride && (
            <Stack direction="row" spacing={1}>
              {/* Submit-for-approval hides entirely once Approved — the
                  primary action from that point is "Go to invoice". */}
              {approval?.status !== 'Approved' && (
                <Tooltip
                  title={
                    approval?.status === 'Requested'
                      ? 'Waiting for super-admin review'
                      : !allFilled
                        ? 'Fill every day of the month first'
                        : !isCompleted
                          ? 'Mark the month complete first'
                          : 'Send this month to super-admin for approval'
                  }
                >
                  <span>
                    <Button
                      variant="outlined"
                      disabled={!canGenerateStandard}
                      onClick={() => setSubmitConfirm(true)}
                      startIcon={<IconSend size={16} />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        borderColor: tokens.colors.blueDark,
                        color: tokens.colors.blueDark,
                        '&:hover': {
                          bgcolor: alpha(tokens.colors.blue, 0.06),
                          borderColor: tokens.colors.blueDark,
                        },
                        '&.Mui-disabled': { opacity: 0.5 },
                      }}
                    >
                      Submit for approval
                    </Button>
                  </span>
                </Tooltip>
              )}

              <Tooltip
                title={
                  approval?.status === 'Approved' && approval.generatedInvoiceRef
                    ? 'Open the drafted invoice'
                    : approval?.status === 'Approved'
                      ? 'The drafted invoice was removed — ask super-admin to regenerate'
                      : 'Enabled once super-admin approves'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    disabled={
                      approval?.status !== 'Approved' ||
                      !approval.generatedInvoiceRef
                    }
                    onClick={() => onInvoiceMaybeCreated?.()}
                    startIcon={<IconFileInvoice size={16} />}
                    sx={{
                      background: tokens.gradients.pinkBlue,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                      },
                      '&.Mui-disabled': { opacity: 0.45 },
                    }}
                  >
                    {approval?.status === 'Approved'
                      ? 'Go to invoice'
                      : 'Generate invoice'}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          )}

          {approval?.status === 'Requested' && isSuperAdmin && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={acting !== null}
                onClick={() => setRejectOpen(true)}
                startIcon={<IconX size={16} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: '#EF4444',
                  color: '#EF4444',
                  '&:hover': { bgcolor: alpha('#EF4444', 0.06), borderColor: '#DC2626' },
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                disabled={acting !== null}
                onClick={handleApprove}
                startIcon={
                  acting === 'approve' ? (
                    <CircularProgress size={14} sx={{ color: '#fff' }} />
                  ) : (
                    <IconCheck size={16} />
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
                {acting === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
            </Stack>
          )}

          {canOverride && approval?.status === 'Approved' && approval.generatedInvoiceRef && (
            <Button
              variant="outlined"
              onClick={() => onInvoiceMaybeCreated?.()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: '#10B981',
                color: '#059669',
                '&:hover': { bgcolor: alpha('#10B981', 0.06) },
              }}
            >
              Go to invoice
            </Button>
          )}
        </Stack>
      </Box>

      {/* Approved-timesheet screenshots — uploaded per week, attached to the
          invoice email on Raise. Only visible after the month has a saved
          timesheet (we need the doc's _id to attach to). */}
      {doc && (
        <ScreenshotsSection
          timesheetId={doc._id}
          periodMonth={periodMonth}
          screenshots={doc.screenshots || []}
          disabled={lockedForViewer}
          onChange={(next) => setDoc(next)}
        />
      )}

      <ConfirmDialog
        open={markCompleteOpen}
        onClose={() => setMarkCompleteOpen(false)}
        onConfirm={handleMarkComplete}
        title={`Mark ${moment(periodMonth + '-01').format('MMMM YYYY')} as complete?`}
        description="Once marked complete, the month is ready to submit for approval. Admins can still re-edit — that clears the completion flag and you'll need to mark it complete again."
        confirmLabel={marking ? 'Marking…' : 'Mark complete'}
        tone="success"
      />

      <ConfirmDialog
        open={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        onConfirm={handleSubmitForApproval}
        title="Submit this month for approval?"
        description={`An email will go out to all super-admins (and info@unicodez.com) to review ${periodMonth} — ${totalHours.toFixed(2)} h across ${cells.length} days.`}
        confirmLabel={submitting ? 'Sending…' : 'Send for approval'}
        tone="neutral"
      />

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
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
        confirmLabel={acting === 'reject' ? 'Rejecting…' : 'Reject'}
        tone="danger"
      />
    </Stack>
  );
}

// ── Screenshots section ──────────────────────────────────────────────────
// Groups the monthly timesheet's screenshots into 7-day week buckets,
// matching the invoice line-item chunking (Day 1-7, 8-14, etc.). Each week
// card has an upload button + thumbnail list. Screenshots ride along as
// email attachments on invoice raise.

interface WeekSlot {
  startDate: string;
  endDate: string;
  label: string;
  shots: ITimesheetScreenshot[];
}

function buildWeekSlots(
  periodMonth: string,
  shots: ITimesheetScreenshot[]
): WeekSlot[] {
  const [year, month] = periodMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const slots: WeekSlot[] = [];

  for (let start = 1; start <= lastDay; start += 7) {
    const end = Math.min(start + 6, lastDay);
    const startISO = `${periodMonth}-${String(start).padStart(2, '0')}`;
    const endISO = `${periodMonth}-${String(end).padStart(2, '0')}`;
    const label = `Week of ${moment(startISO).format('MMM D')} – ${moment(endISO).format('MMM D')}`;
    const bucket = shots.filter(
      (s) => s.weekStart === startISO && s.weekEnd === endISO
    );
    slots.push({ startDate: startISO, endDate: endISO, label, shots: bucket });
  }
  return slots;
}

function ScreenshotsSection({
  timesheetId,
  periodMonth,
  screenshots,
  disabled,
  onChange,
}: {
  timesheetId: string;
  periodMonth: string;
  screenshots: ITimesheetScreenshot[];
  disabled: boolean;
  onChange: (next: ITimesheet) => void;
}) {
  const slots = buildWeekSlots(periodMonth, screenshots);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(slot: WeekSlot, file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be under 5 MB');
      return;
    }
    setUploadingSlot(slot.startDate);
    try {
      const uploadRes = await uploadFile(file, 'timesheet-screenshot');
      const url = uploadRes.data?.data?.url;
      if (!url) throw new Error('Upload failed — no URL');

      const res = await addTimesheetScreenshot(timesheetId, {
        weekStart: slot.startDate,
        weekEnd: slot.endDate,
        weekLabel: slot.label,
        url,
        fileName: file.name,
        sizeBytes: file.size,
      });
      if (res.data?.data) {
        onChange(res.data.data);
        toast.success('Screenshot added');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        'Upload failed';
      toast.error(msg);
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleRemove(shot: ITimesheetScreenshot) {
    if (!shot._id) return;
    try {
      const res = await removeTimesheetScreenshot(timesheetId, shot._id);
      if (res.data?.data) {
        onChange(res.data.data);
        toast.success('Screenshot removed');
      }
    } catch {
      toast.error('Could not remove');
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.blue, 0.1),
            color: tokens.colors.blueDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPhoto size={16} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>
            Approved timesheet screenshots
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload weekly proofs — they attach to the invoice email when it's raised.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1}>
        {slots.map((slot) => {
          const uploading = uploadingSlot === slot.startDate;
          return (
            <Box
              key={slot.startDate}
              sx={{
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: alpha(tokens.colors.blue, 0.15),
                bgcolor: alpha(tokens.colors.blue, 0.02),
                overflow: 'hidden',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: 1.5, py: 1 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {slot.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.colors.lightTextSecondary }}
                  >
                    {slot.shots.length} screenshot
                    {slot.shots.length === 1 ? '' : 's'}
                  </Typography>
                </Box>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={(el) => (fileRefs.current[slot.startDate] = el)}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) handleUpload(slot, f);
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={disabled || uploading}
                  onClick={() => fileRefs.current[slot.startDate]?.click()}
                  startIcon={
                    uploading ? (
                      <CircularProgress size={12} />
                    ) : (
                      <IconCloudUpload size={14} />
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    borderColor: tokens.colors.blueDark,
                    color: tokens.colors.blueDark,
                    '&:hover': {
                      bgcolor: alpha(tokens.colors.blue, 0.06),
                      borderColor: tokens.colors.blueDark,
                    },
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </Button>
              </Stack>

              {slot.shots.length > 0 && (
                <Box
                  sx={{
                    px: 1.5,
                    pb: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 1,
                  }}
                >
                  {slot.shots.map((s) => (
                    <Box
                      key={s._id || s.url}
                      sx={{
                        position: 'relative',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        bgcolor: '#fff',
                        overflow: 'hidden',
                        aspectRatio: '4 / 3',
                        cursor: 'pointer',
                        '&:hover .thumb-actions': { opacity: 1 },
                      }}
                      onClick={() => setViewerUrl(s.url)}
                    >
                      <img
                        src={s.url}
                        alt={s.fileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Box
                        className="thumb-actions"
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: alpha('#000', 0.4),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.75,
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            sx={{
                              color: '#fff',
                              bgcolor: alpha('#fff', 0.2),
                              '&:hover': { bgcolor: alpha('#fff', 0.32) },
                            }}
                          >
                            <IconZoomIn size={14} />
                          </IconButton>
                        </Tooltip>
                        {!disabled && (
                          <Tooltip title="Remove">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(s);
                              }}
                              sx={{
                                color: '#fff',
                                bgcolor: alpha('#EF4444', 0.8),
                                '&:hover': { bgcolor: '#DC2626' },
                              }}
                            >
                              <IconTrash size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Lightbox — click a thumbnail to zoom. Plain <img> in a centered
          overlay, no library needed. */}
      {viewerUrl && (
        <Box
          onClick={() => setViewerUrl(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: alpha('#000', 0.75),
            zIndex: (t) => t.zIndex.modal + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            cursor: 'zoom-out',
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setViewerUrl(null);
            }}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#fff',
              bgcolor: alpha('#fff', 0.1),
              '&:hover': { bgcolor: alpha('#fff', 0.2) },
            }}
          >
            <IconX size={18} />
          </IconButton>
          <img
            src={viewerUrl}
            alt="Screenshot preview"
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain' }}
          />
        </Box>
      )}
    </Box>
  );
}
