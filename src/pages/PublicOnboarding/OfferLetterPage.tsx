import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconCheck,
  IconDownload,
  IconMapPin,
  IconPencil,
  IconShieldCheck,
  IconSignature,
  IconTypography,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  resolvePublicToken,
  signPublicOffer,
  SignOfferPayload,
} from '../../services/onboardingApi';
import { ResolveTokenResult } from '../../Interfaces/onboarding';
import SignatureCanvas from '../../components/onboarding/SignatureCanvas';
import OfferLetterRender, {
  SIGNATURE_CURSIVE_FONT_STACK,
} from '../../components/onboarding/OfferLetterRender';
import LinkUnavailable from './LinkUnavailable';
import { downloadSlipAsPdf } from '../../components/salary/downloadSlipPdf';
import { tokens } from '../../theme';

/**
 * Candidate's offer letter page.
 *
 * Two states the page handles:
 *
 *   1. Pre-signing → renders the letter, shows the signature interface
 *      (Draw or Type tabs) + name field + acceptance checkbox + an
 *      optional "share my location for the verification stamp" toggle.
 *      Submit POSTs the signature back; on success we flip to state 2.
 *
 *   2. Post-signing → renders the letter again with the signature
 *      painted into the signature line and a "Digitally verified"
 *      block beneath it showing who/when/where. A Download-PDF button
 *      captures the rendered DOM via html2canvas and ships an A4 PDF
 *      to the candidate's device.
 *
 * Mounted outside ProtectedRoute. Token in URL is the credential.
 */

type SignatureMode = 'drawn' | 'typed';

export default function OfferLetterPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [resolved, setResolved] = useState<ResolveTokenResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  // Mode toggle + per-mode state. Persist both so toggling tabs
  // doesn't lose the user's in-progress work.
  const [mode, setMode] = useState<SignatureMode>('drawn');
  const [drawnDataUrl, setDrawnDataUrl] = useState('');
  const [typedName, setTypedName] = useState('');

  const [fullName, setFullName] = useState('');
  const [accept, setAccept] = useState(false);
  // Opt-in geolocation. We don't ask for permission on page load —
  // only when the candidate ticks the box, so the prompt feels
  // explicit (per the user's "if allowed then" framing).
  const [shareLocation, setShareLocation] = useState(false);
  const [
    capturedGeo,
    setCapturedGeo,
  ] = useState<SignOfferPayload['geoLocation']>(undefined);
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  // Visual flag — flipped immediately on successful sign so the
  // post-sign view paints without a refetch round-trip.
  const [signedLocally, setSignedLocally] = useState(false);
  const letterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    resolvePublicToken(token).then((r) => {
      setResolved(r);
      setLoading(false);
      if (r.ok && r.data.candidate.offer?.signedAt) setSignedLocally(true);
    });
  }, [token]);

  // When the user checks "share my location", actively prompt the
  // browser. Drop the toggle if they deny so they're not stuck in an
  // ambiguous "loading" state.
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

  // Derive once from the resolved payload. We deliberately compute
  // these BEFORE any conditional early-return below so the hook order
  // stays stable across all render states (Rules of Hooks).
  const candidate =
    resolved && resolved.ok ? resolved.data.candidate : undefined;
  const offer = candidate?.offer;
  const expectedName = offer?.snapshot?.name || '';
  const isAlreadySigned = signedLocally || Boolean(offer?.signedAt);

  // Choose what to paint in the candidate's signature card. Pre-sign:
  // whatever the user is currently working on. Post-sign: pull the
  // values from the offer doc itself so a refresh shows the same.
  // Hooks MUST run on every render — keep them above the early returns.
  const liveSig = useMemo(() => {
    if (isAlreadySigned) return offer?.signatureDataUrl || '';
    return mode === 'drawn' ? drawnDataUrl : '';
  }, [isAlreadySigned, offer?.signatureDataUrl, mode, drawnDataUrl]);

  const liveTypedName = useMemo(() => {
    if (isAlreadySigned) return offer?.signatureTypedName || '';
    return mode === 'typed' ? typedName : '';
  }, [isAlreadySigned, offer?.signatureTypedName, mode, typedName]);

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

  const liveSignatureMode: SignatureMode | undefined = isAlreadySigned
    ? offer.signatureMode
    : mode;

  const liveSignedName = isAlreadySigned
    ? offer.signedFullName || expectedName
    : '';
  const liveSignedDate = isAlreadySigned ? offer.signatureDate : undefined;

  // Submit-button enable rule. Drawn mode → needs a drawn image.
  // Typed mode → needs a typed name long enough to be plausible.
  const signatureReady =
    mode === 'drawn'
      ? Boolean(drawnDataUrl)
      : typedName.trim().length >= 2;

  const nameMatches =
    fullName.trim().toLowerCase() === expectedName.trim().toLowerCase();

  async function submit() {
    if (!signatureReady || !fullName.trim() || !nameMatches || !accept) {
      toast.error(
        mode === 'drawn'
          ? 'Draw your signature, type your full name as it appears on the offer, and tick the acceptance box.'
          : 'Type your signature, confirm your full name as it appears on the offer, and tick the acceptance box.',
      );
      return;
    }
    setSigning(true);
    try {
      const payload: SignOfferPayload = {
        signedFullName: fullName,
        signatureDate: new Date().toISOString(),
        signatureMode: mode,
      };
      if (mode === 'drawn') {
        payload.signatureDataUrl = drawnDataUrl;
      } else {
        payload.signatureTypedName = typedName.trim();
      }
      if (capturedGeo) payload.geoLocation = capturedGeo;
      // The sign endpoint returns the updated candidate so we can
      // paint the post-sign view (with the server-stamped IP +
      // timestamp + stored geo) WITHOUT another round-trip — and
      // critically, without re-resolving the token in a way that
      // could 410 if the token were ever consumed.
      const signResult = await signPublicOffer(token, payload);
      const updatedCandidate = signResult?.data?.candidate;
      if (updatedCandidate && resolved && resolved.ok) {
        setResolved({
          ok: true,
          data: {
            ...resolved.data,
            candidate: updatedCandidate,
          },
        });
      }
      setSignedLocally(true);
      toast.success('Welcome aboard — your signed copy is ready to download.');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Signing failed.';
      toast.error(msg);
    } finally {
      setSigning(false);
    }
  }

  async function downloadPdf() {
    const el = letterRef.current?.querySelector(
      '.offer-letter-page',
    ) as HTMLElement | null;
    if (!el || !candidate) return;
    const filename = `Offer-${candidate.candId}.pdf`;
    await downloadSlipAsPdf(el, filename);
  }

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
          {isAlreadySigned ? (
            // Celebratory thank-you card — animated entrance so it
            // feels like a "we got it" confirmation right after the
            // candidate clicks Accept & sign.
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
                      Thank you for accepting your offer!
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        opacity: 0.92,
                        mt: 1,
                        lineHeight: 1.5,
                      }}
                    >
                      We've recorded your signature and a confirmation
                      email is on its way. Your signed copy is ready —
                      download it below for your records.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<IconDownload size={16} />}
                    onClick={downloadPdf}
                    sx={{
                      bgcolor: '#fff',
                      color: tokens.colors.success,
                      fontWeight: 800,
                      flexShrink: 0,
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.92),
                      },
                    }}
                  >
                    Download PDF
                  </Button>
                </Stack>
              </Box>
            </motion.div>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  color: tokens.colors.pink,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                UNICODEZ SOFTCORP — OFFER OF EMPLOYMENT
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                Please review and sign
              </Typography>
              <Typography color="text.secondary">
                Read through the letter, then sign at the bottom.
              </Typography>
            </Box>
          )}

          <Box ref={letterRef}>
            <OfferLetterRender
              snapshot={offer.snapshot}
              template={offer.templateAtSendTime}
              signatureDataUrl={liveSig || undefined}
              signatureMode={liveSignatureMode}
              signatureTypedName={liveTypedName || undefined}
              signedFullName={liveSignedName || undefined}
              signatureDate={liveSignedDate}
              signedByEmail={
                isAlreadySigned ? offer.signedByEmail : undefined
              }
              signedFromIp={
                isAlreadySigned ? offer.signedFromIp : undefined
              }
              signedFromLocation={
                isAlreadySigned ? offer.signedFromLocation : undefined
              }
            />
          </Box>

          {isAlreadySigned ? (
            // Secondary download button below the letter so users who
            // scroll past the hero card still have a clear CTA.
            <Stack
              direction="row"
              justifyContent="center"
              sx={{ pb: 4 }}
            >
              <Button
                variant="outlined"
                size="large"
                startIcon={<IconDownload size={16} />}
                onClick={downloadPdf}
              >
                Download signed copy
              </Button>
            </Stack>
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
                Sign &amp; accept
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 2 }}
              >
                Date today: {moment().format('DD MMM YYYY')} · we'll record
                this along with your IP address
                {shareLocation ? ' and approximate location' : ''} as part of
                the digital verification stamp.
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
                  <SignatureCanvas onChange={setDrawnDataUrl} />
                ) : (
                  <Box>
                    <TextField
                      size="small"
                      fullWidth
                      label="Type your signature"
                      placeholder="e.g. Asha Verma"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      helperText="We'll display this in a handwriting font as your signature."
                    />
                    {/* Preview card — paints the typed name in the same
                        cursive font the rendered offer letter uses,
                        so what you see here is what HR sees. */}
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
                  label="I have read and accept the terms of this offer letter."
                />
                {/* Opt-in geolocation. Default off — purely additive. */}
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
                        <IconMapPin
                          size={14}
                          color={tokens.colors.blue}
                        />
                        <Typography variant="body2">
                          Include my approximate location with the signature
                          (optional)
                        </Typography>
                      </Stack>
                    }
                  />
                  {geoStatus === 'requesting' && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', ml: 4 }}
                    >
                      Asking your browser for permission…
                    </Typography>
                  )}
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
                  {geoStatus === 'unavailable' && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', ml: 4 }}
                    >
                      Your browser doesn't support geolocation.
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
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      signing ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <IconSignature size={16} />
                      )
                    }
                    disabled={
                      signing || !signatureReady || !nameMatches || !accept
                    }
                    onClick={submit}
                  >
                    {signing ? 'Submitting…' : 'Accept & sign'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
