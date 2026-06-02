import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconMapPin,
  IconPencil,
  IconShieldCheck,
  IconSignature,
  IconTypography,
} from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { motion } from 'framer-motion';
import {
  resolvePublicToken,
  signPublicOffer,
  signPublicAdditionalDoc,
  SignOfferPayload,
  SignAdditionalDocPayload,
} from '../../services/onboardingApi';
import {
  ONBOARDING_DOC_KINDS,
  ONBOARDING_DOC_LABELS,
  OnboardingDocKind,
  OnboardingDocTemplateSnapshot,
  PublicCandidateView,
  ResolveTokenResult,
} from '../../Interfaces/onboarding';
import SignatureCanvas from '../../components/onboarding/SignatureCanvas';
import OfferLetterRender, {
  SIGNATURE_CURSIVE_FONT_STACK,
} from '../../components/onboarding/OfferLetterRender';
import DocumentLetterRender from '../../components/onboarding/DocumentLetterRender';
import LinkUnavailable from './LinkUnavailable';
import { downloadSlipAsPdf } from '../../components/salary/downloadSlipPdf';
import { tokens } from '../../theme';

/**
 * Candidate's onboarding signing page — five sequential documents:
 *
 *   Step 0: Offer letter (the OfferLetterRender we already had)
 *   Step 1-4: Employment Agreement, Code of Conduct, NDA,
 *             Leave & Attendance Policy (DocumentLetterRender)
 *
 * Each step has its own signature interface (Draw / Type tabs) plus
 * a "Save & next" button that persists the signature and advances.
 * The final step's button reads "Submit & complete" and flips the
 * candidate to `onboarded`. After all five, the page paints a
 * celebratory thank-you screen with per-doc download buttons.
 *
 * State persistence is server-side: every "Save & next" hits the
 * server. If the candidate closes the tab mid-flow, opening the link
 * later jumps them straight to the next unsigned doc (the resume
 * logic reads `offer.signedAt` + `additionalSignedDocuments[]` from
 * the resolved candidate to pick the right step).
 */

type SignatureMode = 'drawn' | 'typed';
type StepKey = 'offer-letter' | OnboardingDocKind;

const STEP_ORDER: StepKey[] = [
  'offer-letter',
  ...ONBOARDING_DOC_KINDS,
];

const STEP_LABELS: Record<StepKey, string> = {
  'offer-letter': 'Offer Letter',
  'employment-agreement': ONBOARDING_DOC_LABELS['employment-agreement'],
  'code-of-conduct': ONBOARDING_DOC_LABELS['code-of-conduct'],
  nda: ONBOARDING_DOC_LABELS['nda'],
  'leave-policy': ONBOARDING_DOC_LABELS['leave-policy'],
};

function computeInitialStep(candidate: PublicCandidateView | undefined): number {
  if (!candidate) return 0;
  // Offer letter unsigned → step 0
  if (!candidate.offer?.signedAt) return 0;
  // Otherwise find the first additional doc that's still unsigned
  const signedKinds = new Set(
    (candidate.additionalSignedDocuments || []).map((d) => d.kind),
  );
  for (let i = 0; i < ONBOARDING_DOC_KINDS.length; i++) {
    if (!signedKinds.has(ONBOARDING_DOC_KINDS[i])) return i + 1;
  }
  // All five signed → past the end (render thank-you)
  return STEP_ORDER.length;
}

export default function OfferLetterPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [resolved, setResolved] = useState<ResolveTokenResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  // Active step index into STEP_ORDER (0=offer-letter ... 4=leave-policy,
  // 5=thank-you).
  const [stepIdx, setStepIdx] = useState(0);

  // Signature state — reset each time we advance to a new step.
  const [mode, setMode] = useState<SignatureMode>('drawn');
  const [drawnDataUrl, setDrawnDataUrl] = useState('');
  const [typedName, setTypedName] = useState('');
  const [fullName, setFullName] = useState('');
  const [accept, setAccept] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [capturedGeo, setCapturedGeo] =
    useState<SignOfferPayload['geoLocation']>(undefined);
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  const letterRef = useRef<HTMLDivElement | null>(null);
  const downloadRefs = useRef<Record<StepKey, HTMLDivElement | null>>(
    {} as Record<StepKey, HTMLDivElement | null>,
  );

  useEffect(() => {
    resolvePublicToken(token).then((r) => {
      setResolved(r);
      setLoading(false);
      if (r.ok) {
        const initial = computeInitialStep(r.data.candidate);
        setStepIdx(initial);
      }
    });
  }, [token]);

  // Reset per-step signature state whenever we advance.
  useEffect(() => {
    setDrawnDataUrl('');
    setTypedName('');
    setFullName('');
    setAccept(false);
    setMode('drawn');
  }, [stepIdx]);

  // Opt-in geolocation — same UX as the previous version.
  useEffect(() => {
    if (!shareLocation) {
      setCapturedGeo(undefined);
      setGeoStatus('idle');
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturedGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus('granted');
      },
      () => {
        setCapturedGeo(undefined);
        setGeoStatus('denied');
        setShareLocation(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, [shareLocation]);

  const candidate =
    resolved && resolved.ok ? resolved.data.candidate : undefined;
  const offer = candidate?.offer;
  const expectedName = offer?.snapshot?.name || '';

  // Build placeholder vars used by all four additional docs.
  const docVars = useMemo(() => {
    if (!offer) {
      return {
        firstName: '',
        lastName: '',
        name: '',
        position: '',
        probationMonths: 3,
      };
    }
    return {
      firstName: offer.snapshot.name.split(' ')[0] || offer.snapshot.name,
      lastName: offer.snapshot.name.split(' ').slice(1).join(' '),
      name: offer.snapshot.name,
      position: offer.snapshot.position,
      probationMonths: offer.snapshot.probationMonths,
      startDate: moment(offer.snapshot.startDate).format('DD MMM YYYY'),
      annualSalary: new Intl.NumberFormat('en-IN').format(
        offer.snapshot.annualSalary,
      ),
    };
  }, [offer]);

  const snapshotsByKind = useMemo(() => {
    const map = new Map<OnboardingDocKind, OnboardingDocTemplateSnapshot>();
    for (const s of candidate?.additionalDocSnapshots || []) {
      map.set(s.kind, s);
    }
    return map;
  }, [candidate?.additionalDocSnapshots]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!resolved || !resolved.ok) {
    return (
      <LinkUnavailable
        reason={resolved?.ok === false ? resolved.reason : 'not-found'}
      />
    );
  }

  if (!candidate || !offer?.snapshot || !offer.templateAtSendTime) {
    return <LinkUnavailable reason="not-found" />;
  }

  const isDone = stepIdx >= STEP_ORDER.length;
  const currentKey = isDone ? null : STEP_ORDER[stepIdx];
  const isFinalStep = stepIdx === STEP_ORDER.length - 1;

  // Per-step "is this one already signed on the server?" check —
  // critical for the resume case where we want the page to show the
  // saved signature on revisit, not a blank canvas.
  const isStepSignedRemote = (key: StepKey): boolean => {
    if (key === 'offer-letter') return Boolean(offer.signedAt);
    return (candidate.additionalSignedDocuments || []).some(
      (d) => d.kind === key,
    );
  };

  const currentSignedRemote =
    currentKey != null && isStepSignedRemote(currentKey);

  // Submit-enable gate.
  const signatureReady =
    mode === 'drawn'
      ? Boolean(drawnDataUrl)
      : typedName.trim().length >= 2;
  const nameMatches =
    fullName.trim().toLowerCase() === expectedName.trim().toLowerCase();
  const canSubmit = signatureReady && nameMatches && accept;

  async function submitOfferLetter() {
    const payload: SignOfferPayload = {
      signedFullName: fullName,
      signatureDate: new Date().toISOString(),
      signatureMode: mode,
    };
    if (mode === 'drawn') payload.signatureDataUrl = drawnDataUrl;
    else payload.signatureTypedName = typedName.trim();
    if (capturedGeo) payload.geoLocation = capturedGeo;
    const result = await signPublicOffer(token, payload);
    return result?.data?.candidate;
  }

  async function submitAdditional(kind: OnboardingDocKind) {
    const payload: SignAdditionalDocPayload = {
      signedFullName: fullName,
      signatureDate: new Date().toISOString(),
      signatureMode: mode,
    };
    if (mode === 'drawn') payload.signatureDataUrl = drawnDataUrl;
    else payload.signatureTypedName = typedName.trim();
    if (capturedGeo) payload.geoLocation = capturedGeo;
    const result = await signPublicAdditionalDoc(token, kind, payload);
    return result?.data?.candidate;
  }

  async function handleSaveAndNext() {
    if (!canSubmit || !currentKey) {
      toast.error(
        mode === 'drawn'
          ? 'Draw your signature, confirm your full name, and tick acceptance.'
          : 'Type your signature, confirm your full name, and tick acceptance.',
      );
      return;
    }
    setSigning(true);
    try {
      const updatedCandidate =
        currentKey === 'offer-letter'
          ? await submitOfferLetter()
          : await submitAdditional(currentKey);
      if (updatedCandidate && resolved && resolved.ok) {
        setResolved({
          ok: true,
          data: {
            ...resolved.data,
            candidate: updatedCandidate,
          },
        });
      }
      toast.success(
        isFinalStep
          ? 'Onboarding complete — welcome to Unicodez!'
          : 'Saved. Moving to the next document.',
      );
      setStepIdx((p) => p + 1);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Signing failed.';
      toast.error(msg);
    } finally {
      setSigning(false);
    }
  }

  async function downloadStepPdf(key: StepKey) {
    const containerEl = downloadRefs.current[key];
    const el = containerEl?.querySelector('.offer-letter-page') as
      | HTMLElement
      | null;
    if (!el) {
      toast.error('Document not ready for download yet.');
      return;
    }
    const filename = `${STEP_LABELS[key].replace(/\s+/g, '-')}-${
      candidate?.candId
    }.pdf`;
    await downloadSlipAsPdf(el, filename);
  }

  // ── Render the active document (used by both pre-sign and review) ──
  // Closure-scoped — narrowing on `offer` from the guard above doesn't
  // carry into nested functions, so we re-check the snapshot/template
  // and bail to null when missing. Callers only invoke after a non-null
  // candidate is in scope, so this is purely a TS satisfier.
  function renderDoc(
    key: StepKey,
    options: {
      signedFullName?: string;
      live?: {
        mode: SignatureMode;
        dataUrl?: string;
        typedName?: string;
      };
      mountRef?: boolean;
    } = {},
  ): React.ReactNode {
    if (!offer?.snapshot || !offer.templateAtSendTime) return null;
    const localOffer = offer;
    if (key === 'offer-letter') {
      // Pre-sign vs post-sign — same as the previous single-doc page.
      const stepSigned = Boolean(localOffer.signedAt);
      const liveDataUrl = stepSigned
        ? localOffer.signatureDataUrl
        : options.live?.mode === 'drawn'
          ? options.live.dataUrl
          : undefined;
      const liveTyped = stepSigned
        ? localOffer.signatureTypedName
        : options.live?.mode === 'typed'
          ? options.live.typedName
          : undefined;
      const liveSignatureMode = stepSigned
        ? localOffer.signatureMode
        : options.live?.mode;
      return (
        <Box ref={options.mountRef ? bindDownloadRef(key) : undefined}>
          <OfferLetterRender
            snapshot={localOffer.snapshot}
            template={localOffer.templateAtSendTime}
            signatureDataUrl={liveDataUrl || undefined}
            signatureMode={liveSignatureMode}
            signatureTypedName={liveTyped || undefined}
            signedFullName={
              stepSigned
                ? localOffer.signedFullName || expectedName
                : options.signedFullName
            }
            signatureDate={stepSigned ? localOffer.signatureDate : undefined}
            signedByEmail={stepSigned ? localOffer.signedByEmail : undefined}
            signedFromIp={stepSigned ? localOffer.signedFromIp : undefined}
            signedFromLocation={
              stepSigned ? localOffer.signedFromLocation : undefined
            }
          />
        </Box>
      );
    }
    // Additional doc.
    const snap = snapshotsByKind.get(key);
    if (!snap) return null;
    const signedRecord = (candidate?.additionalSignedDocuments || []).find(
      (d) => d.kind === key,
    );
    return (
      <Box ref={options.mountRef ? bindDownloadRef(key) : undefined}>
        <DocumentLetterRender
          template={snap}
          vars={docVars}
          signed={signedRecord}
          liveSignature={signedRecord ? undefined : options.live}
          signedFullName={options.signedFullName}
        />
      </Box>
    );
  }

  function bindDownloadRef(key: StepKey) {
    return (el: HTMLDivElement | null) => {
      downloadRefs.current[key] = el;
    };
  }

  // Thank-you screen — all 5 signed, candidate landed past the end.
  if (isDone) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: tokens.gradients.warmGlow,
          py: { xs: 3, sm: 5 },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3}>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  color: '#fff',
                  background: `linear-gradient(135deg, ${tokens.colors.success} 0%, ${tokens.colors.blue} 100%)`,
                  boxShadow: tokens.shadows.soft4,
                  p: { xs: 3, sm: 4 },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 2, sm: 3 }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: alpha('#fff', 0.18),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 0 0 6px ${alpha('#fff', 0.08)}`,
                    }}
                  >
                    <IconCheck size={32} stroke={3} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        opacity: 0.9,
                        fontSize: 11,
                      }}
                    >
                      Welcome to Unicodez
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: 24, sm: 30 },
                        fontWeight: 900,
                        lineHeight: 1.2,
                        mt: 0.5,
                      }}
                    >
                      Thank you, {offer.snapshot.name.split(' ')[0]} — onboarding
                      is complete!
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        opacity: 0.92,
                        mt: 1,
                        lineHeight: 1.5,
                      }}
                    >
                      All five documents have been signed and verified. A
                      confirmation email is on its way. You can download your
                      copies of every document below — keep them for your
                      records.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </motion.div>

            {/* Download grid — one card per signed doc */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: tokens.colors.pink,
                  mb: 1.5,
                }}
              >
                Your signed documents
              </Typography>
              <Stack spacing={1}>
                {STEP_ORDER.map((key) => (
                  <Stack
                    key={key}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: alpha(tokens.colors.success, 0.04),
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{ minWidth: 0, flex: 1 }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1.5,
                          bgcolor: alpha(tokens.colors.success, 0.15),
                          color: tokens.colors.success,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconCheck size={16} stroke={3} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {STEP_LABELS[key]}
                      </Typography>
                    </Stack>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<IconDownload size={14} />}
                      onClick={() => downloadStepPdf(key)}
                    >
                      Download
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Hidden render area — every doc rendered offscreen so the
                Download buttons can capture them via html2canvas. Placed
                in the live DOM (not display:none, which html2canvas can't
                reliably capture) but moved off-screen with absolute
                positioning. */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 0,
                left: -99999,
                pointerEvents: 'none',
                opacity: 0,
              }}
            >
              {STEP_ORDER.map((key) => (
                <Box key={key} sx={{ mb: 4 }}>
                  {renderDoc(key, { mountRef: true })}
                </Box>
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Active-step view — header + stepper + doc + sign panel.
  if (!currentKey) return null;
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: tokens.gradients.warmGlow,
        py: { xs: 3, sm: 5 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.pink,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              UNICODEZ SOFTCORP — ONBOARDING DOCUMENTS
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              Step {stepIdx + 1} of {STEP_ORDER.length}:{' '}
              {STEP_LABELS[currentKey]}
            </Typography>
            <Typography color="text.secondary">
              Review the document, then sign and continue.
            </Typography>
          </Box>

          {/* Stepper — clickable for already-signed past steps */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stepper activeStep={stepIdx} alternativeLabel>
              {STEP_ORDER.map((key, idx) => {
                const signed = isStepSignedRemote(key);
                return (
                  <Step key={key} completed={signed}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontSize: 11,
                          fontWeight: stepIdx === idx ? 800 : 600,
                        },
                      }}
                    >
                      {STEP_LABELS[key]}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* Rendered document with live signature preview */}
          <Box ref={letterRef}>
            {renderDoc(currentKey, {
              live: {
                mode,
                dataUrl: drawnDataUrl,
                typedName: typedName.trim(),
              },
              signedFullName: nameMatches ? fullName : undefined,
            })}
          </Box>

          {/* Sign panel — same UI we already built for the offer letter
              alone, parametrised on the current step's key. If the
              candidate is REVIEWING an already-signed past step (e.g.
              they hit Back), we show a read-only "Signed" banner and
              a continue button. */}
          {currentSignedRemote ? (
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: alpha(tokens.colors.success, 0.05),
                border: `1px solid ${alpha(tokens.colors.success, 0.3)}`,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: alpha(tokens.colors.success, 0.15),
                      color: tokens.colors.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck size={18} stroke={3} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800}>
                      Already signed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      You signed this document previously. Continue to the
                      next.
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  endIcon={<IconArrowRight size={16} />}
                  onClick={() => setStepIdx((p) => p + 1)}
                >
                  Continue
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                Sign &amp; continue
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 2 }}
              >
                Date today: {moment().format('DD MMM YYYY')} · we'll record
                this along with your IP address
                {shareLocation ? ' and approximate location' : ''} as part of
                the digital verification stamp for this document.
              </Typography>

              <Tabs
                value={mode}
                onChange={(_, v) => setMode(v as SignatureMode)}
                sx={{
                  mb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                }}
              >
                <Tab
                  value="drawn"
                  icon={<IconPencil size={14} />}
                  iconPosition="start"
                  label="Draw signature"
                />
                <Tab
                  value="typed"
                  icon={<IconTypography size={14} />}
                  iconPosition="start"
                  label="Type signature"
                />
              </Tabs>

              <Stack spacing={2}>
                {mode === 'drawn' ? (
                  <SignatureCanvas
                    key={`canvas-${stepIdx}`}
                    onChange={setDrawnDataUrl}
                  />
                ) : (
                  <Box>
                    <TextField
                      size="small"
                      fullWidth
                      label="Type your signature"
                      placeholder={`e.g. ${expectedName}`}
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      helperText="We'll display this in a handwriting font as your signature."
                    />
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 2.5,
                        minHeight: 110,
                        borderRadius: 2.5,
                        border: '1.5px dashed',
                        borderColor: alpha(tokens.colors.pink, 0.35),
                        bgcolor: alpha(tokens.colors.pink, 0.03),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: tokens.colors.lightTextSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        Signature preview
                      </Typography>
                      <Box
                        sx={{
                          fontFamily: SIGNATURE_CURSIVE_FONT_STACK,
                          fontSize: 44,
                          fontStyle: 'italic',
                          color: tokens.colors.lightText,
                          lineHeight: 1,
                          textAlign: 'center',
                          mt: 1,
                          minHeight: 50,
                        }}
                      >
                        {typedName.trim() || (
                          <Box
                            component="span"
                            sx={{
                              color: tokens.colors.lightTextSecondary,
                              opacity: 0.5,
                              fontSize: 18,
                              fontFamily: 'inherit',
                            }}
                          >
                            Your typed signature will appear here…
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
                <TextField
                  size="small"
                  label={`Type your full name (must match "${expectedName}")`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                  error={Boolean(fullName) && !nameMatches}
                  helperText={
                    fullName && !nameMatches
                      ? `Must match "${expectedName}" exactly.`
                      : ' '
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={accept}
                      onChange={(e) => setAccept(e.target.checked)}
                    />
                  }
                  label={
                    currentKey === 'offer-letter'
                      ? 'I have read and accept the terms of this offer letter.'
                      : `I have read and accept this ${STEP_LABELS[currentKey]}.`
                  }
                />
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(tokens.colors.blue, 0.04),
                    border: '1px solid',
                    borderColor: alpha(tokens.colors.blue, 0.15),
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={shareLocation}
                        onChange={(e) => setShareLocation(e.target.checked)}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconMapPin size={14} color={tokens.colors.blue} />
                        <Typography variant="body2">
                          Include my approximate location with the signature
                          (optional)
                        </Typography>
                      </Stack>
                    }
                  />
                  {geoStatus === 'granted' && capturedGeo && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        ml: 4,
                        color: tokens.colors.success,
                        fontWeight: 600,
                      }}
                    >
                      Location captured · {capturedGeo.latitude.toFixed(4)},{' '}
                      {capturedGeo.longitude.toFixed(4)}
                      {capturedGeo.accuracy
                        ? ` (±${Math.round(capturedGeo.accuracy)} m)`
                        : ''}
                    </Typography>
                  )}
                  {geoStatus === 'denied' && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: 'block', ml: 4 }}
                    >
                      Permission denied — we'll skip the location on the stamp.
                    </Typography>
                  )}
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  useFlexGap
                  spacing={1}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ color: tokens.colors.lightTextSecondary }}
                  >
                    <IconShieldCheck size={14} />
                    <Typography variant="caption">
                      Your IP and timestamp are auto-captured for verification.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      label={`Step ${stepIdx + 1} / ${STEP_ORDER.length}`}
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(tokens.colors.pink, 0.08),
                        color: tokens.colors.pink,
                      }}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        signing ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : isFinalStep ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconSignature size={16} />
                        )
                      }
                      disabled={signing || !canSubmit}
                      onClick={handleSaveAndNext}
                    >
                      {signing
                        ? 'Saving…'
                        : isFinalStep
                          ? 'Submit & complete'
                          : 'Save & next'}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
