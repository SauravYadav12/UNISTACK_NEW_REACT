import { useEffect, useState } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Stack, CircularProgress, Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment, { Moment } from 'moment';
import { toast } from 'react-toastify';

import { Holiday } from '../../Interfaces/holiday';
import { markHoliday, updateHoliday } from '../../services/holidayApi';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { dateFormate, dateFormate2 } from '../constants';
import { parseError } from '../../utils/utils';
import { tokens } from '../../theme/theme';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When present, the dialog is in "edit" mode. */
  holiday?: Holiday;
  /** Country to preselect on new-create. Ignored in edit mode. */
  defaultCountry?: 'IN' | 'US' | 'ALL';
}

type FormState = {
  name: string;
  description: string;
  fromDate: Moment | null;
  toDate: Moment | null;
  country: 'IN' | 'US' | 'ALL';
  isHalfDay: boolean;
};

const emptyState: FormState = {
  name: '',
  description: '',
  fromDate: null,
  toDate: null,
  country: 'IN',
  isHalfDay: false,
};

export default function HolidayFormDialog({
  open, onClose, holiday, defaultCountry,
}: Props) {
  const { addHoliday } = useHoliday();
  const [form, setForm] = useState<FormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isEdit = !!holiday;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (holiday) {
      setForm({
        name: holiday.name || '',
        description: holiday.description || '',
        fromDate: holiday.fromDate ? moment(holiday.fromDate) : null,
        toDate: holiday.toDate ? moment(holiday.toDate) : null,
        country: (holiday.country as 'IN' | 'US' | 'ALL') || 'ALL',
        isHalfDay: !!holiday.isHalfDay,
      });
    } else {
      setForm({ ...emptyState, country: defaultCountry || 'IN' });
    }
  }, [open, holiday, defaultCountry]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Holiday name is required';
    if (!form.fromDate) e.fromDate = 'Start date is required';
    if (form.toDate && form.fromDate && form.toDate.isBefore(form.fromDate)) {
      e.toDate = 'End date cannot be before start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Click handler on the Save button. For edits we gate behind a confirm
  // dialog (per product decision — every update action needs confirmation).
  // Adds go through directly since an add has no prior state to overwrite.
  function onClickSave() {
    if (!validate() || !form.fromDate) return;
    if (isEdit) setConfirmOpen(true);
    else persist();
  }

  async function persist() {
    if (!form.fromDate) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        fromDate: form.fromDate.format(dateFormate),
        toDate: (form.toDate || form.fromDate).format(dateFormate),
        country: form.country,
        isHalfDay: form.isHalfDay,
      };
      if (isEdit && holiday) {
        const { data } = await updateHoliday(holiday._id, payload);
        // Refresh via adding / reloading — addHoliday tolerates replacement.
        if (data.data) {
          // Simplest strategy: remove-then-add so list reflects new values.
          // The context's setData would be ideal but we keep addHoliday for compat.
          addHoliday(data.data);
        }
        toast.success('Holiday updated');
      } else {
        const { data } = await markHoliday(payload);
        if (data.data) addHoliday(data.data);
        toast.success('Holiday added');
      }
      setConfirmOpen(false);
      onClose();
    } catch (err) {
      toast.error(parseError(err));
      throw err; // keep the confirm dialog open on failure
    } finally {
      setSaving(false);
    }
  }

  const isSystemSourced = holiday?.source === 'system';

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? 'Edit holiday' : 'Add a holiday'}
          {isSystemSourced && (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
              Edits here may be overwritten the next time the admin syncs this country&rsquo;s holidays.
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Holiday name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth size="small"
            />
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              multiline minRows={2} maxRows={5}
              fullWidth size="small"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Applies to</InputLabel>
                  <Select
                    label="Applies to"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value as 'IN' | 'US' | 'ALL')}
                  >
                    <MenuItem value="IN">India only</MenuItem>
                    <MenuItem value="US">US only</MenuItem>
                    <MenuItem value="ALL">Everyone (company-wide)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={<Switch checked={form.isHalfDay} onChange={(e) => update('isHalfDay', e.target.checked)} />}
                  label="Half-day holiday"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Start date"
                  format={dateFormate2}
                  value={form.fromDate}
                  onChange={(v) => {
                    update('fromDate', v);
                    // Keep end date on/after start
                    if (!form.toDate || (v && form.toDate.isBefore(v))) update('toDate', v);
                  }}
                  slotProps={{
                    textField: {
                      size: 'small', fullWidth: true,
                      error: !!errors.fromDate, helperText: errors.fromDate,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="End date"
                  format={dateFormate2}
                  minDate={form.fromDate || undefined}
                  value={form.toDate}
                  onChange={(v) => update('toDate', v)}
                  slotProps={{
                    textField: {
                      size: 'small', fullWidth: true,
                      error: !!errors.toDate,
                      helperText: errors.toDate || (!form.toDate && form.fromDate ? 'Defaults to start date if left blank' : undefined),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onClickSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}
            sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add holiday'}
          </Button>
        </DialogActions>
      </Dialog>

      {isEdit && holiday && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={persist}
          tone="warning"
          title="Save changes to this holiday?"
          confirmLabel="Yes, save"
          cancelLabel="Keep editing"
          description={
            <Typography variant="body2" color="text.secondary">
              You&rsquo;re updating <Box component="span" sx={{ fontWeight: 700, color: tokens.colors.lightText }}>{holiday.name || 'this holiday'}</Box>. Salary calculations from the next slip generation will use the new date and country.
            </Typography>
          }
        />
      )}
    </LocalizationProvider>
  );
}
