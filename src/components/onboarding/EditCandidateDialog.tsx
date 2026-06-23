import { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  IconDeviceFloppy,
  IconEdit,
  IconMailForward,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  updateCandidateDetails,
  UpdateCandidateDetailsPayload,
} from '../../services/onboardingApi';
import {
  OnboardingCandidate,
  OnboardingOfferSnapshot,
} from '../../Interfaces/onboarding';
import OfferLetterPreviewDialog from './OfferLetterPreviewDialog';
import {
  isValidEmail,
  isValidPhone,
  digitsOnly,
  displayNumber,
} from '../../utils/onboardingValidators';
import { salaryInWords } from '../../utils/numberToIndianWords';

/**
 * Edit a candidate's basic details after the invite has already been
 * sent. Same field set as AddCandidateDialog (name, email, phone,
 * position, start date, salary, probation) but two distinct save paths:
 *
 *   - "Save" → persist the new values silently.
 *   - "Save & re-invite" → persist + revoke any active onboarding-form
 *     token + issue a fresh one + email the candidate at the (now
 *     corrected) address.
 *
 * Server blocks editing on terminal candidates (rejected / onboarded).
 * The trigger affordance in the drawer is hidden for those stages.
 */

interface Props {
  open: boolean;
  candidate: OnboardingCandidate | null;
  onClose: () => void;
  /** Called after a successful save so the drawer can refetch and the
   *  panel grid can reload. */
  onSaved: () => void;
}

type FormState = Omit<
  UpdateCandidateDetailsPayload,
  'reinvite'
> & {
  proposedAnnualSalary: number;
  probationMonths: number;
};

function fromCandidate(c: OnboardingCandidate): FormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    officialEmail: c.officialEmail || '',
    phone: c.phone || '',
    position: c.position,
    proposedStartDate: c.proposedStartDate
      ? moment(c.proposedStartDate).format('YYYY-MM-DD')
      : moment().add(15, 'days').format('YYYY-MM-DD'),
    proposedAnnualSalary: c.proposedAnnualSalary || 0,
    probationMonths: c.probationMonths || 3,
  };
}

export default function EditCandidateDialog({
  open,
  candidate,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  // Two in-flight flags so the button that's "loading" can show its
  // own spinner without disabling the other one prematurely.
  const [savingPlain, setSavingPlain] = useState(false);
  const [savingReinvite, setSavingReinvite] = useState(false);
  const submitting = savingPlain || savingReinvite;
  // Preview is only used on the offer-sent re-send flow — HR clicks
  // Save & re-invite, we open the preview here, and only commit when
  // they click Send inside it. Revise just closes the preview and
  // leaves this edit dialog open so they can adjust + re-preview.
  const [previewOpen, setPreviewOpen] = useState(false);
  // True iff the current edit cycle is the "offer revision" path. We
  // capture this on the click instead of reading candidate.stage every
  // render so an off-by-one stage change between click and send can't
  // skip the preview.
  const isOfferRevision = candidate?.stage === 'offer-sent';

  // Re-seed the form every time the dialog opens with a new candidate
  // so a previous edit-in-flight isn't preserved across drawer
  // openings. Bails to a no-op when closed.
  useEffect(() => {
    if (open && candidate) {
      setForm(fromCandidate(candidate));
    } else if (!open) {
      setForm(null);
    }
  }, [open, candidate]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => (p ? { ...p, [key]: value } : p));
  }

  const emailValid = form ? isValidEmail(form.email) : false;
  const officialEmailOk = form
    ? !form.officialEmail || isValidEmail(form.officialEmail)
    : false;
  const phoneOk = form ? !form.phone || isValidPhone(form.phone) : false;

  function valid(): boolean {
    if (!form) return false;
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
        form.probationMonths >= 1,
    );
  }

  /** Actually fires the API. Split out from `submit` so both the
   *  direct path (Save / Save & re-invite at non-offer-sent stages)
   *  and the preview's Send button hit identical logic. */
  async function commit(reinvite: boolean): Promise<boolean> {
    if (!form || !candidate || !valid()) {
      toast.error('Fill all required fields.');
      return false;
    }
    const flagSetter = reinvite ? setSavingReinvite : setSavingPlain;
    flagSetter(true);
    try {
      const res = await updateCandidateDetails(candidate._id, {
        ...form,
        reinvite,
      });
      if (reinvite) {
        // Stage-aware toast — the server tells us WHICH link it
        // resent so we don't claim "fresh invite sent" when the
        // candidate is past the onboarding form (the previous version
        // of this code did exactly that — always saying "invite sent"
        // even when the stage didn't have a relevant link to resend).
        const kind = res.data.reinviteKind;
        if (res.data.reinviteSent && kind === 'offer-letter') {
          toast.success(
            `Details saved. Revised offer letter sent to ${form.firstName}.`,
          );
        } else if (res.data.reinviteSent && kind === 'onboarding-form') {
          toast.success(
            `Details saved. Onboarding link resent to ${form.firstName}.`,
          );
        } else if (kind === null || kind === undefined) {
          // Stage doesn't have a relevant link to resend (bg-check,
          // bg-check-passed, offer-signed). Details are saved but no
          // email went out — tell HR where the right action lives.
          toast.info(
            'Details saved. No active link to resend at this stage — use the actions panel for the next step.',
          );
        } else {
          // We attempted to send (kind set) but the server couldn't —
          // SMTP hiccup. HR can retry via the actions panel.
          toast.warning(
            'Details saved but the re-invite email failed to send. Use the actions panel to retry.',
          );
        }
      } else {
        toast.success('Details saved.');
      }
      // Success: close the preview (if any) AND the edit dialog so HR
      // returns to the candidate drawer with the refreshed data.
      setPreviewOpen(false);
      onSaved();
      onClose();
      return true;
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to save changes.';
      toast.error(msg);
      return false;
    } finally {
      flagSetter(false);
    }
  }

  /** The button handler. Intercepts the "Save & re-invite" flow at the
   *  offer-sent stage to open the preview first — the actual API call
   *  only happens when HR clicks Send inside the preview. Every other
   *  path commits directly (preserving the current behaviour). */
  function submit(reinvite: boolean) {
    if (!form || !candidate || !valid()) {
      toast.error('Fill all required fields.');
      return;
    }
    if (reinvite && isOfferRevision) {
      // Don't fire the API yet — open the preview so HR can verify the
      // revised letter content before the email goes out. The preview's
      // Send button calls commit(true) when HR confirms.
      setPreviewOpen(true);
      return;
    }
    void commit(reinvite);
  }

  // Detect any change vs the original candidate so the buttons can be
  // disabled when there's nothing to save — prevents pointless audit
  // entries and the unnecessary token churn on Save & re-invite.
  const dirty =
    form && candidate
      ? form.firstName !== candidate.firstName ||
        form.lastName !== candidate.lastName ||
        form.email !== candidate.email ||
        (form.officialEmail || '') !== (candidate.officialEmail || '') ||
        form.phone !== (candidate.phone || '') ||
        form.position !== candidate.position ||
        form.proposedStartDate !==
          (candidate.proposedStartDate
            ? moment(candidate.proposedStartDate).format('YYYY-MM-DD')
            : '') ||
        form.proposedAnnualSalary !== (candidate.proposedAnnualSalary || 0) ||
        form.probationMonths !== (candidate.probationMonths || 3)
      : false;

  // Build the live snapshot from the form's current values — kept up
  // to date by setForm calls so the preview always reflects exactly
  // what the candidate would receive if HR hit Send right now.
  const previewSnapshot: OnboardingOfferSnapshot | null = form
    ? {
        name: `${form.firstName} ${form.lastName}`.trim(),
        position: form.position,
        startDate: form.proposedStartDate,
        annualSalary: form.proposedAnnualSalary,
        probationMonths: form.probationMonths,
      }
    : null;

  return (
    <>
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconEdit size={20} />
          <Typography variant="h6" fontWeight={700}>
            Edit candidate details
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Update the basics if HR typed something wrong or the candidate's
          info changed. Choose <strong>Save &amp; re-invite</strong> to email
          the candidate a fresh link at the new address.
        </Typography>
        <Tooltip title="Close" arrow placement="left">
          <IconButton
            onClick={onClose}
            size="small"
            disabled={submitting}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'text.secondary',
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>
        {!form ? (
          <Stack direction="row" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
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
                label="Annual salary"
                value={displayNumber(form.proposedAnnualSalary)}
                onChange={(e) =>
                  set('proposedAnnualSalary', Number(e.target.value) || 0)
                }
                disabled={submitting}
                inputProps={{ min: 0, step: 1000 }}
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
                value={displayNumber(form.probationMonths ?? undefined)}
                onChange={(e) =>
                  set(
                    'probationMonths',
                    Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                  )
                }
                disabled={submitting}
                inputProps={{ min: 1, max: 12 }}
                error={form.probationMonths < 1}
                helperText={
                  form.probationMonths < 1
                    ? 'Probation must be at least 1 month.'
                    : ' '
                }
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Button
            onClick={() => submit(false)}
            disabled={submitting || !dirty || !valid()}
            startIcon={
              savingPlain ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <IconDeviceFloppy size={16} />
              )
            }
            variant="outlined"
          >
            {savingPlain ? 'Saving…' : 'Save'}
          </Button>
          <Button
            onClick={() => submit(true)}
            disabled={submitting || !valid()}
            startIcon={
              savingReinvite ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <IconMailForward size={16} />
              )
            }
            variant="contained"
          >
            {savingReinvite
              ? 'Saving…'
              : isOfferRevision
                ? 'Preview & re-invite'
                : 'Save & re-invite'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
    {/* Preview modal — only used on the offer-sent re-invite path. HR
        clicks "Preview & re-invite", we open this; Send commits, Revise
        closes it (the edit dialog stays open so HR can adjust + re-
        preview). Guarded on `previewSnapshot` so the renderer never
        sees a null shape. */}
    {previewSnapshot && form && (
      <OfferLetterPreviewDialog
        open={previewOpen}
        firstName={form.firstName}
        snapshot={previewSnapshot}
        sending={savingReinvite}
        onRevise={() => setPreviewOpen(false)}
        // `commit` resolves with a boolean (true on success / false on
        // error or validation fail) — the preview only needs a
        // Promise<void>, so we await + return nothing. Errors are
        // already toasted inside commit; nothing for us to bubble.
        onSend={async () => {
          await commit(true);
        }}
        title="Preview revised offer letter"
      />
    )}
    </>
  );
}
