import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IconAlertTriangle } from '@tabler/icons-react';

/**
 * Lightweight modal for collecting a single "reason" string from the
 * admin — used by reject + mark-failed flows in the onboarding
 * candidate drawer. Replaces the previous `window.prompt` blob with
 * something that matches the rest of the portal's design language.
 *
 * Caller controls open/close + provides the async submit handler;
 * the dialog manages the input + busy state.
 */

interface Props {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  /** Color of the confirm button — pass 'error' for destructive ops
   *  (reject, mark failed) so the affordance reads as a final step. */
  confirmColor?: 'primary' | 'error' | 'warning';
  confirmLabel?: string;
  /** Soft requirement floor on the typed reason. Set to >0 if you want
   *  to force at least N non-blank chars. */
  minLength?: number;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function ReasonDialog({
  open,
  title,
  description,
  placeholder = 'Type the reason — this is visible in the audit trail.',
  confirmColor = 'error',
  confirmLabel = 'Confirm',
  minLength = 3,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state every time the dialog opens — so a previous reason
  // doesn't bleed into the next reject/fail action.
  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const valid = trimmed.length >= minLength;

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (e) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
          (e as Error)?.message ||
          'Action failed.',
      );
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
          <IconAlertTriangle
            size={20}
            color={confirmColor === 'error' ? '#DC2626' : undefined}
          />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <TextField
            autoFocus
            multiline
            minRows={3}
            maxRows={8}
            label="Reason"
            placeholder={placeholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            helperText={
              !valid && reason.length > 0
                ? `Reason must be at least ${minLength} characters.`
                : 'This will be stored on the candidate record.'
            }
            error={!valid && reason.length > 0}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={submit}
          disabled={!valid || submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          {submitting ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
