import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  CircularProgress,
  TextField,
  Typography,
  Stack,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import moment from 'moment';
import { motion } from 'framer-motion';
import {
  IconSend,
  IconCalendarEvent,
  IconCategory,
  IconPaperclip,
  IconX,
  IconUpload,
} from '@tabler/icons-react';
import { dateFormate } from '../constants';
import {
  CreateLeavePayload,
  HalfDayType,
  iLeave,
} from '../../Interfaces/leaves';
import { LeaveType, LeaveBalance } from '../../Interfaces/salary';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { toast } from 'react-toastify';
import { createLeave } from '../../services/leavesApi';
import { uploadFile } from '../../services/storageApi';
import {
  listLeaveTypes,
  getMyBalances,
  getMyProbationStatus,
  ProbationStatus,
} from '../../services/leaveTypesApi';
import { tokens } from '../../theme/theme';

enum iFormType {
  FullDay = 'FullDay',
  HalfDay = 'HalfDay',
}

interface iProps {
  onApplied?: (l: iLeave) => void;
}

const leaveSchema = z.object({
  userRef: z.string().min(1, 'User reference is required'),
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  reason: z.string().min(1, 'Reason is required'),
  leaveType: z.string().min(1, 'Leave type is required'),
  type: z.string().optional(),
  isHalfDay: z.boolean(),
  halfDayType: z.enum(HalfDayType).optional(),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

interface LeaveTypeOption {
  id: string;
  code: string;
  name: string;
  color: string;
  /** Annual remaining (allocated − used). Infinity for UL. */
  annualRemaining: number;
  /** This-month availability after carry-forward. Infinity when no monthly cap (UL/ML). */
  monthlyAvailable: number;
  isUnpaid: boolean;
  hasMonthlyCap: boolean;
  /** When true, the form requires at least one uploaded attachment
   *  before Submit. Set on the LeaveType (e.g. Medical Leave). */
  requiresAttachment: boolean;
}

const FALLBACK_COLORS = [
  tokens.colors.pink,
  tokens.colors.blue,
  tokens.colors.warning,
  tokens.colors.success,
];

/**
 * SectionHeader — numbered chip + title pattern used across forms
 */
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.75 }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.gradients.pinkBlue,
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 700,
        }}
      >
        {number}
      </Box>
      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Stack>
  );
}

const ApplyLeave = ({ onApplied }: iProps) => {
  const { iUser } = useAuth();
  const [formType, setFormType] = useState<iFormType>(iFormType.FullDay);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [probation, setProbation] = useState<ProbationStatus | null>(null);
  // Uploaded attachment URLs — one per file the user picked. Each
  // upload happens inline on pick; storing the URLs (not the File
  // objects) means a successful upload survives the form re-render.
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const currentYear = moment().year();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTypesLoading(true);
      try {
        const [tRes, bRes, pRes] = await Promise.all([
          listLeaveTypes(false),
          getMyBalances(currentYear),
          // Probation lookup is best-effort: if the endpoint fails
          // (older server) we treat the user as non-probation so the
          // form stays functional. Server-side guard still catches
          // anyone who is genuinely on probation.
          getMyProbationStatus().catch(() => ({ data: { onProbation: false } })),
        ]);
        if (cancelled) return;
        setTypes(tRes.data || []);
        setBalances(bRes.data || []);
        setProbation(pRes.data || { onProbation: false });
      } catch (e) {
        if (!cancelled) toast.error('Failed to load leave types');
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentYear]);

  // Build options. For types with a monthly cap we rely on the server-computed
  // `monthlyAvailable` — only show when > 0. UL / no-cap types are always
  // visible. A missing balance row means the user was never seeded, so
  // fall back to `defaultAllocationPerYear` (salary calc does the same).
  //
  // Probationary users see ONLY the unpaid bucket. Server enforces the
  // same rule with a 400, this is just the cooperative UI.
  const options: LeaveTypeOption[] = useMemo(() => {
    const balanceByTypeId = new Map<string, LeaveBalance>();
    for (const b of balances) {
      const key = typeof b.leaveType === 'string' ? b.leaveType : b.leaveType?._id;
      if (key) balanceByTypeId.set(key, b);
    }
    const out: LeaveTypeOption[] = [];
    types.forEach((t, i) => {
      // Probation gate: hide every paid type until probation ends.
      if (probation?.onProbation && !t.isUnpaidBucket) return;

      const bal = balanceByTypeId.get(t._id);
      const allocated = bal ? bal.allocated : t.defaultAllocationPerYear;
      const used = bal ? bal.used : 0;
      const annualRemaining = Math.max(allocated - used, 0);
      const hasMonthlyCap = !t.isUnpaidBucket && t.monthlyQuota != null;
      const monthlyAvailable = bal?.monthlyAvailable != null
        ? bal.monthlyAvailable
        : (hasMonthlyCap ? annualRemaining : Infinity);

      // Filtering:
      //  - UL: always visible.
      //  - Capped types: show only if this month's quota has room.
      //  - Uncapped (e.g. ML): show if annual balance has room.
      if (t.isUnpaidBucket) {
        // always visible
      } else if (hasMonthlyCap) {
        if (monthlyAvailable <= 0) return;
      } else {
        if (annualRemaining <= 0) return;
      }

      out.push({
        id: t._id,
        code: t.code,
        name: t.name,
        color: t.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        annualRemaining: t.isUnpaidBucket ? Infinity : annualRemaining,
        monthlyAvailable: t.isUnpaidBucket ? Infinity : monthlyAvailable,
        isUnpaid: t.isUnpaidBucket,
        hasMonthlyCap,
        // UL (the unpaid bucket) is never an "attach a doctor's note"
        // type even if stale data has the flag turned on — that's a
        // medical-claim concept and UL is loss-of-pay. Suppress here
        // so the UI doesn't ask, and the server mirrors the same skip.
        //
        // The OR on the canonical Medical Leave code is the hard
        // guarantee that ML always shows the attachment block, even
        // for DB rows that pre-date the `requiresAttachment` flag.
        requiresAttachment:
          (!!t.requiresAttachment || (t.code || '').toUpperCase() === 'ML') &&
          !t.isUnpaidBucket,
      });
    });
    return out;
  }, [types, balances, probation]);

  // The UL option (if active) — used when a request overflows the monthly cap
  // and we need to show the user the "X will be unpaid" split.
  const unpaidOption = useMemo(
    () => options.find((o) => o.isUnpaid),
    [options],
  );

  const defaultValues: LeaveFormData = {
    userRef: iUser?._id || '',
    name: iUser ? iUser.firstName + ' ' + iUser.lastName : '',
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: '',
    type: '',
    isHalfDay: false,
    halfDayType: undefined,
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues,
  });

  const watchedValues = watch();

  // Pre-select the default leave type once options load. Prefer
  // Paid Leave (code "PL") over alphabetical order so the form
  // doesn't default to Medical Leave (which would surface the
  // attachment requirement on every open). For probationary users
  // the options list is already filtered down to UL only, so
  // `options[0]` is correctly UL — the PL preference applies to
  // non-probation employees.
  useEffect(() => {
    if (!watchedValues.leaveType && options.length) {
      const preferred =
        options.find((o) => (o.code || '').toUpperCase() === 'PL') ||
        options[0];
      setValue('leaveType', preferred.id);
      setValue('type', preferred.name);
    }
  }, [options, watchedValues.leaveType, setValue]);

  const totalDays = (() => {
    const s = watchedValues.startDate;
    const e = watchedValues.endDate || s;
    if (!s) return 0;
    const diff = moment(e).diff(moment(s), 'days') + 1;
    if (Number.isNaN(diff) || diff < 0) return 0;
    return watchedValues.isHalfDay ? 0.5 : diff;
  })();

  const selectedMeta = options.find((o) => o.id === watchedValues.leaveType) || options[0];

  // Pending confirmation for a request that overflows the monthly quota.
  // Populated when the user submits; cleared when they confirm or cancel.
  const [pendingConfirm, setPendingConfirm] = useState<
    | {
        data: LeaveFormData;
        chosen: LeaveTypeOption;
        unpaid: LeaveTypeOption;
        primaryDays: number;
        overflowDays: number;
      }
    | null
  >(null);

  async function submitLeave(
    data: LeaveFormData,
    split: CreateLeavePayload['splitBreakdown'],
  ) {
    const chosen = options.find((o) => o.id === data.leaveType);
    const payload: CreateLeavePayload = {
      ...data,
      type: chosen?.name,
      endDate: data.endDate || data.startDate,
      splitBreakdown: split,
      // Always send the attachment array if the user uploaded anything,
      // even on types that don't require it — HR may still find it
      // useful (e.g. a doctor's note on a casual leave).
      ...(attachments.length > 0 ? { attachments } : {}),
    };
    if (!payload.halfDayType) delete payload.halfDayType;

    const response = await createLeave(payload);
    response.data.data && onApplied?.(response.data.data);
    reset(defaultValues);
    setFormType(iFormType.FullDay);
    setAttachments([]);
    toast.success('Leave request submitted successfully');
  }

  const onSubmit = async (data: LeaveFormData) => {
    if (loading) return;
    const chosen = options.find((o) => o.id === data.leaveType);
    if (!chosen) {
      toast.error('Pick a leave type');
      return;
    }
    // Attachment requirement (e.g. Medical Leave). Server enforces
    // the same — this is the cooperative UI so the user gets a clean
    // toast instead of a 400.
    if (chosen.requiresAttachment && attachments.length === 0) {
      toast.error(
        `${chosen.name} requires supporting documentation. Please attach a file before submitting.`,
      );
      return;
    }
    // Compute days in the same way the server will (half-day = 0.5).
    const s = moment(data.startDate);
    const e = moment(data.endDate || data.startDate);
    const inclusive = e.diff(s, 'days') + 1;
    const reqDays = data.isHalfDay ? 0.5 : Math.max(inclusive, 1);

    // Overflow into UL when capped type and requested > monthlyAvailable.
    const needsConfirm =
      chosen.hasMonthlyCap &&
      !chosen.isUnpaid &&
      unpaidOption &&
      chosen.id !== unpaidOption.id &&
      reqDays > chosen.monthlyAvailable;

    if (needsConfirm) {
      const primaryDays = Math.max(chosen.monthlyAvailable, 0);
      const overflowDays = reqDays - primaryDays;
      setPendingConfirm({
        data,
        chosen,
        unpaid: unpaidOption!,
        primaryDays,
        overflowDays,
      });
      return;
    }

    // No overflow — submit straight through with a single-bucket split so the
    // server doesn't need to recompute.
    setLoading(true);
    try {
      await submitLeave(data, [{ leaveType: chosen.id, days: reqDays }]);
    } catch (error) {
      console.error('Error applying for leave:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  async function confirmAndSubmit() {
    if (!pendingConfirm) return;
    const { data, chosen, unpaid, primaryDays, overflowDays } = pendingConfirm;
    setLoading(true);
    try {
      const split: CreateLeavePayload['splitBreakdown'] = [];
      if (primaryDays > 0) split.push({ leaveType: chosen.id, days: primaryDays });
      split.push({ leaveType: unpaid.id, days: overflowDays });
      await submitLeave(data, split);
      setPendingConfirm(null);
    } catch (error) {
      console.error('Error applying for leave:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (iUser) {
      setValue('userRef', iUser._id);
      setValue('name', iUser.firstName + ' ' + iUser.lastName);
    }
  }, [iUser, setValue]);

  useEffect(() => {
    if (formType === iFormType.HalfDay) {
      setValue('isHalfDay', true);
      setValue('halfDayType', HalfDayType.FirstHalf);
      setValue('endDate', watchedValues.startDate);
    } else {
      setValue('isHalfDay', false);
      setValue('halfDayType', undefined);
    }
  }, [formType, setValue, watchedValues.startDate]);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Accent bar with current selection color */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: selectedMeta?.color || tokens.colors.pink,
          opacity: 0.9,
          transition: 'background 0.3s ease',
        }}
      />

      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
            }}
          >
            <IconCalendarEvent size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Plan your leave
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalDays > 0 ? (
                <>
                  <Box component="span" sx={{ fontWeight: 700, color: selectedMeta?.color || tokens.colors.pink }}>
                    {totalDays} {totalDays === 1 ? 'day' : 'days'}
                  </Box>
                  {' · '}
                  {watchedValues.startDate || '—'}
                  {watchedValues.endDate &&
                    watchedValues.endDate !== watchedValues.startDate &&
                    ` to ${watchedValues.endDate}`}
                </>
              ) : (
                'Pick a leave type to get started'
              )}
            </Typography>
          </Box>
        </Stack>

        <Button
          type="submit"
          form="apply-leave-form"
          variant="contained"
          size="medium"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <IconSend size={16} />}
          sx={{
            background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
            color: '#fff',
            px: 2.5,
            py: 0.875,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #0A3555 0%, #032840 100%)',
              boxShadow: `0 6px 16px ${alpha('#032840', 0.25)}`,
            },
            '&.Mui-disabled': {
              background: alpha('#032840', 0.4),
              color: alpha('#fff', 0.6),
            },
          }}
        >
          {loading ? 'Submitting…' : 'Submit Request'}
        </Button>
      </Box>

      {/* Probation notice — appears only while the user is in the
          3-month window. Server enforces the same rule with a 400. */}
      {probation?.onProbation && (
        <Box
          sx={{
            mx: 3,
            mt: 2,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha('#f59e0b', 0.4),
            backgroundColor: alpha('#f59e0b', 0.08),
            display: 'flex',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
            Probation period:
          </Typography>
          <Typography variant="body2" sx={{ color: '#78350f' }}>
            Paid leaves are not available until{' '}
            {probation.probationEnd
              ? moment(probation.probationEnd).format('DD MMM YYYY')
              : 'your probation ends'}
            . Any leave during this period must be filed as Unpaid Leave (UL).
          </Typography>
        </Box>
      )}

      <Box sx={{ p: 3 }}>
        <form id="apply-leave-form" onSubmit={handleSubmit(onSubmit)}>
          {/* ── Step 1: Leave type picker ── */}
          <SectionHeader number={1} title="What kind of leave?" />
          <Controller
            name="leaveType"
            control={control}
            render={({ field }) => (
              <>
                {typesLoading ? (
                  <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : options.length === 0 ? (
                  <Box sx={{
                    p: 2.5, mb: 3, borderRadius: 3,
                    border: '1px dashed', borderColor: 'divider',
                    textAlign: 'center',
                  }}>
                    <IconCategory size={24} color={tokens.colors.lightTextSecondary} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      No leave types are available for you right now. Contact HR.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {options.map((opt) => {
                      const active = field.value === opt.id;
                      const remainingLabel = opt.isUnpaid
                        ? 'Unpaid'
                        : opt.hasMonthlyCap
                          ? `${opt.monthlyAvailable} this month`
                          : `${opt.annualRemaining} left`;
                      return (
                        <Grid key={opt.id} size={{ xs: 6, sm: 3 }}>
                          <motion.div
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Box
                              onClick={() => {
                                field.onChange(opt.id);
                                setValue('type', opt.name);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  field.onChange(opt.id);
                                  setValue('type', opt.name);
                                }
                              }}
                              sx={{
                                cursor: 'pointer',
                                userSelect: 'none',
                                p: 1.75,
                                borderRadius: 3,
                                border: '1.5px solid',
                                borderColor: active ? opt.color : 'divider',
                                bgcolor: active ? alpha(opt.color, 0.08) : 'background.paper',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.75,
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  borderColor: active ? opt.color : alpha(opt.color, 0.5),
                                  bgcolor: alpha(opt.color, 0.05),
                                },
                              }}
                            >
                              {active && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 0,
                                    height: 0,
                                    borderStyle: 'solid',
                                    borderWidth: '0 28px 28px 0',
                                    borderColor: `transparent ${opt.color} transparent transparent`,
                                  }}
                                />
                              )}
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(opt.color, 0.15),
                                  color: opt.color,
                                  fontWeight: 800,
                                  fontSize: 13,
                                  letterSpacing: 1,
                                }}
                              >
                                {opt.code}
                              </Box>
                              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.15 }}>
                                {opt.name}
                              </Typography>
                              <Typography variant="caption" sx={{
                                lineHeight: 1.3,
                                color: opt.isUnpaid ? tokens.colors.lightTextSecondary : opt.color,
                                fontWeight: 600,
                              }}>
                                {remainingLabel}
                              </Typography>
                            </Box>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
                {errors.leaveType && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: -2, mb: 2 }}>
                    {errors.leaveType.message}
                  </Typography>
                )}
              </>
            )}
          />

          {/* ── Step 2: Duration ── */}
          <SectionHeader number={2} title="How long?" />
          <ToggleButtonGroup
            value={formType}
            exclusive
            onChange={(_, v) => v && setFormType(v as iFormType)}
            size="small"
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: alpha(tokens.colors.pink, 0.1),
                  color: tokens.colors.pinkDark,
                  borderColor: alpha(tokens.colors.pink, 0.3),
                  '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.15) },
                },
              },
            }}
          >
            <ToggleButton value={iFormType.FullDay}>Full Day</ToggleButton>
            <ToggleButton value={iFormType.HalfDay}>Half Day</ToggleButton>
          </ToggleButtonGroup>

          {/* ── Step 3: Dates ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {!watchedValues.isHalfDay ? (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DatePicker
                          disabled={loading}
                          format={dateFormate}
                          minDate={moment()}
                          label="Start Date"
                          value={field.value ? moment(field.value) : null}
                          onChange={(newValue) => {
                            const v = newValue ? newValue.format(dateFormate) : '';
                            field.onChange(v);
                            // Keep endDate on or after startDate — auto-populate
                            // if empty or if it fell before the new start.
                            const curEnd = watchedValues.endDate;
                            if (v && (!curEnd || moment(curEnd).isBefore(moment(v)))) {
                              setValue('endDate', v);
                            }
                          }}
                          slotProps={{
                            textField: {
                              disabled: loading,
                              size: 'small',
                              fullWidth: true,
                              error: !!errors.startDate,
                              helperText: errors.startDate?.message,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DatePicker
                          disabled={loading || !watchedValues.startDate}
                          format={dateFormate}
                          minDate={watchedValues.startDate ? moment(watchedValues.startDate) : moment()}
                          label="End Date"
                          value={field.value ? moment(field.value) : null}
                          onChange={(newValue) =>
                            field.onChange(newValue ? newValue.format(dateFormate) : '')
                          }
                          slotProps={{
                            textField: {
                              disabled: loading || !watchedValues.startDate,
                              size: 'small',
                              fullWidth: true,
                              error: !!errors.endDate,
                              helperText: errors.endDate?.message || (!watchedValues.startDate ? 'Pick a start date first' : undefined),
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DatePicker
                          disabled={loading}
                          format={dateFormate}
                          minDate={moment()}
                          label="Date"
                          value={field.value ? moment(field.value) : null}
                          onChange={(newValue) => {
                            const v = newValue ? newValue.format(dateFormate) : '';
                            field.onChange(v);
                            setValue('endDate', v);
                          }}
                          slotProps={{
                            textField: {
                              disabled: loading,
                              size: 'small',
                              fullWidth: true,
                              error: !!errors.startDate,
                              helperText: errors.startDate?.message,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="halfDayType"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 500 }}>
                          Which half?
                        </Typography>
                        <ToggleButtonGroup
                          exclusive
                          size="small"
                          value={field.value || HalfDayType.FirstHalf}
                          onChange={(_, v) => v && field.onChange(v)}
                          sx={{
                            width: '100%',
                            '& .MuiToggleButton-root': {
                              flex: 1,
                              textTransform: 'none',
                              fontWeight: 500,
                              py: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              color: 'text.secondary',
                              '&.Mui-selected': {
                                bgcolor: alpha(tokens.colors.blue, 0.1),
                                color: tokens.colors.blueDark,
                                borderColor: alpha(tokens.colors.blue, 0.3),
                                '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.15) },
                              },
                            },
                          }}
                        >
                          {Object.values(HalfDayType).map((h) => (
                            <ToggleButton key={h} value={h}>
                              {h}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Box>
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* ── Step 4: Reason ── */}
          <SectionHeader number={3} title="Why?" />
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={loading}
                placeholder="Share a short reason — it helps your manager approve faster."
                multiline
                minRows={3}
                maxRows={8}
                fullWidth
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
            )}
          />

          {/* ── Attachment block ──
              Shown for any leave type that has `requiresAttachment` set
              on the LeaveType (super-admin configurable). Each picked
              file uploads inline; the URL is stored in `attachments`
              state, so a refresh of the form doesn't lose a completed
              upload. Submit is gated by `attachments.length > 0` in
              the validator above. */}
          {selectedMeta?.requiresAttachment && (
            <Box sx={{ mt: 2 }}>
              <SectionHeader number={5} title="Supporting documentation" />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', mb: 1.5, mt: 0.5 }}
              >
                {selectedMeta.name} requires a supporting document
                (e.g. medical certificate, doctor&rsquo;s note). PDF,
                image, or DOC up to ~10MB.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  disabled={loading || uploading}
                  startIcon={
                    uploading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <IconUpload size={16} />
                    )
                  }
                  sx={{ textTransform: 'none' }}
                >
                  {uploading ? 'Uploading…' : 'Choose file'}
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      // Reset the input so picking the same file again
                      // still fires onChange.
                      e.target.value = '';
                      if (!file) return;
                      setUploading(true);
                      try {
                        const res = await uploadFile(file, 'docn');
                        const url = res.data?.data?.url;
                        if (url) {
                          setAttachments((prev) => [...prev, url]);
                        } else {
                          toast.error('Upload failed — no URL returned.');
                        }
                      } catch (err) {
                        const msg =
                          (err as { response?: { data?: { error?: string } } })
                            ?.response?.data?.error || 'Upload failed.';
                        toast.error(msg);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </Button>
                {attachments.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
                  </Typography>
                )}
              </Stack>
              {attachments.length > 0 && (
                <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                  {attachments.map((url, idx) => (
                    <Box
                      key={url}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(tokens.colors.blue, 0.04),
                      }}
                    >
                      <IconPaperclip size={14} />
                      <Box
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          flex: 1,
                          fontSize: 12,
                          color: tokens.colors.blue,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Attachment {idx + 1}
                      </Box>
                      <Button
                        size="small"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        disabled={loading || uploading}
                        startIcon={<IconX size={12} />}
                        sx={{
                          textTransform: 'none',
                          color: 'text.secondary',
                          minWidth: 0,
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </form>
      </Box>

      <SplitConfirmDialog
        state={pendingConfirm}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={confirmAndSubmit}
        saving={loading}
      />
    </Box>
  );
};

interface SplitConfirmState {
  data: LeaveFormData;
  chosen: LeaveTypeOption;
  unpaid: LeaveTypeOption;
  primaryDays: number;
  overflowDays: number;
}

function SplitConfirmDialog({
  state,
  onCancel,
  onConfirm,
  saving,
}: {
  state: SplitConfirmState | null;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  if (!state) return null;
  const { chosen, unpaid, primaryDays, overflowDays } = state;
  const total = primaryDays + overflowDays;

  return (
    <Dialog open={!!state} onClose={saving ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Exceeds {chosen.code} monthly quota</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          You requested <strong>{total} {total === 1 ? 'day' : 'days'}</strong> of{' '}
          <strong>{chosen.name}</strong> but only <strong>{primaryDays}</strong>{' '}
          day{primaryDays === 1 ? ' is' : 's are'} available this month.
          The remainder will be counted as <strong>Unpaid Leave</strong>.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <SplitChip
            code={chosen.code}
            label={chosen.name}
            days={primaryDays}
            color={chosen.color}
          />
          <Typography sx={{ color: 'text.secondary', alignSelf: 'center' }}>+</Typography>
          <SplitChip
            code={unpaid.code}
            label={unpaid.name}
            days={overflowDays}
            color={unpaid.color}
          />
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Your unpaid-leave count will increase by {overflowDays} day
          {overflowDays === 1 ? '' : 's'} once HR approves this request.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          {saving ? 'Submitting…' : 'Yes, apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SplitChip({
  code,
  label,
  days,
  color,
}: {
  code: string;
  label: string;
  days: number;
  color: string;
}) {
  return (
    <Box sx={{
      flex: 1,
      border: '1px solid',
      borderColor: alpha(color, 0.3),
      bgcolor: alpha(color, 0.05),
      borderRadius: 2,
      p: 1.25,
      textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: 11, color, fontWeight: 700, letterSpacing: 1 }}>
        {code}
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: tokens.colors.lightText, lineHeight: 1.1 }}>
        {days}
      </Typography>
      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default ApplyLeave;
