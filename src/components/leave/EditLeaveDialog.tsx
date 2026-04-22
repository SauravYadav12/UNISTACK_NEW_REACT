import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Typography, Box, Stack,
  ToggleButton, ToggleButtonGroup, Chip, alpha, CircularProgress, MenuItem, Select, FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { toast } from 'react-toastify';

import { dateFormate } from '../constants';
import { HalfDayType, iLeave } from '../../Interfaces/leaves';
import { LeaveType, LeaveBalance } from '../../Interfaces/salary';
import { listLeaveTypes, getMyBalances } from '../../services/leaveTypesApi';
import { updateLeave } from '../../services/leavesApi';
import { tokens } from '../../theme/theme';

interface Props {
  open: boolean;
  leave?: iLeave;
  onClose: () => void;
  onSaved?: (l: iLeave) => void;
}

export default function EditLeaveDialog({ open, leave, onClose, onSaved }: Props) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<HalfDayType>(HalfDayType.FirstHalf);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentYear = moment().year();

  useEffect(() => {
    if (!open || !leave) return;
    setStartDate(leave.startDate || '');
    setEndDate(leave.endDate || leave.startDate || '');
    setReason(leave.reason || '');
    setIsHalfDay(!!leave.isHalfDay);
    setHalfDayType((leave.halfDayType as HalfDayType) || HalfDayType.FirstHalf);
    setLeaveTypeId(typeof leave.leaveType === 'string' ? leave.leaveType : '');
    setError('');
  }, [open, leave]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [tRes, bRes] = await Promise.all([
          listLeaveTypes(false),
          getMyBalances(currentYear),
        ]);
        if (cancelled) return;
        setTypes(tRes.data || []);
        setBalances(bRes.data || []);
      } catch {
        if (!cancelled) toast.error('Failed to load leave types');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, currentYear]);

  // Show all types the user can still pick (remaining > 0) plus the current
  // leave's type (so they don't get booted off their existing selection) plus
  // the unpaid bucket (always visible).
  const typeOptions = useMemo(() => {
    const balanceByTypeId = new Map<string, LeaveBalance>();
    for (const b of balances) {
      const key = typeof b.leaveType === 'string' ? b.leaveType : b.leaveType?._id;
      if (key) balanceByTypeId.set(key, b);
    }
    const existingTypeId = typeof leave?.leaveType === 'string' ? leave.leaveType : '';
    return types
      .filter((t) => {
        if (t.isUnpaidBucket) return true;
        if (t._id === existingTypeId) return true;
        const bal = balanceByTypeId.get(t._id);
        const remaining = (bal ? bal.allocated : t.defaultAllocationPerYear) - (bal?.used || 0);
        return remaining > 0;
      })
      .map((t) => {
        const bal = balanceByTypeId.get(t._id);
        const remaining = t.isUnpaidBucket
          ? null
          : Math.max((bal ? bal.allocated : t.defaultAllocationPerYear) - (bal?.used || 0), 0);
        return { t, remaining };
      });
  }, [types, balances, leave]);

  const days = (() => {
    if (!startDate) return 0;
    const s = moment(startDate, dateFormate);
    const e = moment(endDate || startDate, dateFormate);
    const diff = e.diff(s, 'days') + 1;
    if (!Number.isFinite(diff) || diff < 0) return 0;
    return isHalfDay ? 0.5 : diff;
  })();

  async function handleSave() {
    if (!leave) return;
    if (!startDate) { setError('Start date is required'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }
    if (!leaveTypeId) { setError('Leave type is required'); return; }
    setSaving(true);
    setError('');
    try {
      const selectedType = types.find((t) => t._id === leaveTypeId);
      const updated = await updateLeave(leave._id, {
        startDate,
        endDate: endDate || startDate,
        reason: reason.trim(),
        leaveType: leaveTypeId,
        type: selectedType?.name,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
      });
      if (updated) onSaved?.(updated);
      toast.success('Leave request updated');
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Failed to update';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit Leave Request
        {days > 0 && (
          <Chip
            size="small"
            label={`${days} ${days === 1 ? 'day' : 'days'}`}
            sx={{
              ml: 1.5,
              bgcolor: alpha(tokens.colors.pink, 0.1),
              color: tokens.colors.pink,
              fontWeight: 700,
            }}
          />
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small" error={!!error && !leaveTypeId}>
              <InputLabel>Leave Type</InputLabel>
              <Select
                label="Leave Type"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
              >
                {typeOptions.map(({ t, remaining }) => (
                  <MenuItem key={t._id} value={t._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{
                        width: 26, height: 26, borderRadius: 1.25,
                        bgcolor: alpha(t.color || tokens.colors.pink, 0.15),
                        color: t.color || tokens.colors.pink,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 11,
                      }}>
                        {t.code}
                      </Box>
                      <Box sx={{ flex: 1 }}>{t.name}</Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t.isUnpaidBucket ? 'Unpaid' : `${remaining} left`}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {typeOptions.length === 0 && (
                <FormHelperText>No leave types available</FormHelperText>
              )}
            </FormControl>

            <ToggleButtonGroup
              value={isHalfDay ? 'half' : 'full'}
              exclusive
              size="small"
              onChange={(_, v) => {
                if (!v) return;
                const isHalf = v === 'half';
                setIsHalfDay(isHalf);
                if (isHalf) setEndDate(startDate);
              }}
            >
              <ToggleButton value="full">Full Day</ToggleButton>
              <ToggleButton value="half">Half Day</ToggleButton>
            </ToggleButtonGroup>

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label={isHalfDay ? 'Date' : 'Start Date'}
                    format={dateFormate}
                    value={startDate ? moment(startDate, dateFormate) : null}
                    onChange={(v) => {
                      const s = v ? v.format(dateFormate) : '';
                      setStartDate(s);
                      if (isHalfDay) {
                        setEndDate(s);
                      } else if (s && (!endDate || moment(endDate, dateFormate).isBefore(moment(s, dateFormate)))) {
                        // Auto-populate end date so it never lags behind start.
                        setEndDate(s);
                      }
                    }}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                {!isHalfDay && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="End Date"
                      format={dateFormate}
                      disabled={!startDate}
                      minDate={startDate ? moment(startDate, dateFormate) : undefined}
                      value={endDate ? moment(endDate, dateFormate) : null}
                      onChange={(v) => setEndDate(v ? v.format(dateFormate) : '')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          disabled: !startDate,
                          helperText: !startDate ? 'Pick a start date first' : undefined,
                        },
                      }}
                    />
                  </Grid>
                )}
                {isHalfDay && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                        Which half?
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={halfDayType}
                        onChange={(_, v) => v && setHalfDayType(v)}
                        sx={{ width: '100%' }}
                      >
                        {Object.values(HalfDayType).map((h) => (
                          <ToggleButton key={h} value={h} sx={{ flex: 1 }}>
                            {h}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </LocalizationProvider>

            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
            />

            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
