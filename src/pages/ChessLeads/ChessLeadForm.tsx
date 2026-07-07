import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import { tokens } from '../../theme/theme';
import { ChessLead, ChessLeadPayload } from '../../Interfaces/chessLead';
import {
  CHESS_LEAD_PRIORITIES,
  CHESS_LEAD_STATUSES,
  INITIAL_CHESS_LEAD,
  computePricing,
} from './chessLeadsValues';

interface Props {
  open: boolean;
  initial?: ChessLead | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ChessLeadPayload) => void;
}

/**
 * Add / Edit dialog for a chess lead. Same form for both — the initial
 * lead is loaded when editing and reset to blanks when creating.
 * Validation is minimal by design: academyName + status + priority are
 * enforced; everything else is optional so sales can partially fill a
 * row now and finish it later.
 */
export default function ChessLeadForm({
  open,
  initial,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<ChessLeadPayload>(INITIAL_CHESS_LEAD);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        initial
          ? {
              academyName: initial.academyName,
              subscriptionDate: initial.subscriptionDate || '',
              totalIds: initial.totalIds,
              mobileNumber: initial.mobileNumber || '',
              stateOrCity: initial.stateOrCity || '',
              country: initial.country || 'India',
              countryIso: initial.countryIso || 'IN',
              state: initial.state || '',
              stateIso: initial.stateIso || '',
              city: initial.city || '',
              pricingPerId: initial.pricingPerId,
              gstPercent: initial.gstPercent ?? 18,
              status: initial.status,
              priority: initial.priority,
              reason: initial.reason || '',
              nextFollowUpDate: initial.nextFollowUpDate || '',
              lastRenewalDate: initial.lastRenewalDate || '',
            }
          : { ...INITIAL_CHESS_LEAD },
      );
    }
  }, [open, initial]);

  function patch<K extends keyof ChessLeadPayload>(k: K, v: ChessLeadPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }));
  }

  // Cascading location dropdowns. Country list is static; state + city
  // are derived from the current ISO codes so picking a country resets
  // the state picker, and picking a state resets the city picker.
  const countryOptions = useMemo(() => Country.getAllCountries(), []);
  const stateOptions = useMemo(
    () => (form.countryIso ? State.getStatesOfCountry(form.countryIso) : []),
    [form.countryIso],
  );
  const cityOptions = useMemo(
    () =>
      form.countryIso && form.stateIso
        ? City.getCitiesOfState(form.countryIso, form.stateIso)
        : [],
    [form.countryIso, form.stateIso],
  );

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!form.academyName || !form.academyName.trim()) {
      next.academyName = 'Academy name is required';
    }
    if (form.mobileNumber && !/^[0-9+\-\s()]{7,}$/.test(form.mobileNumber)) {
      next.mobileNumber = 'Enter a valid mobile number';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // Normalise empty strings back to undefined so the server doesn't
    // store a bunch of "" values.
    const clean: ChessLeadPayload = { ...form };
    (Object.keys(clean) as Array<keyof ChessLeadPayload>).forEach((k) => {
      const v = clean[k];
      if (v === '' || v === null) delete clean[k];
    });
    onSubmit(clean);
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>
        {initial ? `Edit ${initial.leadId}` : 'Add chess lead'}
      </DialogTitle>
      <DialogContent
        sx={{
          '& .MuiTextField-root': { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
        }}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            size="small"
            label="Academy name"
            value={form.academyName || ''}
            onChange={(e) => patch('academyName', e.target.value)}
            error={!!errors.academyName}
            helperText={errors.academyName || ''}
            fullWidth
            required
          />

          <TextField
            size="small"
            label="Mobile number"
            value={form.mobileNumber || ''}
            onChange={(e) => patch('mobileNumber', e.target.value)}
            error={!!errors.mobileNumber}
            helperText={errors.mobileNumber || ''}
            fullWidth
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            <Autocomplete
              size="small"
              disableClearable={false}
              options={countryOptions}
              getOptionLabel={(o) => o.name}
              value={
                countryOptions.find((c) => c.isoCode === form.countryIso) ||
                null
              }
              onChange={(_e, v) =>
                setForm((f) => ({
                  ...f,
                  country: v?.name || '',
                  countryIso: v?.isoCode || '',
                  // Reset downstream selections when country changes.
                  state: '',
                  stateIso: '',
                  city: '',
                }))
              }
              renderInput={(p) => <TextField {...p} label="Country" />}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Autocomplete
              size="small"
              disabled={!form.countryIso || stateOptions.length === 0}
              options={stateOptions}
              getOptionLabel={(o) => o.name}
              value={
                stateOptions.find((s) => s.isoCode === form.stateIso) || null
              }
              onChange={(_e, v) =>
                setForm((f) => ({
                  ...f,
                  state: v?.name || '',
                  stateIso: v?.isoCode || '',
                  city: '',
                }))
              }
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="State"
                  helperText={
                    !form.countryIso
                      ? 'Pick a country first'
                      : stateOptions.length === 0
                        ? 'No states listed'
                        : ' '
                  }
                />
              )}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Autocomplete
              size="small"
              disabled={!form.stateIso || cityOptions.length === 0}
              options={cityOptions}
              getOptionLabel={(o) => o.name}
              value={cityOptions.find((c) => c.name === form.city) || null}
              onChange={(_e, v) => patch('city', v?.name || '')}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="City"
                  helperText={
                    !form.stateIso
                      ? 'Pick a state first'
                      : cityOptions.length === 0
                        ? 'No cities listed'
                        : ' '
                  }
                />
              )}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 1.5,
            }}
          >
            <TextField
              size="small"
              type="date"
              label="Subscription date"
              InputLabelProps={{ shrink: true }}
              value={form.subscriptionDate || ''}
              onChange={(e) => patch('subscriptionDate', e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              label="Total IDs"
              inputProps={{ min: 0 }}
              value={form.totalIds ?? ''}
              onChange={(e) =>
                patch('totalIds', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            <TextField
              size="small"
              type="number"
              label="Pricing per ID"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.pricingPerId ?? ''}
              onChange={(e) =>
                patch('pricingPerId', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            <TextField
              size="small"
              type="number"
              label="GST %"
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              value={form.gstPercent ?? 18}
              onChange={(e) =>
                patch(
                  'gstPercent',
                  e.target.value === '' ? 18 : Number(e.target.value),
                )
              }
              helperText="Default 18"
            />
          </Box>

          <PricingPreview
            totalIds={form.totalIds}
            pricingPerId={form.pricingPerId}
            gstPercent={form.gstPercent}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5,
            }}
          >
            <TextField
              size="small"
              select
              label="Status"
              value={form.status || 'New'}
              onChange={(e) => patch('status', e.target.value as ChessLeadPayload['status'])}
            >
              {CHESS_LEAD_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Priority"
              value={form.priority || 'Warm'}
              onChange={(e) => patch('priority', e.target.value as ChessLeadPayload['priority'])}
            >
              {CHESS_LEAD_PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="Last renewal"
              InputLabelProps={{ shrink: true }}
              value={form.lastRenewalDate || ''}
              onChange={(e) => patch('lastRenewalDate', e.target.value)}
              helperText="Most recent renewal"
            />
            <TextField
              size="small"
              type="date"
              label="Next follow-up"
              InputLabelProps={{ shrink: true }}
              value={form.nextFollowUpDate || ''}
              onChange={(e) => patch('nextFollowUpDate', e.target.value)}
            />
          </Box>

          <TextField
            size="small"
            label="Reason / notes"
            multiline
            minRows={2}
            value={form.reason || ''}
            onChange={(e) => patch('reason', e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : null}
          sx={{
            background: tokens.gradients.pinkBlue,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            '&:hover': { background: alpha(tokens.colors.pinkDark, 0.9) },
          }}
        >
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PricingPreview({
  totalIds,
  pricingPerId,
  gstPercent,
}: {
  totalIds?: number;
  pricingPerId?: number;
  gstPercent?: number;
}) {
  const { subtotal, gstAmount, grandTotal } = computePricing(
    totalIds,
    pricingPerId,
    gstPercent,
  );
  const empty = subtotal === 0;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(tokens.colors.blue, 0.04),
        border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tokens.colors.blueDark,
          fontSize: '0.65rem',
          display: 'block',
          mb: 0.5,
        }}
      >
        Auto-calculated
      </Typography>
      {empty ? (
        <Typography variant="caption" color="text.secondary">
          Enter Total IDs + Pricing per ID to see the totals.
        </Typography>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <PricingCell label="Subtotal" value={subtotal} />
          <PricingCell label={`GST (${gstPercent ?? 18}%)`} value={gstAmount} />
          <PricingCell label="Grand total" value={grandTotal} bold />
        </Stack>
      )}
    </Box>
  );
}

function PricingCell({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: bold ? 900 : 700,
          fontSize: bold ? '1rem' : '0.9rem',
          color: bold ? tokens.colors.pinkDark : 'text.primary',
        }}
      >
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
}
