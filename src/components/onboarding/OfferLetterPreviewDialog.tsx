import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { IconEdit, IconSend, IconX, IconFileText } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { getOfferTemplate } from '../../services/onboardingApi';
import {
  OfferLetterTemplate,
  OnboardingOfferSnapshot,
} from '../../Interfaces/onboarding';
import OfferLetterRender from './OfferLetterRender';

/**
 * Reusable preview modal for the offer letter — used as the "verify
 * before send" step on any flow that ships an offer to a candidate.
 *
 * Loads the CURRENT active template on open so HR sees exactly the
 * boilerplate the candidate will see, with the live snapshot (the
 * `name / position / startDate / annualSalary / probationMonths`
 * passed in) substituted into the placeholders.
 *
 * The two actions are intentionally symmetric so HR can iterate:
 *   - Revise → close THIS modal (the upstream Edit / Compose dialog
 *     stays open so HR can tweak the salary / start date / etc.).
 *   - Send   → commit; the caller actually fires the API and decides
 *     how to clean up on success.
 *
 * This component does NOT issue the send itself — it just calls back
 * via `onSend`. That keeps it pure and reusable across:
 *   - First-time send at bg-check-passed (OfferLetterComposeDialog).
 *   - Revised re-send at offer-sent (EditCandidateDialog).
 */

interface Props {
  open: boolean;
  /** Candidate first name — used in the helper banner ("X will receive
   *  this letter"). The letter itself substitutes name via snapshot. */
  firstName: string;
  /** The offer variables to substitute into the template. Built by the
   *  parent from the latest form state. */
  snapshot: OnboardingOfferSnapshot;
  /** Called when HR clicks Revise — should close THIS modal but keep
   *  the upstream edit dialog open so HR can edit + re-preview. */
  onRevise: () => void;
  /** Called when HR clicks Send — fires the actual API. The parent is
   *  responsible for closing the modal + upstream dialog on success,
   *  and for surfacing any errors. */
  onSend: () => Promise<void> | void;
  /** True while the parent's send is in flight — disables both buttons
   *  and shows a spinner on Send. */
  sending: boolean;
  /** Optional title override. Defaults to "Preview offer letter". */
  title?: string;
}

export default function OfferLetterPreviewDialog({
  open,
  firstName,
  snapshot,
  onRevise,
  onSend,
  sending,
  title = 'Preview offer letter',
}: Props) {
  const [template, setTemplate] = useState<OfferLetterTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // Re-fetch the template every time the modal opens (don't cache) so
  // a super-admin tweak between two preview-and-send cycles shows up
  // immediately. Cancellation flag protects against a slow request
  // resolving after the user already closed the modal.
  useEffect(() => {
    if (!open) {
      setTemplate(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOfferTemplate()
      .then((res) => {
        if (!cancelled) setTemplate(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        toast.error(
          (e as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || 'Failed to load offer template.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // ESC / backdrop click both route through Revise (closing the
  // preview never sends — never silently abandons either, since the
  // parent's edit dialog stays open underneath). Disabled while a
  // send is in flight so an accidental ESC doesn't drop the request.
  const handleClose = (
    _: unknown,
    reason?: 'escapeKeyDown' | 'backdropClick',
  ) => {
    if (sending) return;
    if (
      reason === 'escapeKeyDown' ||
      reason === 'backdropClick' ||
      reason === undefined
    ) {
      onRevise();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          fontWeight: 700,
        }}
      >
        <IconFileText size={20} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="div" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review what the candidate will receive. Click Revise to
            adjust the details, or Send to email it now.
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => !sending && onRevise()}
          disabled={sending}
          aria-label="Close preview"
        >
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 320,
            }}
          >
            <CircularProgress />
          </Box>
        ) : template ? (
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: { xs: 1.5, sm: 2.5 },
              borderRadius: 1.5,
            }}
          >
            <OfferLetterRender
              snapshot={snapshot}
              template={{
                salutationTemplate: template.salutationTemplate,
                bodyTemplate: template.bodyTemplate,
                termsTemplate: template.termsTemplate,
                closingTemplate: template.closingTemplate,
                signatoryName: template.signatoryName,
                signatoryTitle: template.signatoryTitle,
                companyName: template.companyName,
                companyAddress: template.companyAddress,
                companyEmail: template.companyEmail,
                companyWebsite: template.companyWebsite,
                directorSignatureDataUrl: template.directorSignatureDataUrl,
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{
                mt: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: 'info.50',
                border: '1px dashed',
                borderColor: 'info.light',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                The candidate <strong>{firstName}</strong> will receive
                this letter at the email on file. Old offer-letter
                links (if any) will be revoked on send.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="error" variant="body2">
              Template not available. Close and try again, or check the
              offer-letter template in super-admin settings.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onRevise}
          disabled={sending}
          startIcon={<IconEdit size={16} />}
          color="inherit"
        >
          Revise
        </Button>
        <Button
          onClick={() => void onSend()}
          variant="contained"
          disabled={sending || loading || !template}
          startIcon={
            sending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconSend size={16} />
            )
          }
        >
          {sending ? 'Sending…' : 'Send to candidate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
