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
  IconButton,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconTarget,
  IconX,
  IconSend,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { iUser } from '../../Interfaces/iUser';
import { usersList } from '../../services/authApi';
import { PIP_REASON_OPTIONS, PipReason } from '../../Interfaces/pip';
import { createPip, previewPipDraft } from '../../services/pipApi';
import { errMsg } from './pipStatus';
import { tokens } from '../../theme/theme';

const STEPS = ['Employee', 'Reasons', 'Review & send'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CreatePipWizardDialog({ open, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [employee, setEmployee] = useState<iUser | null>(null);
  const [users, setUsers] = useState<iUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [reasons, setReasons] = useState<PipReason[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'send' | null>(null);
  const [lastPreviewKey, setLastPreviewKey] = useState('');

  // Reset everything whenever the dialog is (re)opened.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setEmployee(null);
    setReasons([]);
    setOtherReason('');
    setSubject('');
    setBody('');
    setLastPreviewKey('');
    setSubmitting(null);
    setUsersLoading(true);
    let cancelled = false;
    usersList()
      .then((res) => {
        if (cancelled) return;
        setUsers((res.data?.users ?? []).filter((u) => u.active));
      })
      .catch(() => !cancelled && toast.error('Failed to load employee list.'))
      .finally(() => !cancelled && setUsersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const toggleReason = (key: PipReason) =>
    setReasons((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );

  const emailOk = Boolean(employee?.email);
  const step0Ok = Boolean(employee?._id) && emailOk;
  const step1Ok =
    reasons.length > 0 && (!reasons.includes('other') || otherReason.trim().length > 0);
  const step2Ok = subject.trim().length > 0 && body.trim().length > 0;

  const previewKey = useMemo(
    () => `${reasons.slice().sort().join(',')}|${otherReason.trim()}`,
    [reasons, otherReason]
  );

  async function goToReview() {
    // (Re)generate the default letter when the reasons changed since the
    // last generation; preserve manual edits otherwise.
    if (previewKey !== lastPreviewKey) {
      setPreviewing(true);
      try {
        const { subject: s, body: b } = await previewPipDraft({
          employeeRef: employee?._id,
          reasons,
          otherReason: otherReason.trim() || undefined,
        });
        setSubject(s);
        setBody(b);
        setLastPreviewKey(previewKey);
      } catch (e) {
        toast.error(errMsg(e, 'Could not generate the email draft.'));
      } finally {
        setPreviewing(false);
      }
    }
    setStep(2);
  }

  async function save(send: boolean) {
    if (!employee?._id) return;
    setSubmitting(send ? 'send' : 'draft');
    try {
      await createPip({
        employeeRef: employee._id,
        reasons,
        otherReason: otherReason.trim() || undefined,
        emailSubject: subject.trim(),
        emailBody: body,
        send,
      });
      toast.success(
        send
          ? `PIP email sent to ${employee.firstName}. Tracking has started.`
          : 'PIP saved as a draft.'
      );
      onSaved();
      onClose();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 502) {
        // Draft was saved but the email failed — surface it and refresh so
        // the draft shows up to retry from.
        toast.warning(errMsg(e, 'Saved as draft, but the email failed to send.'));
        onSaved();
        onClose();
      } else {
        toast.error(errMsg(e, 'Could not save the PIP.'));
      }
    } finally {
      setSubmitting(null);
    }
  }

  const busy = submitting !== null;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTarget size={20} />
          <Typography variant="h6" fontWeight={700}>
            New Performance Improvement Plan
          </Typography>
        </Stack>
        <Tooltip title="Close" arrow placement="left">
          <IconButton
            onClick={onClose}
            size="small"
            disabled={busy}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
          >
            <IconX size={18} />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent>
        <Stepper
          activeStep={step}
          alternativeLabel
          sx={{
            my: 2,
            '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
            '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' },
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0 — employee */}
        {step === 0 && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Select the employee to place on a Performance Improvement Plan.
            </Typography>
            <Autocomplete
              value={employee}
              loading={usersLoading}
              options={users}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              getOptionLabel={(u) => `${u.firstName} ${u.lastName} · ${u.email}`.trim()}
              onChange={(_, v) => setEmployee(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  size="small"
                  label="Employee"
                  error={Boolean(employee) && !emailOk}
                  helperText={
                    employee && !emailOk
                      ? 'This employee has no email on record — a PIP email cannot be sent.'
                      : 'Only active employees are listed.'
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersLoading ? <CircularProgress size={14} color="inherit" /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* Step 1 — reasons */}
        {step === 1 && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Why is {employee?.firstName} being placed on a PIP? Select all that apply.
            </Typography>
            <FormGroup>
              {PIP_REASON_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={reasons.includes(opt.key)}
                      onChange={() => toggleReason(opt.key)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
            {reasons.includes('other') && (
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                label="Specific reason"
                placeholder="Describe the specific reason…"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}

        {/* Step 2 — review email */}
        {step === 2 && (
          <Box sx={{ pt: 1 }}>
            {previewing ? (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress size={26} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Drafting the email…
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Review and edit the email the employee will receive. It explains the
                  reasons and the 30-day plan (with a 15-day extension, then possible
                  termination).
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={12}
                  maxRows={22}
                  label="Email body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  sx={{ '& textarea': { fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6 } }}
                />
                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha(tokens.colors.blue, 0.08),
                    border: '1px dashed',
                    borderColor: alpha(tokens.colors.blue, 0.3),
                  }}
                >
                  <Typography variant="caption" sx={{ color: tokens.colors.blueDark, fontWeight: 600 }}>
                    Will be sent to {employee?.email} · CC HR &amp; all super-admins.
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
          Back
        </Button>
        <Stack direction="row" spacing={1}>
          {step === 0 && (
            <Button variant="contained" onClick={() => setStep(1)} disabled={!step0Ok}>
              Next
            </Button>
          )}
          {step === 1 && (
            <Button variant="contained" onClick={goToReview} disabled={!step1Ok || previewing}>
              Next
            </Button>
          )}
          {step === 2 && (
            <>
              <Button
                onClick={() => save(false)}
                disabled={!step2Ok || busy}
                startIcon={submitting === 'draft' ? <CircularProgress size={14} /> : <IconDeviceFloppy size={16} />}
              >
                Save as draft
              </Button>
              <Button
                variant="contained"
                onClick={() => save(true)}
                disabled={!step2Ok || busy}
                startIcon={submitting === 'send' ? <CircularProgress size={14} color="inherit" /> : <IconSend size={16} />}
              >
                Save &amp; send
              </Button>
            </>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
