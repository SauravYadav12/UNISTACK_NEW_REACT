import { useState } from 'react';
import {
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
import { IconMail } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { requestInfo } from '../../services/onboardingApi';

/**
 * Free-text email to the candidate asking for additional details.
 * The textarea body becomes the email content verbatim; subject is
 * the email subject. Same email gets logged into HR's outbound history
 * via the standard mail transporter.
 *
 * Triggered from the candidate drawer's actions panel when the
 * candidate is in `form-submitted` or `info-requested`.
 */
interface Props {
  open: boolean;
  candidateId: string;
  candidateName: string;
  onClose: () => void;
  onSent: () => void;
}

const DEFAULT_SUBJECT = 'Quick follow-up on your onboarding';
const DEFAULT_BODY =
  'Hi,\n\nThanks for submitting your onboarding form. We need a bit more information before we proceed:\n\n  • \n  • \n\nCould you please reply with the details above?\n\nThanks,\nHR — Unicodez';

export default function RequestInfoDialog({
  open,
  candidateId,
  candidateName,
  onClose,
  onSent,
}: Props) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    setSubmitting(true);
    try {
      await requestInfo(candidateId, subject, body);
      toast.success(`Email sent to ${candidateName}.`);
      onSent();
      onClose();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to send.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconMail size={20} />
          <Typography variant="h6" fontWeight={700}>
            Request more info
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Email goes to {candidateName} from hr@unicodez.com. They can reply
          to that thread.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            size="small"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
          />
          <TextField
            label="Body"
            multiline
            minRows={8}
            maxRows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || !subject.trim() || !body.trim()}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <IconMail size={16} />}
        >
          {submitting ? 'Sending…' : 'Send email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
