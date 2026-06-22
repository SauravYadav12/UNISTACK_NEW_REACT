import { useMemo, useRef, useState } from 'react';
import {
  Box, Button, CircularProgress, Stack, Typography, alpha, Dialog,
  DialogTitle, DialogContent, IconButton,
} from '@mui/material';
import moment from 'moment';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  IconDownload, IconEye, IconFileText, IconUserCheck, IconX, IconHelp,
} from '@tabler/icons-react';

import { useFetchData } from '../../hooks/fetchDataHook';
import { tokens } from '../../theme/theme';
import {
  MyOnboardingDocsResponse,
  ONBOARDING_DOC_KINDS,
  ONBOARDING_DOC_LABELS,
  OnboardingDocKind,
} from '../../Interfaces/onboarding';
import { getMyOnboardingDocs } from '../../services/onboardingApi';
import OfferLetterRender from '../../components/onboarding/OfferLetterRender';
import DocumentLetterRender from '../../components/onboarding/DocumentLetterRender';
import { downloadSlipAsPdf } from '../../components/salary/downloadSlipPdf';

const MotionBox = motion.create(Box);

/**
 * Onboarding documents tab — renders the employee's own signed offer
 * letter + 4 additional documents. Data comes from a lazy server-side
 * email match (User.email + UserProfile.email.personal/.official ↔
 * OnboardingCandidate.email) so no migration is needed for already-
 * onboarded employees.
 *
 * Each card has a Preview (full document in a dialog) + Download PDF
 * action. The actual rendering is delegated to the same components
 * the public flow uses (OfferLetterRender / DocumentLetterRender) so
 * the employee sees exactly what they signed.
 */
export default function OnboardingDocsPanel() {
  const { data: payload, loading } = useFetchData<
    MyOnboardingDocsResponse | undefined
  >(async () => {
    try {
      const { data } = await getMyOnboardingDocs();
      return data;
    } catch {
      return undefined;
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!payload || !payload.hasOnboarding) {
    return <NoDocsState />;
  }

  return <LoadedPanel payload={payload} />;
}

function NoDocsState() {
  return (
    <MotionBox
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        py: 8, px: 3, textAlign: 'center', borderRadius: 4,
        bgcolor: alpha(tokens.colors.blue, 0.04),
        border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
      }}
    >
      <Box sx={{
        width: 60, height: 60, borderRadius: '50%',
        bgcolor: alpha(tokens.colors.blue, 0.12),
        color: tokens.colors.blue,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        mb: 2,
      }}>
        <IconHelp size={28} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 16, color: tokens.colors.lightText }}>
        No onboarding documents on file
      </Typography>
      <Typography sx={{ fontSize: 13, color: tokens.colors.lightTextSecondary, mt: 0.75, maxWidth: 460, mx: 'auto' }}>
        We couldn&rsquo;t find signed onboarding paperwork linked to your account.
        If you completed onboarding through this portal, please reach out to HR &mdash;
        they can verify the email on record matches your login.
      </Typography>
    </MotionBox>
  );
}

interface LoadedProps {
  payload: Extract<MyOnboardingDocsResponse, { hasOnboarding: true }>;
}

function LoadedPanel({ payload }: LoadedProps) {
  const { candidate, offer, additionalDocSnapshots, additionalSignedDocuments } = payload;

  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const signedAt = offer?.signedAt;

  // Map kind → its snapshot + signed record once, so the card list
  // can render in the canonical ONBOARDING_DOC_KINDS order even if
  // the database stored them out of order.
  const docMap = useMemo(() => {
    const snapByKind: Partial<Record<OnboardingDocKind, typeof additionalDocSnapshots[number]>> = {};
    for (const s of additionalDocSnapshots) snapByKind[s.kind] = s;
    const signedByKind: Partial<Record<OnboardingDocKind, typeof additionalSignedDocuments[number]>> = {};
    for (const d of additionalSignedDocuments) signedByKind[d.kind] = d;
    return { snapByKind, signedByKind };
  }, [additionalDocSnapshots, additionalSignedDocuments]);

  return (
    <Box>
      <HeroStrip name={fullName} signedAt={signedAt} stage={candidate.stage} />

      <Stack spacing={2}>
        {offer && offer.templateAtSendTime ? (
          <OfferDocumentCard
            title="Offer Letter"
            description={`Signed on ${offer.signatureDate ? moment(offer.signatureDate).format('DD MMM YYYY') : '—'}`}
            offer={offer}
            employeeName={fullName}
          />
        ) : null}

        {ONBOARDING_DOC_KINDS.map((kind) => {
          const snap = docMap.snapByKind[kind];
          const signed = docMap.signedByKind[kind];
          if (!snap) return null;
          return (
            <AdditionalDocumentCard
              key={kind}
              kind={kind}
              snapshot={snap}
              signed={signed}
              offerSnapshot={offer?.snapshot}
              employeeName={fullName}
              fallbackPosition={candidate.position}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

function HeroStrip({
  name, signedAt, stage,
}: { name: string; signedAt?: string; stage: string }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        p: 2.5, mb: 3, borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(tokens.colors.pink, 0.08)} 0%, ${alpha(tokens.colors.blue, 0.08)} 100%)`,
        border: `1px solid ${alpha(tokens.colors.pink, 0.18)}`,
      }}
    >
      <Box sx={{
        width: 48, height: 48, borderRadius: '50%',
        bgcolor: tokens.colors.pink, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconUserCheck size={24} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: tokens.colors.lightText }}>
          Welcome aboard, {name.split(' ')[0] || name}
        </Typography>
        <Typography sx={{ fontSize: 13, color: tokens.colors.lightTextSecondary, mt: 0.25 }}>
          {signedAt
            ? `Offer signed on ${moment(signedAt).format('DD MMM YYYY')} · ${stage === 'onboarded' ? 'Onboarding complete' : 'Onboarding in progress'}`
            : 'Your signed paperwork is below.'}
        </Typography>
      </Box>
    </MotionBox>
  );
}

interface OfferCardProps {
  title: string;
  description: string;
  offer: NonNullable<Extract<MyOnboardingDocsResponse, { hasOnboarding: true }>['offer']>;
  employeeName: string;
}

function OfferDocumentCard({ title, description, offer, employeeName }: OfferCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const renderRef = useRef<HTMLDivElement | null>(null);

  const filename = `Unicodez-Offer-Letter-${employeeName.replace(/\s+/g, '-')}.pdf`;

  async function handleDownload() {
    if (!renderRef.current) {
      // Open preview first so the DOM exists, then download next tick.
      setPreviewOpen(true);
      setTimeout(() => handleDownload(), 400);
      return;
    }
    setDownloading(true);
    try {
      await downloadSlipAsPdf(renderRef.current, filename);
    } catch (err) {
      console.error('Offer letter PDF download failed', err);
      toast.error('Could not generate PDF. Try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <DocCardShell
        title={title}
        description={description}
        accent={tokens.colors.pink}
        onPreview={() => setPreviewOpen(true)}
        onDownload={handleDownload}
        downloading={downloading}
      />
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        onDownload={handleDownload}
        downloading={downloading}
      >
        <Box ref={renderRef}>
          <OfferLetterRender
            snapshot={offer.snapshot}
            template={offer.templateAtSendTime}
            signatureDataUrl={offer.signatureDataUrl}
            signatureMode={offer.signatureMode}
            signatureTypedName={offer.signatureTypedName}
            signedFullName={offer.signedFullName}
            signatureDate={offer.signatureDate}
            signedByEmail={offer.signedByEmail}
            signedFromIp={offer.signedFromIp}
            signedFromLocation={offer.signedFromLocation}
          />
        </Box>
      </PreviewDialog>
    </>
  );
}

interface AdditionalDocCardProps {
  kind: OnboardingDocKind;
  snapshot: Extract<MyOnboardingDocsResponse, { hasOnboarding: true }>['additionalDocSnapshots'][number];
  signed?: Extract<MyOnboardingDocsResponse, { hasOnboarding: true }>['additionalSignedDocuments'][number];
  offerSnapshot?: { name?: string; position?: string; startDate?: string; annualSalary?: number; probationMonths?: number };
  employeeName: string;
  fallbackPosition: string;
}

function AdditionalDocumentCard({
  kind, snapshot, signed, offerSnapshot, employeeName, fallbackPosition,
}: AdditionalDocCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const renderRef = useRef<HTMLDivElement | null>(null);

  const title = ONBOARDING_DOC_LABELS[kind];
  const description = signed
    ? `Signed on ${moment(signed.signatureDate).format('DD MMM YYYY')}`
    : 'Not signed yet';

  const filename = `Unicodez-${title.replace(/\s+/g, '-')}-${employeeName.replace(/\s+/g, '-')}.pdf`;

  // Mirrors the variable construction used in OnboardingCandidateDrawer
  // so the rendered document substitutes placeholders the same way
  // the candidate originally saw it.
  const vars = useMemo(() => {
    const full = offerSnapshot?.name || employeeName;
    const first = full.split(' ')[0] || full;
    const last = full.split(' ').slice(1).join(' ');
    return {
      firstName: first,
      lastName: last,
      name: full,
      position: offerSnapshot?.position || fallbackPosition,
      probationMonths: offerSnapshot?.probationMonths ?? 0,
      startDate: offerSnapshot?.startDate
        ? moment(offerSnapshot.startDate).format('DD MMM YYYY')
        : undefined,
      annualSalary: offerSnapshot?.annualSalary
        ? new Intl.NumberFormat('en-IN').format(offerSnapshot.annualSalary)
        : undefined,
    };
  }, [offerSnapshot, employeeName, fallbackPosition]);

  async function handleDownload() {
    if (!renderRef.current) {
      setPreviewOpen(true);
      setTimeout(() => handleDownload(), 400);
      return;
    }
    setDownloading(true);
    try {
      await downloadSlipAsPdf(renderRef.current, filename);
    } catch (err) {
      console.error(`${title} PDF download failed`, err);
      toast.error('Could not generate PDF. Try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <DocCardShell
        title={title}
        description={description}
        accent={tokens.colors.blue}
        onPreview={() => setPreviewOpen(true)}
        onDownload={handleDownload}
        downloading={downloading}
        disabled={!signed}
      />
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        onDownload={handleDownload}
        downloading={downloading}
      >
        <Box ref={renderRef}>
          <DocumentLetterRender
            template={snapshot}
            vars={vars}
            signed={signed}
            signedFullName={signed?.signedFullName}
          />
        </Box>
      </PreviewDialog>
    </>
  );
}

interface DocCardShellProps {
  title: string;
  description: string;
  accent: string;
  onPreview: () => void;
  onDownload: () => void;
  downloading: boolean;
  disabled?: boolean;
}

function DocCardShell({
  title, description, accent, onPreview, onDownload, downloading, disabled,
}: DocCardShellProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        p: 2, borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: alpha(accent, 0.4),
          boxShadow: `0 4px 16px ${alpha(accent, 0.08)}`,
        },
      }}
    >
      <Box sx={{
        width: 44, height: 44, borderRadius: 2,
        bgcolor: alpha(accent, 0.1),
        color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconFileText size={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: tokens.colors.lightText }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary, mt: 0.25 }}>
          {description}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexShrink={0}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconEye size={16} />}
          onClick={onPreview}
          disabled={disabled}
          sx={{
            textTransform: 'none',
            borderColor: alpha(accent, 0.4),
            color: accent,
            '&:hover': { borderColor: accent, bgcolor: alpha(accent, 0.05) },
          }}
        >
          Preview
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={downloading
            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
            : <IconDownload size={16} />}
          onClick={onDownload}
          disabled={downloading || disabled}
          sx={{
            textTransform: 'none',
            bgcolor: accent,
            '&:hover': { bgcolor: accent, filter: 'brightness(0.92)' },
          }}
        >
          {downloading ? 'Generating…' : 'Download'}
        </Button>
      </Stack>
    </MotionBox>
  );
}

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onDownload: () => void;
  downloading: boolean;
  children: React.ReactNode;
}

function PreviewDialog({
  open, onClose, title, onDownload, downloading, children,
}: PreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            startIcon={downloading
              ? <CircularProgress size={14} sx={{ color: '#fff' }} />
              : <IconDownload size={16} />}
            onClick={onDownload}
            disabled={downloading}
            sx={{
              textTransform: 'none',
              bgcolor: tokens.colors.pink,
              '&:hover': { bgcolor: tokens.colors.pink, filter: 'brightness(0.92)' },
            }}
          >
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#F4F6F8', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>{children}</Box>
      </DialogContent>
    </Dialog>
  );
}
