import { useEffect, useState } from 'react';
import {
  Box,
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
import { alpha } from '@mui/material/styles';
import {
  IconCheck,
  IconFileText,
  IconRotateClockwise,
  IconSignature,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { tokens } from '../../theme';
import {
  getOfferTemplate,
  updateOfferTemplate,
} from '../../services/onboardingApi';
import { OfferLetterTemplate } from '../../Interfaces/onboarding';
import OfferLetterRender from '../../components/onboarding/OfferLetterRender';

/**
 * Super-admin only template editor. Edits the SINGLE active row of the
 * OfferLetterTemplate collection. Saving creates a new active row and
 * marks the previous one inactive — so already-sent offers are
 * unaffected (each carries its own templateAtSendTime snapshot).
 *
 * Left column: editable fields. Right column: live preview with a
 * sample candidate so the admin can see the rendered output.
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

const SAMPLE_SNAPSHOT = {
  name: 'Asha Verma',
  position: 'Senior Software Engineer',
  startDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  annualSalary: 1200000,
  probationMonths: 3,
};

/**
 * Defaults mirror the server's `offerLetterTemplateModel.ts` schema
 * defaults — keep these in sync if the model defaults change. Used by
 * the "Restore defaults" button to overwrite the editor form values
 * (the actual save still flows through the same PATCH endpoint).
 *
 * The Employment Details block intentionally lives ONLY in the
 * structured InfoRow section below the body — repeating it in the
 * body text was duplicative. Appraisal + Leave & Benefits live in
 * Terms so all rules-of-engagement read as one block.
 */
const DEFAULT_BODY =
  'We are pleased to offer you the position of {{position}} at {{companyName}}. We believe that your skills and experience will be a valuable addition to our team, and we look forward to working with you.\n\nYour employment with us is subject to the conditions outlined in this letter and the company’s policies as referenced in the Terms & Conditions section below.';

const DEFAULT_TERMS =
  "Appraisal: Subject to your performance, your appraisal will be considered from the date of your confirmation and subject to market standards.\n\nLeave & Benefits: During the probation period, you will not be entitled to any leaves or additional benefits.\n\nYour employment will be subject to the company's policies and regulations. Upon successful completion of the probation period, your confirmation will be based on your performance and company requirements. The company reserves the right to terminate employment during the probation period with prior notice, as per company policy.\n\nThe probation period will be applicable as per company policy. In the event that the employee resigns or discontinues employment during the probation period, no salary, experience certificate, or relieving letter shall be released or issued.\n\nUpon successful completion of probation, the employees' services will be confirmed in writing. Post confirmation, the notice period will be 45 days, subject to management's discretion. The company reserves the right to relieve the employee earlier or adjust the notice period as deemed appropriate.";

const DEFAULT_SALUTATION = 'Dear {{firstName}},';

const DEFAULT_CLOSING =
  'Please sign and return a copy of this letter as a token of your acceptance of the offer. If you have any questions, feel free to reach out.\n\nWe look forward to welcoming you to our team and wish you success in your role.';

export default function OnboardingTemplateEditor({ open, onClose }: Props) {
  const [doc, setDoc] = useState<OfferLetterTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getOfferTemplate()
      .then((res) => setDoc(res.data))
      .catch((e) => {
        toast.error(
          (e as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || 'Failed to load template.',
        );
      })
      .finally(() => setLoading(false));
  }, [open]);

  function set<K extends keyof OfferLetterTemplate>(
    key: K,
    value: OfferLetterTemplate[K],
  ) {
    setDoc((p) => (p ? { ...p, [key]: value } : p));
  }

  /**
   * Resets the four editable body fields to the cleaned-up defaults.
   * Only mutates LOCAL form state — the admin still has to click
   * Save to persist (so a misclick is recoverable by closing the
   * dialog). Signatory + company fields are left alone because
   * those are organisation-specific and shouldn't be overwritten by
   * a "restore" action.
   */
  function restoreDefaults() {
    if (!doc) return;
    if (
      !window.confirm(
        'Restore the salutation, body, terms and closing to the default content? Signatory and company fields will be left as-is. Click Save afterwards to apply.',
      )
    )
      return;
    setDoc({
      ...doc,
      salutationTemplate: DEFAULT_SALUTATION,
      bodyTemplate: DEFAULT_BODY,
      termsTemplate: DEFAULT_TERMS,
      closingTemplate: DEFAULT_CLOSING,
    });
    toast.info('Defaults loaded into the form. Click Save to apply.');
  }

  /**
   * Read the picked image as a data URL and stash it on the form. We
   * cap the source at ~500 KB so the doc stays small (templates are
   * cloned on every PATCH so growing this field weighs every version).
   * PNG with a transparent background renders cleanest over the offer
   * letter's pale-blue signature card; JPG also works.
   */
  function handleSignatureUpload(file?: File | null) {
    if (!file || !doc) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
      toast.error('Pick a PNG, JPG, GIF or WebP image.');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Signature image is too large. Keep it under 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      setDoc((p) =>
        p ? { ...p, directorSignatureDataUrl: url } : p,
      );
    };
    reader.onerror = () =>
      toast.error("Couldn't read that file. Try a different one.");
    reader.readAsDataURL(file);
  }

  function clearSignature() {
    if (!doc) return;
    setDoc({ ...doc, directorSignatureDataUrl: '' });
  }

  async function save() {
    if (!doc) return;
    setSubmitting(true);
    try {
      const patch = {
        salutationTemplate: doc.salutationTemplate,
        bodyTemplate: doc.bodyTemplate,
        termsTemplate: doc.termsTemplate,
        closingTemplate: doc.closingTemplate,
        signatoryName: doc.signatoryName,
        signatoryTitle: doc.signatoryTitle,
        companyName: doc.companyName,
        companyAddress: doc.companyAddress,
        companyEmail: doc.companyEmail,
        companyWebsite: doc.companyWebsite,
        directorSignatureDataUrl: doc.directorSignatureDataUrl || '',
      };
      const res = await updateOfferTemplate(patch);
      setDoc(res.data);
      toast.success('Offer letter template updated.');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to save.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconFileText size={20} />
          <Typography variant="h6" fontWeight={700}>
            Edit offer letter template
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Use {`{{firstName}}`}, {`{{position}}`}, {`{{startDate}}`},{' '}
          {`{{annualSalary}}`}, {`{{probationMonths}}`}, {`{{companyName}}`}{' '}
          as placeholders. Already-sent offers are unaffected.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading || !doc ? (
          <Stack direction="row" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="Salutation"
                  value={doc.salutationTemplate}
                  onChange={(e) => set('salutationTemplate', e.target.value)}
                  disabled={submitting}
                />
                <TextField
                  label="Body"
                  multiline
                  minRows={6}
                  maxRows={12}
                  value={doc.bodyTemplate}
                  onChange={(e) => set('bodyTemplate', e.target.value)}
                  disabled={submitting}
                />
                <TextField
                  label="Terms & conditions"
                  multiline
                  minRows={5}
                  maxRows={12}
                  value={doc.termsTemplate}
                  onChange={(e) => set('termsTemplate', e.target.value)}
                  disabled={submitting}
                />
                <TextField
                  label="Closing"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={doc.closingTemplate}
                  onChange={(e) => set('closingTemplate', e.target.value)}
                  disabled={submitting}
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Signatory name"
                    value={doc.signatoryName}
                    onChange={(e) => set('signatoryName', e.target.value)}
                    disabled={submitting}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Signatory title"
                    value={doc.signatoryTitle}
                    onChange={(e) => set('signatoryTitle', e.target.value)}
                    disabled={submitting}
                  />
                </Stack>
                {/* Director signature — uploaded image auto-paints onto
                    every new offer letter above the signatory line. */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: doc.directorSignatureDataUrl
                      ? alpha(tokens.colors.success, 0.4)
                      : alpha(tokens.colors.pink, 0.3),
                    bgcolor: doc.directorSignatureDataUrl
                      ? alpha(tokens.colors.success, 0.04)
                      : alpha(tokens.colors.pink, 0.03),
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: doc.directorSignatureDataUrl ? 1.5 : 0 }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(tokens.colors.pink, 0.1),
                        color: tokens.colors.pink,
                        flexShrink: 0,
                      }}
                    >
                      <IconSignature size={16} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                          color: tokens.colors.lightText,
                          lineHeight: 1.2,
                        }}
                      >
                        Director signature
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.3 }}
                      >
                        PNG with transparent background works best. Auto-painted
                        above {doc.signatoryName || 'the signatory'}'s name on
                        every new offer.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        component="label"
                        startIcon={<IconUpload size={14} />}
                        disabled={submitting}
                        sx={{ fontSize: 11 }}
                      >
                        {doc.directorSignatureDataUrl ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          hidden
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={(e) =>
                            handleSignatureUpload(e.target.files?.[0])
                          }
                        />
                      </Button>
                      {doc.directorSignatureDataUrl && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<IconX size={12} />}
                          onClick={clearSignature}
                          disabled={submitting}
                          sx={{ fontSize: 11, minWidth: 0 }}
                        >
                          Clear
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  {doc.directorSignatureDataUrl && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#fff',
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(
                          tokens.colors.lightTextSecondary,
                          0.15,
                        )}`,
                        p: 1.5,
                        minHeight: 80,
                      }}
                    >
                      <Box
                        component="img"
                        src={doc.directorSignatureDataUrl}
                        alt="Director signature"
                        sx={{
                          maxHeight: 64,
                          maxWidth: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  )}
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Company name"
                    value={doc.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    disabled={submitting}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Company email"
                    value={doc.companyEmail}
                    onChange={(e) => set('companyEmail', e.target.value)}
                    disabled={submitting}
                  />
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Company address"
                    value={doc.companyAddress}
                    onChange={(e) => set('companyAddress', e.target.value)}
                    disabled={submitting}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Company website"
                    value={doc.companyWebsite}
                    onChange={(e) => set('companyWebsite', e.target.value)}
                    disabled={submitting}
                  />
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  background: 'grey.50',
                  p: 2,
                  borderRadius: 2,
                  overflow: 'auto',
                  maxHeight: 720,
                }}
              >
                <OfferLetterRender
                  snapshot={SAMPLE_SNAPSHOT}
                  template={doc}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button
          onClick={restoreDefaults}
          disabled={submitting || loading || !doc}
          startIcon={<IconRotateClockwise size={14} />}
          color="inherit"
        >
          Restore defaults
        </Button>
        <Stack direction="row" spacing={1}>
        <Button onClick={onClose} disabled={submitting}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={submitting || loading || !doc}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconCheck size={16} />
            )
          }
        >
          {submitting ? 'Saving…' : 'Save template'}
        </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
