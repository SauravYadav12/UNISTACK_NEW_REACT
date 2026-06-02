import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IconSend, IconFileText } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  getOfferTemplate,
  sendOffer,
  SendOfferPayload,
} from '../../services/onboardingApi';
import {
  OfferLetterTemplate,
  OnboardingCandidate,
} from '../../Interfaces/onboarding';
import OfferLetterRender from './OfferLetterRender';
import { displayNumber } from '../../utils/onboardingValidators';

/**
 * Compose dialog for generating + sending an offer letter.
 *
 * Layout: editable variables on the left, live preview on the right.
 * The preview pulls the CURRENT active template (so HR sees what the
 * candidate will see). The variables auto-prefill from the candidate's
 * proposed terms; HR can tweak before clicking Send.
 *
 * On submit: the server snapshots the current template onto the
 * candidate's offer, issues an offer-letter token, and emails the
 * candidate the signing link. The dialog closes; the parent panel
 * re-fetches the candidate list.
 */

interface Props {
  open: boolean;
  candidate: OnboardingCandidate;
  onClose: () => void;
  onSent: () => void;
}

export default function OfferLetterComposeDialog({
  open,
  candidate,
  onClose,
  onSent,
}: Props) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const [form, setForm] = useState<SendOfferPayload>({
    name: fullName,
    position: candidate.position,
    startDate: moment(candidate.proposedStartDate).format('YYYY-MM-DD'),
    annualSalary: candidate.proposedAnnualSalary,
    probationMonths: candidate.probationMonths,
  });
  const [template, setTemplate] = useState<OfferLetterTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getOfferTemplate()
      .then((res) => setTemplate(res.data))
      .catch((e) => {
        toast.error(
          (e as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || 'Failed to load template.',
        );
      })
      .finally(() => setLoading(false));
  }, [open]);

  const previewSnapshot = useMemo(
    () => ({
      name: form.name,
      position: form.position,
      startDate: form.startDate,
      annualSalary: Number(form.annualSalary) || 0,
      probationMonths: Number(form.probationMonths) || 0,
    }),
    [form],
  );

  function set<K extends keyof SendOfferPayload>(
    key: K,
    value: SendOfferPayload[K],
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function submit() {
    if (
      !form.name.trim() ||
      !form.position.trim() ||
      !form.startDate ||
      !(form.annualSalary > 0) ||
      !(form.probationMonths >= 0)
    ) {
      toast.error('Fill all fields with valid values.');
      return;
    }
    setSubmitting(true);
    try {
      await sendOffer(candidate._id, form);
      toast.success(`Offer letter sent to ${form.name}.`);
      onSent();
      onClose();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to send offer.';
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
      maxWidth="lg"
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconFileText size={20} />
          <Typography variant="h6" fontWeight={700}>
            Generate offer letter
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Variables on the left, live preview on the right. The candidate
          receives a signing link by email.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading || !template ? (
          <Stack direction="row" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2}>
                <TextField
                  label="Name on offer"
                  size="small"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  disabled={submitting}
                />
                <TextField
                  label="Position"
                  size="small"
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  disabled={submitting}
                />
                <TextField
                  type="date"
                  label="Start date"
                  size="small"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  disabled={submitting}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="number"
                  label="Annual salary (LPA)"
                  size="small"
                  // displayNumber hides the stuck "0" so the admin
                  // can clear and re-enter without fighting a leading
                  // zero. The current value still types-checks as a
                  // number on submit.
                  value={displayNumber(form.annualSalary)}
                  onChange={(e) =>
                    set('annualSalary', Number(e.target.value) || 0)
                  }
                  disabled={submitting}
                  inputProps={{ min: 0, step: 1000 }}
                />
                <TextField
                  type="number"
                  label="Probation (months)"
                  size="small"
                  value={displayNumber(form.probationMonths)}
                  onChange={(e) =>
                    set('probationMonths', Number(e.target.value) || 0)
                  }
                  disabled={submitting}
                  inputProps={{ min: 0, max: 12 }}
                />
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Editing the underlying template? Super-admin can update
                  signatory + body from the "Edit offer template" button on
                  the panel.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  background: 'grey.50',
                  p: 2,
                  borderRadius: 2,
                  overflow: 'auto',
                  maxHeight: 600,
                }}
              >
                <OfferLetterRender
                  snapshot={previewSnapshot}
                  template={template}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={submitting || loading}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconSend size={16} />
            )
          }
        >
          {submitting ? 'Sending…' : 'Send to candidate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
