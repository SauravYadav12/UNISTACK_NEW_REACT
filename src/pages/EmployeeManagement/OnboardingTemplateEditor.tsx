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
  IconButton,
  Stack,
  Tooltip,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconBook,
  IconCheck,
  IconFileText,
  IconGavel,
  IconLockSquare,
  IconCalendarTime,
  IconPlus,
  IconRotateClockwise,
  IconSignature,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import {
  getOfferTemplate,
  updateOfferTemplate,
  getOnboardingDocTemplates,
  updateOnboardingDocTemplate,
} from '../../services/onboardingApi';
import {
  OfferLetterTemplate,
  OnboardingDocKind,
  ONBOARDING_DOC_KINDS,
  ONBOARDING_DOC_LABELS,
  OnboardingDocTemplate,
} from '../../Interfaces/onboarding';
import OfferLetterRender from '../../components/onboarding/OfferLetterRender';
import DocumentLetterRender from '../../components/onboarding/DocumentLetterRender';
import { tokens } from '../../theme';

/**
 * Super-admin onboarding template editor.
 *
 * Five entries live behind a left-side vertical menu:
 *   1. Offer Letter (legacy single-doc template — existing
 *      offerLetterTemplate collection)
 *   2-5. Employment Agreement / Code of Conduct / NDA / Leave Policy
 *      (new onboardingDocTemplate collection, discriminated by kind)
 *
 * The right pane swaps between the two editor layouts depending on
 * which entry is active. Both honour the same versioned-overwrite
 * contract: editing creates a new active row + marks the previous
 * inactive, so already-sent offers (which captured a snapshot at
 * send-time) are unaffected.
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

type EditorTab = 'offer-letter' | OnboardingDocKind;

interface TabSpec {
  key: EditorTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabSpec[] = [
  {
    key: 'offer-letter',
    label: 'Offer Letter',
    icon: <IconFileText size={16} />,
  },
  {
    key: 'employment-agreement',
    label: ONBOARDING_DOC_LABELS['employment-agreement'],
    icon: <IconBook size={16} />,
  },
  {
    key: 'code-of-conduct',
    label: ONBOARDING_DOC_LABELS['code-of-conduct'],
    icon: <IconGavel size={16} />,
  },
  {
    key: 'nda',
    label: ONBOARDING_DOC_LABELS['nda'],
    icon: <IconLockSquare size={16} />,
  },
  {
    key: 'leave-policy',
    label: ONBOARDING_DOC_LABELS['leave-policy'],
    icon: <IconCalendarTime size={16} />,
  },
];

const SAMPLE_SNAPSHOT = {
  name: 'Asha Verma',
  position: 'Senior Software Engineer',
  startDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  annualSalary: 1200000,
  probationMonths: 3,
};

// Same default body / terms strings the previous editor knew about —
// kept here so the offer-letter "Restore defaults" button still works.
const DEFAULT_OFFER_BODY =
  'We are pleased to offer you the position of {{position}} at {{companyName}}. We believe that your skills and experience will be a valuable addition to our team, and we look forward to working with you.\n\nYour employment with us is subject to the conditions outlined in this letter and the company’s policies as referenced in the Terms & Conditions section below.';
const DEFAULT_OFFER_TERMS =
  "Appraisal: Subject to your performance, your appraisal will be considered from the date of your confirmation and subject to market standards.\n\nLeave & Benefits: During the probation period, you will not be entitled to any leaves or additional benefits.\n\nYour employment will be subject to the company's policies and regulations. Upon successful completion of the probation period, your confirmation will be based on your performance and company requirements. The company reserves the right to terminate employment during the probation period with prior notice, as per company policy.\n\nThe probation period will be applicable as per company policy. In the event that the employee resigns or discontinues employment during the probation period, no salary, experience certificate, or relieving letter shall be released or issued.\n\nUpon successful completion of probation, the employees' services will be confirmed in writing. Post confirmation, the notice period will be 45 days, subject to management's discretion. The company reserves the right to relieve the employee earlier or adjust the notice period as deemed appropriate.";
const DEFAULT_OFFER_SALUTATION = 'Dear {{firstName}},';
const DEFAULT_OFFER_CLOSING =
  'Please sign and return a copy of this letter as a token of your acceptance of the offer. If you have any questions, feel free to reach out.\n\nWe look forward to welcoming you to our team and wish you success in your role.';

export default function OnboardingTemplateEditor({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<EditorTab>('offer-letter');
  const [offerDoc, setOfferDoc] = useState<OfferLetterTemplate | null>(null);
  const [docs, setDocs] = useState<
    Partial<Record<OnboardingDocKind, OnboardingDocTemplate>>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getOfferTemplate(), getOnboardingDocTemplates()])
      .then(([offerRes, docsRes]) => {
        setOfferDoc(offerRes.data);
        setDocs(docsRes.data);
      })
      .catch((e) => {
        toast.error(
          (e as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || 'Failed to load templates.',
        );
      })
      .finally(() => setLoading(false));
  }, [open]);

  function setOfferField<K extends keyof OfferLetterTemplate>(
    key: K,
    value: OfferLetterTemplate[K],
  ) {
    setOfferDoc((p) => (p ? { ...p, [key]: value } : p));
  }

  function setDocField<K extends keyof OnboardingDocTemplate>(
    kind: OnboardingDocKind,
    key: K,
    value: OnboardingDocTemplate[K],
  ) {
    setDocs((p) => {
      const cur = p[kind];
      if (!cur) return p;
      return { ...p, [kind]: { ...cur, [key]: value } };
    });
  }

  function restoreOfferDefaults() {
    if (!offerDoc) return;
    if (
      !window.confirm(
        'Restore the salutation, body, terms and closing to the default content? Click Save afterwards to apply.',
      )
    )
      return;
    setOfferDoc({
      ...offerDoc,
      salutationTemplate: DEFAULT_OFFER_SALUTATION,
      bodyTemplate: DEFAULT_OFFER_BODY,
      termsTemplate: DEFAULT_OFFER_TERMS,
      closingTemplate: DEFAULT_OFFER_CLOSING,
    });
    toast.info('Defaults loaded into the form. Click Save to apply.');
  }

  function handleSignatureUpload(file?: File | null) {
    if (!file) return;
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
      if (activeTab === 'offer-letter') {
        setOfferField('directorSignatureDataUrl', url);
      } else {
        setDocField(activeTab, 'directorSignatureDataUrl', url);
      }
    };
    reader.onerror = () =>
      toast.error("Couldn't read that file. Try a different one.");
    reader.readAsDataURL(file);
  }

  function clearSignature() {
    if (activeTab === 'offer-letter') {
      setOfferField('directorSignatureDataUrl', '');
    } else {
      setDocField(activeTab, 'directorSignatureDataUrl', '');
    }
  }

  async function save() {
    setSubmitting(true);
    try {
      if (activeTab === 'offer-letter' && offerDoc) {
        const patch = {
          salutationTemplate: offerDoc.salutationTemplate,
          bodyTemplate: offerDoc.bodyTemplate,
          termsTemplate: offerDoc.termsTemplate,
          closingTemplate: offerDoc.closingTemplate,
          signatoryName: offerDoc.signatoryName,
          signatoryTitle: offerDoc.signatoryTitle,
          companyName: offerDoc.companyName,
          companyAddress: offerDoc.companyAddress,
          companyEmail: offerDoc.companyEmail,
          companyWebsite: offerDoc.companyWebsite,
          directorSignatureDataUrl: offerDoc.directorSignatureDataUrl || '',
        };
        const res = await updateOfferTemplate(patch);
        setOfferDoc(res.data);
      } else if (activeTab !== 'offer-letter') {
        const cur = docs[activeTab];
        if (!cur) return;
        const patch: Partial<OnboardingDocTemplate> = {
          title: cur.title,
          preamble: cur.preamble,
          sections: cur.sections,
          acknowledgment: cur.acknowledgment,
          signatoryName: cur.signatoryName,
          signatoryTitle: cur.signatoryTitle,
          companyName: cur.companyName,
          companyAddress: cur.companyAddress,
          companyEmail: cur.companyEmail,
          companyWebsite: cur.companyWebsite,
          directorSignatureDataUrl: cur.directorSignatureDataUrl || '',
        };
        const res = await updateOnboardingDocTemplate(activeTab, patch);
        setDocs((p) => ({ ...p, [activeTab]: res.data }));
      }
      toast.success('Template updated.');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to save.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const activeDoc = activeTab !== 'offer-letter' ? docs[activeTab] : null;
  const activeSignatureUrl =
    activeTab === 'offer-letter'
      ? offerDoc?.directorSignatureDataUrl
      : activeDoc?.directorSignatureDataUrl;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { height: { md: '90vh' } } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconFileText size={20} />
          <Typography variant="h6" fontWeight={700}>
            Onboarding templates
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Edit the offer letter and four additional onboarding documents. All
          edits create a new active version; previously-sent offers are
          unaffected (each carries its own snapshot).
        </Typography>
        <Tooltip title="Close" placement="left" arrow>
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
      <DialogContent dividers sx={{ p: 0 }}>
        {loading || !offerDoc ? (
          <Stack direction="row" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Grid container sx={{ height: '100%' }}>
            {/* Left rail */}
            <Grid
              size={{ xs: 12, md: 2.5 }}
              sx={{
                borderRight: { md: '1px solid' },
                borderColor: { md: 'divider' },
                bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.4),
                p: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: tokens.colors.lightTextSecondary,
                  pl: 1.25,
                  mb: 1,
                }}
              >
                Templates
              </Typography>
              <Stack spacing={0.5}>
                {TABS.map((t) => {
                  const isActive = activeTab === t.key;
                  return (
                    <Box
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: isActive
                          ? alpha(tokens.colors.pink, 0.1)
                          : 'transparent',
                        borderLeft: '3px solid',
                        borderColor: isActive
                          ? tokens.colors.pink
                          : 'transparent',
                        color: isActive
                          ? tokens.colors.pink
                          : tokens.colors.lightText,
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 13,
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: alpha(tokens.colors.pink, 0.05),
                        },
                      }}
                    >
                      {t.icon}
                      <Box sx={{ minWidth: 0, flex: 1 }}>{t.label}</Box>
                    </Box>
                  );
                })}
              </Stack>
            </Grid>

            {/* Right pane — editor + preview */}
            <Grid size={{ xs: 12, md: 9.5 }} sx={{ overflow: 'auto', p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 5 }}>
                  {activeTab === 'offer-letter' ? (
                    <OfferTemplateEditor
                      doc={offerDoc}
                      submitting={submitting}
                      onChange={setOfferField}
                    />
                  ) : activeDoc ? (
                    <DocTemplateEditor
                      doc={activeDoc}
                      submitting={submitting}
                      onChange={(key, value) =>
                        setDocField(activeTab, key, value)
                      }
                    />
                  ) : (
                    <Stack
                      direction="row"
                      justifyContent="center"
                      sx={{ py: 6 }}
                    >
                      <CircularProgress size={24} />
                    </Stack>
                  )}

                  {/* Director signature uploader — shared UI across all
                      tabs, writes to whichever template is active. */}
                  <Box
                    sx={{
                      mt: 2.5,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: activeSignatureUrl
                        ? alpha(tokens.colors.success, 0.4)
                        : alpha(tokens.colors.pink, 0.3),
                      bgcolor: activeSignatureUrl
                        ? alpha(tokens.colors.success, 0.04)
                        : alpha(tokens.colors.pink, 0.03),
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ mb: activeSignatureUrl ? 1.5 : 0 }}
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
                          Auto-painted on this document above the signatory's
                          name. PNG with transparent background works best.
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
                          {activeSignatureUrl ? 'Replace' : 'Upload'}
                          <input
                            type="file"
                            hidden
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            onChange={(e) =>
                              handleSignatureUpload(e.target.files?.[0])
                            }
                          />
                        </Button>
                        {activeSignatureUrl && (
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
                    {activeSignatureUrl && (
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
                          src={activeSignatureUrl}
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
                </Grid>

                {/* Preview pane */}
                <Grid size={{ xs: 12, lg: 7 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.5),
                      overflow: 'auto',
                      maxHeight: '70vh',
                    }}
                  >
                    {activeTab === 'offer-letter' && offerDoc ? (
                      <OfferLetterRender
                        snapshot={SAMPLE_SNAPSHOT}
                        template={offerDoc}
                      />
                    ) : activeDoc ? (
                      <DocumentLetterRender
                        template={activeDoc}
                        vars={{
                          firstName: SAMPLE_SNAPSHOT.name.split(' ')[0],
                          lastName: SAMPLE_SNAPSHOT.name
                            .split(' ')
                            .slice(1)
                            .join(' '),
                          name: SAMPLE_SNAPSHOT.name,
                          position: SAMPLE_SNAPSHOT.position,
                          probationMonths: SAMPLE_SNAPSHOT.probationMonths,
                        }}
                      />
                    ) : null}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        {activeTab === 'offer-letter' ? (
          <Button
            onClick={restoreOfferDefaults}
            disabled={submitting || loading || !offerDoc}
            startIcon={<IconRotateClockwise size={14} />}
            color="inherit"
          >
            Restore defaults
          </Button>
        ) : (
          <Box />
        )}
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={submitting || loading}
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

// ─────────────────────────────────────────────────────────────────────
// Sub-editors

interface OfferEditorProps {
  doc: OfferLetterTemplate;
  submitting: boolean;
  onChange<K extends keyof OfferLetterTemplate>(
    key: K,
    value: OfferLetterTemplate[K],
  ): void;
}

function OfferTemplateEditor({ doc, submitting, onChange }: OfferEditorProps) {
  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Salutation"
        value={doc.salutationTemplate}
        onChange={(e) => onChange('salutationTemplate', e.target.value)}
        disabled={submitting}
      />
      <TextField
        label="Body"
        multiline
        minRows={5}
        maxRows={10}
        value={doc.bodyTemplate}
        onChange={(e) => onChange('bodyTemplate', e.target.value)}
        disabled={submitting}
      />
      <TextField
        label="Terms & conditions"
        multiline
        minRows={5}
        maxRows={12}
        value={doc.termsTemplate}
        onChange={(e) => onChange('termsTemplate', e.target.value)}
        disabled={submitting}
      />
      <TextField
        label="Closing"
        multiline
        minRows={3}
        maxRows={6}
        value={doc.closingTemplate}
        onChange={(e) => onChange('closingTemplate', e.target.value)}
        disabled={submitting}
      />
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label="Signatory name"
          value={doc.signatoryName}
          onChange={(e) => onChange('signatoryName', e.target.value)}
          disabled={submitting}
        />
        <TextField
          size="small"
          fullWidth
          label="Signatory title"
          value={doc.signatoryTitle}
          onChange={(e) => onChange('signatoryTitle', e.target.value)}
          disabled={submitting}
        />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label="Company name"
          value={doc.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          disabled={submitting}
        />
        <TextField
          size="small"
          fullWidth
          label="Company email"
          value={doc.companyEmail}
          onChange={(e) => onChange('companyEmail', e.target.value)}
          disabled={submitting}
        />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label="Company address"
          value={doc.companyAddress}
          onChange={(e) => onChange('companyAddress', e.target.value)}
          disabled={submitting}
        />
        <TextField
          size="small"
          fullWidth
          label="Company website"
          value={doc.companyWebsite}
          onChange={(e) => onChange('companyWebsite', e.target.value)}
          disabled={submitting}
        />
      </Stack>
    </Stack>
  );
}

interface DocEditorProps {
  doc: OnboardingDocTemplate;
  submitting: boolean;
  onChange<K extends keyof OnboardingDocTemplate>(
    key: K,
    value: OnboardingDocTemplate[K],
  ): void;
}

function DocTemplateEditor({ doc, submitting, onChange }: DocEditorProps) {
  function updateSection(
    idx: number,
    patch: Partial<{ heading: string; body: string }>,
  ) {
    const next = doc.sections.map((s, i) =>
      i === idx ? { ...s, ...patch } : s,
    );
    onChange('sections', next);
  }
  function addSection() {
    onChange('sections', [
      ...doc.sections,
      { heading: 'New section', body: '' },
    ]);
  }
  function removeSection(idx: number) {
    onChange(
      'sections',
      doc.sections.filter((_, i) => i !== idx),
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Document title"
        value={doc.title}
        onChange={(e) => onChange('title', e.target.value)}
        disabled={submitting}
      />
      <TextField
        label="Preamble"
        multiline
        minRows={3}
        maxRows={8}
        value={doc.preamble}
        onChange={(e) => onChange('preamble', e.target.value)}
        disabled={submitting}
        helperText="The opening paragraph rendered above the numbered sections. Supports {{name}}, {{position}}, {{probationMonths}}."
      />
      {/* Numbered sections — each shows heading + body. Section
          numbers are auto-assigned by the renderer based on order. */}
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: tokens.colors.lightTextSecondary,
            }}
          >
            Sections ({doc.sections.length})
          </Typography>
          <Button
            size="small"
            startIcon={<IconPlus size={14} />}
            onClick={addSection}
            disabled={submitting}
          >
            Add section
          </Button>
        </Stack>
        <Stack spacing={1.5}>
          {doc.sections.map((s, i) => (
            <Box
              key={i}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: alpha(tokens.colors.pink, 0.1),
                    color: tokens.colors.pink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  variant="standard"
                  placeholder="Section heading"
                  value={s.heading}
                  onChange={(e) =>
                    updateSection(i, { heading: e.target.value })
                  }
                  disabled={submitting}
                  InputProps={{
                    sx: { fontWeight: 700, fontSize: 13 },
                  }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeSection(i)}
                  disabled={submitting}
                >
                  <IconTrash size={14} />
                </IconButton>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={10}
                size="small"
                placeholder="Section body"
                value={s.body}
                onChange={(e) => updateSection(i, { body: e.target.value })}
                disabled={submitting}
              />
            </Box>
          ))}
        </Stack>
      </Box>
      <TextField
        label="Acknowledgment"
        multiline
        minRows={2}
        maxRows={5}
        value={doc.acknowledgment}
        onChange={(e) => onChange('acknowledgment', e.target.value)}
        disabled={submitting}
        helperText="The single-line acknowledgment the employee signs against."
      />
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label="Signatory name"
          value={doc.signatoryName}
          onChange={(e) => onChange('signatoryName', e.target.value)}
          disabled={submitting}
        />
        <TextField
          size="small"
          fullWidth
          label="Signatory title"
          value={doc.signatoryTitle}
          onChange={(e) => onChange('signatoryTitle', e.target.value)}
          disabled={submitting}
        />
      </Stack>
    </Stack>
  );
}
