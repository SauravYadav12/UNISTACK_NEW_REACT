import {
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
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { tokens } from '../../theme/theme';
import { ChessLead, ChessLeadPayload } from '../../Interfaces/chessLead';
import {
  CHESS_LEAD_PRIORITIES,
  CHESS_LEAD_STATUSES,
  INITIAL_CHESS_LEAD,
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
              pricingPerId: initial.pricingPerId,
              status: initial.status,
              priority: initial.priority,
              reason: initial.reason || '',
              nextFollowUpDate: initial.nextFollowUpDate || '',
            }
          : { ...INITIAL_CHESS_LEAD },
      );
    }
  }, [open, initial]);

  function patch<K extends keyof ChessLeadPayload>(k: K, v: ChessLeadPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }));
  }

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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              size="small"
              label="Mobile number"
              value={form.mobileNumber || ''}
              onChange={(e) => patch('mobileNumber', e.target.value)}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber || ''}
            />
            <TextField
              size="small"
              label="State / City"
              value={form.stateOrCity || ''}
              onChange={(e) => patch('stateOrCity', e.target.value)}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
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
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
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
