import { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IconUserPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  createCandidate,
  CreateCandidatePayload,
} from '../../services/onboardingApi';
import {
  isValidEmail,
  isValidPhone,
  digitsOnly,
  displayNumber,
} from '../../utils/onboardingValidators';
import { salaryInWords } from '../../utils/numberToIndianWords';

/**
 * Single-step form to initiate an onboarding candidate. Captures the
 * minimum HR needs to send the form invite: identity, position,
 * proposed offer terms. The candidate fills the long onboarding form
 * via the magic link they receive after this submit.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEFAULTS: CreateCandidatePayload = {
  firstName: '',
  lastName: '',
  email: '',
  officialEmail: '',
  phone: '',
  position: '',
  proposedStartDate: moment().add(15, 'days').format('YYYY-MM-DD'),
  proposedAnnualSalary: 0,
  probationMonths: 3,
};

export default function AddCandidateDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateCandidatePayload>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof CreateCandidatePayload>(
    key: K,
    value: CreateCandidatePayload[K],
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // Phone is optional, but when supplied it must be a clean 10-digit
  // number — the digit-only `onChange` filter on the TextField means
  // any value reaching state here is already digits-only, so all we
  // need is a length check.
  const emailValid = isValidEmail(form.email);
  // Official email is optional; only validate when filled.
  const officialEmailOk =
    !form.officialEmail || isValidEmail(form.officialEmail);
  const phoneOk = !form.phone || isValidPhone(form.phone);

  function valid() {
    return Boolean(
      form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        emailValid &&
        officialEmailOk &&
        phoneOk &&
        form.position.trim() &&
        form.proposedStartDate &&
        form.proposedAnnualSalary > 0 &&
        (form.probationMonths ?? 0) >= 1,
    );
  }

  async function submit() {
    if (!valid()) {
      toast.error('Fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await createCandidate(form);
      toast.success(
        `Invite sent to ${form.firstName}. They'll receive an onboarding link from HR.`,
      );
      setForm(DEFAULTS);
      onCreated();
      onClose();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to create candidate.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconUserPlus size={20} />
          <Typography variant="h6" fontWeight={700}>
            Add candidate
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          We'll email them an onboarding form to complete.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="First name"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              disabled={submitting}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Last name"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              disabled={submitting}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={submitting}
              error={Boolean(form.email) && !emailValid}
              helperText={
                form.email && !emailValid
                  ? 'Enter a valid email address.'
                  : ' '
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Phone (10 digits)"
              value={form.phone}
              onChange={(e) => set('phone', digitsOnly(e.target.value, 10))}
              disabled={submitting}
              inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
              error={Boolean(form.phone) && !phoneOk}
              helperText={
                form.phone && !phoneOk
                  ? 'Phone must be exactly 10 digits.'
                  : ' '
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Official email (optional)"
              value={form.officialEmail ?? ''}
              onChange={(e) => set('officialEmail', e.target.value)}
              disabled={submitting}
              error={Boolean(form.officialEmail) && !officialEmailOk}
              helperText={
                form.officialEmail && !officialEmailOk
                  ? 'Enter a valid email address.'
                  : "Used to surface this candidate's signed docs to them once they sign in."
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Position"
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              disabled={submitting}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Proposed start date"
              value={form.proposedStartDate}
              onChange={(e) => set('proposedStartDate', e.target.value)}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Annual salary (LPA)"
              // displayNumber returns '' for 0/undefined so the input
              // renders empty until the admin types a real number —
              // avoids the stuck-leading-zero edit pain.
              value={displayNumber(form.proposedAnnualSalary)}
              onChange={(e) =>
                set('proposedAnnualSalary', Number(e.target.value) || 0)
              }
              disabled={submitting}
              inputProps={{ min: 0, step: 1000 }}
              // Live "in words" helper text — Indian lakh/crore form.
              // Empty until a positive number is typed (the helper
              // returns '' for 0/null so this collapses naturally).
              helperText={salaryInWords(form.proposedAnnualSalary) || ' '}
              FormHelperTextProps={{
                sx: { fontStyle: 'italic', fontWeight: 600 },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Probation (months)"
              // displayNumber renders 0/undefined as an empty string so
              // the input doesn't sit on a stuck zero while the admin
              // edits. Initial DEFAULTS still seeds it as 3 so a fresh
              // dialog opens with the standard value.
              value={displayNumber(form.probationMonths ?? undefined)}
              onChange={(e) =>
                set(
                  'probationMonths',
                  Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                )
              }
              disabled={submitting}
              inputProps={{ min: 1, max: 12 }}
              error={form.probationMonths !== undefined && form.probationMonths < 1}
              helperText={
                form.probationMonths !== undefined && form.probationMonths < 1
                  ? 'Probation must be at least 1 month.'
                  : ' '
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={submitting || !valid()}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconUserPlus size={16} />
            )
          }
        >
          {submitting ? 'Creating…' : 'Create + send invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
