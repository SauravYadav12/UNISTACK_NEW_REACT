import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconHistory, IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  BackdatedOnboardingPayload,
  generateBackdatedOnboarding,
} from '../../services/onboardingApi';
import {
  ONBOARDING_DOC_KINDS,
  ONBOARDING_DOC_LABELS,
  OnboardingDocKind,
} from '../../Interfaces/onboarding';
import { iUser } from '../../Interfaces/iUser';
import { usersList } from '../../services/authApi';
import { getProfileByUser } from '../../services/userProfileApi';
import { salaryInWords } from '../../utils/numberToIndianWords';
import { isValidEmail } from '../../utils/onboardingValidators';

/**
 * Super-admin dialog to synthesise a fully-signed OnboardingCandidate
 * for a legacy / pre-portal employee. Used to digitise paper
 * onboarding paperwork so it shows up in the employee's My Documents →
 * Onboarding tab. See the controller `createBackdatedCandidate` for
 * server-side details.
 *
 * Form is intentionally single-step (no wizard) — every field on one
 * scrollable surface so the super-admin can scan and submit quickly.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a successful create so the panel can refresh. */
  onCreated: () => void;
}

interface FormState {
  user: iUser | null;
  position: string;
  annualSalary: number;
  probationMonths: number;
  startDate: string;
  offerSignedDate: string;
  additionalDocsSignedDate: string;
  signedFullName: string;
  signatureTypedName: string;
  /** Doc kinds the legacy employee never signed — excluded from the
   *  synthesised record. Default: empty (include all 4). */
  skipDocs: OnboardingDocKind[];
}

const TODAY = moment().format('YYYY-MM-DD');

function defaultsFor(): FormState {
  return {
    user: null,
    position: '',
    annualSalary: 0,
    probationMonths: 3,
    startDate: TODAY,
    offerSignedDate: TODAY,
    additionalDocsSignedDate: TODAY,
    signedFullName: '',
    signatureTypedName: '',
    skipDocs: [],
  };
}

const SIGNATURE_CURSIVE =
  '"Caveat", "Brush Script MT", "Lucida Handwriting", cursive';

export default function GenerateBackdatedOnboardingDialog({
  open,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(defaultsFor);
  const [users, setUsers] = useState<iUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load the user list once when the dialog opens. Same `usersList()`
  // helper the rest of the app uses; we filter to active employees
  // client-side so HR doesn't pick a relieved user by accident.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setUsersLoading(true);
    usersList()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.users ?? [];
        setUsers(list.filter((u) => u.active));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load employee list.');
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset when the dialog closes so a stale form doesn't bleed into
  // the next open. Done in the close callback (not on prop change)
  // to keep the user's typing intact during validation churn.
  useEffect(() => {
    if (!open) setForm(defaultsFor());
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // On employee select, autofill what we can from the picked user +
  // their profile. Position has no clean client-side prefill source
  // (UserProfile.designation isn't on the typed shape), so the
  // super-admin types it. DOJ → startDate is the biggest time-saver.
  async function handleUserPick(picked: iUser | null) {
    setForm((p) => ({
      ...p,
      user: picked,
      signedFullName: picked
        ? `${picked.firstName || ''} ${picked.lastName || ''}`.trim()
        : '',
      signatureTypedName: picked
        ? `${picked.firstName || ''} ${picked.lastName || ''}`.trim()
        : '',
    }));
    if (!picked) return;
    try {
      const profile = await getProfileByUser(picked);
      if (profile?.dateOfJoining) {
        const doj = moment(profile.dateOfJoining).format('YYYY-MM-DD');
        setForm((p) => ({
          ...p,
          startDate: doj,
          offerSignedDate: doj,
          additionalDocsSignedDate: doj,
        }));
      }
    } catch {
      // Non-fatal — the super-admin can fill the dates manually.
    }
  }

  const userOk = Boolean(form.user?._id);
  // The picked user must have a logged-in email (used by the server
  // to set both `email` and `officialEmail` on the synthesised
  // candidate). Anything else and the My Documents lookup would
  // never resolve the linkage.
  const userEmailOk = Boolean(form.user?.email && isValidEmail(form.user.email));
  const positionOk = form.position.trim().length > 0;
  const salaryOk = form.annualSalary > 0;
  const probationOk = form.probationMonths >= 1;
  const startOk = Boolean(form.startDate);
  const offerOk = Boolean(form.offerSignedDate);
  const docsOk = Boolean(form.additionalDocsSignedDate);
  const signedNameOk = form.signedFullName.trim().length > 0;
  const sigOk = form.signatureTypedName.trim().length > 0;

  const valid =
    userOk &&
    userEmailOk &&
    positionOk &&
    salaryOk &&
    probationOk &&
    startOk &&
    offerOk &&
    docsOk &&
    signedNameOk &&
    sigOk;

  const includedKinds = useMemo(
    () => ONBOARDING_DOC_KINDS.filter((k) => !form.skipDocs.includes(k)),
    [form.skipDocs],
  );

  function toggleKind(k: OnboardingDocKind) {
    setForm((p) => {
      const isSkipped = p.skipDocs.includes(k);
      const next = isSkipped
        ? p.skipDocs.filter((x) => x !== k)
        : [...p.skipDocs, k];
      return { ...p, skipDocs: next };
    });
  }

  async function submit() {
    if (!valid || !form.user) {
      toast.error('Fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: BackdatedOnboardingPayload = {
        userId: form.user._id,
        position: form.position.trim(),
        annualSalary: form.annualSalary,
        probationMonths: form.probationMonths,
        startDate: form.startDate,
        offerSignedDate: form.offerSignedDate,
        additionalDocsSignedDate: form.additionalDocsSignedDate,
        signedFullName: form.signedFullName.trim(),
        signatureTypedName: form.signatureTypedName.trim(),
        skipDocs: form.skipDocs.length ? form.skipDocs : undefined,
      };
      await generateBackdatedOnboarding(payload);
      toast.success(
        `Backdated onboarding generated for ${form.signedFullName}.`,
      );
      onCreated();
      onClose();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to generate.';
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
      maxWidth="md"
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconHistory size={20} />
          <Typography variant="h6" fontWeight={700}>
            Generate backdated onboarding
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Synthesise a fully-signed offer + 4 policy documents for a legacy
          employee. Records appear in the employee&rsquo;s My Documents &rarr;
          Onboarding tab automatically.
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
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Employee picker */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              value={form.user}
              loading={usersLoading}
              options={users}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              getOptionLabel={(u) =>
                `${u.firstName} ${u.lastName} · ${u.email}`.trim()
              }
              onChange={(_, v) => handleUserPick(v)}
              disabled={submitting}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  size="small"
                  label="Employee"
                  helperText={
                    form.user && !userEmailOk
                      ? "This user has no email on record — the synthesised docs won't link."
                      : 'Pick an active employee whose paper docs you want to digitise.'
                  }
                  error={Boolean(form.user) && !userEmailOk}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersLoading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Offer terms */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Offer terms
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Position"
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              disabled={submitting}
              helperText="Job title at time of joining."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Annual salary"
              value={form.annualSalary || ''}
              onChange={(e) =>
                set('annualSalary', Math.max(0, Number(e.target.value) || 0))
              }
              disabled={submitting}
              inputProps={{ min: 0, step: 1000 }}
              helperText={salaryInWords(form.annualSalary) || ' '}
              FormHelperTextProps={{
                sx: { fontStyle: 'italic', fontWeight: 600 },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Probation (months)"
              value={form.probationMonths || ''}
              onChange={(e) =>
                set(
                  'probationMonths',
                  Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                )
              }
              disabled={submitting}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>

          {/* Dates */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Dates
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Start date (joining)"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Offer signed on"
              value={form.offerSignedDate}
              onChange={(e) => set('offerSignedDate', e.target.value)}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Additional docs signed on"
              value={form.additionalDocsSignedDate}
              onChange={(e) =>
                set('additionalDocsSignedDate', e.target.value)
              }
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
              helperText="Same date applies to all included policy docs."
            />
          </Grid>

          {/* Signature */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Signature
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Signed full name"
              value={form.signedFullName}
              onChange={(e) => set('signedFullName', e.target.value)}
              disabled={submitting}
              helperText="Printed under each signature line."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Typed signature"
              value={form.signatureTypedName}
              onChange={(e) => set('signatureTypedName', e.target.value)}
              disabled={submitting}
              helperText="Rendered in cursive on every document."
            />
          </Grid>
          {form.signatureTypedName.trim() && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Signature preview
                </Typography>
                <Box
                  sx={{
                    fontFamily: SIGNATURE_CURSIVE,
                    fontStyle: 'italic',
                    fontSize: 36,
                    lineHeight: 1,
                    // Matches the navy used by OfferLetterRender so the
                    // preview reads identically to the rendered doc.
                    color: '#032840',
                  }}
                >
                  {form.signatureTypedName}
                </Box>
              </Box>
            </Grid>
          )}

          {/* Skip docs */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Documents included ({includedKinds.length} of {ONBOARDING_DOC_KINDS.length})
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              Uncheck any document the employee never signed on paper.
            </Typography>
            <FormGroup row sx={{ gap: 0.5 }}>
              {ONBOARDING_DOC_KINDS.map((kind) => {
                const included = !form.skipDocs.includes(kind);
                return (
                  <FormControlLabel
                    key={kind}
                    control={
                      <Checkbox
                        checked={included}
                        onChange={() => toggleKind(kind)}
                        disabled={submitting}
                        size="small"
                      />
                    }
                    label={ONBOARDING_DOC_LABELS[kind]}
                  />
                );
              })}
            </FormGroup>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!valid || submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconHistory size={16} />
            )
          }
        >
          {submitting ? 'Generating…' : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
