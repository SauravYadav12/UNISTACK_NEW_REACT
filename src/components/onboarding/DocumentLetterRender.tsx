import { Box, Stack, Typography } from '@mui/material';
import moment from 'moment';
import {
  OnboardingDocTemplateSnapshot,
  OnboardingSignedAdditionalDoc,
  OnboardingSignedLocation,
} from '../../Interfaces/onboarding';
import { SIGNATURE_CURSIVE_FONT_STACK } from './OfferLetterRender';

/**
 * Generic renderer for the four additional onboarding documents
 * (Employment Agreement, Code of Conduct, NDA, Leave Policy).
 *
 * Mirrors the OfferLetterRender's design language so the PDF batch
 * the candidate downloads after onboarding reads as one consistent
 * package: navy header band with the Unicodez mark, pink corner
 * ribbon, branded footer, candidate + director signature cards with
 * accent stripes, optional digital verification stamp.
 *
 * Each template is structured as `preamble + sections[] + acknowledgment`.
 * Sections render as auto-numbered, bold-headed paragraphs. Placeholder
 * substitution supports {{name}}, {{firstName}}, {{position}},
 * {{probationMonths}}, {{companyName}} so the same template can adapt
 * to each candidate.
 */

const COLORS = {
  pink: '#EC4599',
  blue: '#37B7EA',
  yellow: '#FCE441',
  navy: '#032840',
  paper: '#FFFFFF',
  muted: '#5E7687',
  rule: '#E5EBEF',
};

const UnicodezMark = ({ size = 46 }: { size?: number }) => {
  const r = size / 2 - 6;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const seg = circumference / 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={COLORS.pink}
        strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`}
        strokeDashoffset="0"
        transform={`rotate(-90 ${c} ${c})`}
        strokeLinecap="round"
      />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={COLORS.blue}
        strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`}
        strokeDashoffset={-seg}
        transform={`rotate(-90 ${c} ${c})`}
        strokeLinecap="round"
      />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={COLORS.yellow}
        strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`}
        strokeDashoffset={-(2 * seg)}
        transform={`rotate(-90 ${c} ${c})`}
        strokeLinecap="round"
      />
    </svg>
  );
};

interface PlaceholderVars {
  firstName: string;
  lastName: string;
  name: string;
  position: string;
  probationMonths: number | string;
  startDate?: string;
  annualSalary?: number | string;
}

interface Props {
  template: OnboardingDocTemplateSnapshot;
  /** Candidate/employment context used to fill placeholders. */
  vars: PlaceholderVars;
  /** When present, paints the signed signature + verification stamp.
   *  Absent (pre-sign view): empty signature box and "Signature pending". */
  signed?: OnboardingSignedAdditionalDoc;
  /** Override at sign-time only: a live-typed or live-drawn signature
   *  that hasn't been persisted yet. The preview pane uses this so
   *  the candidate sees their in-progress signature on the actual
   *  document. */
  liveSignature?: {
    mode: 'drawn' | 'typed';
    dataUrl?: string;
    typedName?: string;
  };
  /** When present, displayed instead of "Signature pending". */
  signedFullName?: string;
}

function substitute(raw: string, vars: PlaceholderVars): string {
  const map: Record<string, string | number> = {
    firstName: vars.firstName,
    lastName: vars.lastName,
    name: vars.name,
    position: vars.position,
    probationMonths: vars.probationMonths,
    startDate: vars.startDate || '',
    annualSalary: vars.annualSalary || '',
    companyName: '', // filled by template's own field — left blank if used here
  };
  return raw.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    map[key] !== undefined && map[key] !== null && map[key] !== ''
      ? String(map[key])
      : `{{${key}}}`,
  );
}

export default function DocumentLetterRender({
  template,
  vars,
  signed,
  liveSignature,
  signedFullName,
}: Props) {
  // Fill placeholders across all template strings ONCE.
  const preamble = substitute(template.preamble || '', vars).replace(
    /\{\{companyName\}\}/g,
    template.companyName,
  );
  const acknowledgment = substitute(
    template.acknowledgment || '',
    vars,
  ).replace(/\{\{companyName\}\}/g, template.companyName);
  const sections = template.sections.map((s) => ({
    heading: substitute(s.heading, vars).replace(
      /\{\{companyName\}\}/g,
      template.companyName,
    ),
    body: substitute(s.body, vars).replace(
      /\{\{companyName\}\}/g,
      template.companyName,
    ),
  }));

  // Pick the rendering mode for the candidate's signature card.
  // Order of precedence: liveSignature (in-progress preview) →
  // persisted `signed` record → empty (pending state).
  const effective: {
    mode: 'drawn' | 'typed' | null;
    dataUrl?: string;
    typedName?: string;
  } = liveSignature
    ? {
        mode: liveSignature.mode,
        dataUrl: liveSignature.dataUrl,
        typedName: liveSignature.typedName,
      }
    : signed
      ? {
          mode: signed.signatureMode,
          dataUrl: signed.signatureDataUrl,
          typedName: signed.signatureTypedName,
        }
      : { mode: null };

  const candidateLineName =
    signedFullName ||
    signed?.signedFullName ||
    vars.name;

  // Build the digital verification stamp fields, but only if we have
  // a persisted record (we don't show stamp for in-progress live sigs).
  const verificationFields: Array<{ label: string; value: string }> = [];
  if (signed) {
    if (signed.signedFullName) {
      verificationFields.push({
        label: 'Signed by',
        value: signed.signedFullName,
      });
    }
    if (signed.signedByEmail) {
      verificationFields.push({ label: 'Email', value: signed.signedByEmail });
    }
    if (signed.signatureDate) {
      verificationFields.push({
        label: 'On',
        value: moment(signed.signatureDate).format('DD MMM YYYY · hh:mm:ss A'),
      });
    }
    if (signed.signedFromIp) {
      verificationFields.push({
        label: 'IP address',
        value: signed.signedFromIp,
      });
    }
    if (signed.signedFromLocation) {
      const loc: OnboardingSignedLocation = signed.signedFromLocation;
      const acc = loc.accuracy
        ? ` (±${Math.round(loc.accuracy)} m)`
        : '';
      verificationFields.push({
        label: 'Location',
        value: `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°${acc}`,
      });
    }
  }
  const showVerification = verificationFields.length > 0;

  return (
    <Box
      className="offer-letter-page"
      sx={{
        width: '210mm',
        maxWidth: '100%',
        margin: '0 auto',
        bgcolor: COLORS.paper,
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        color: COLORS.navy,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(3, 40, 64, 0.08)',
      }}
    >
      {/* Pink diagonal corner ribbon */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          width: 0,
          height: 0,
          borderTop: `90px solid ${COLORS.pink}`,
          borderLeft: '90px solid transparent',
        }}
      />

      {/* Navy header band */}
      <Box
        sx={{
          bgcolor: COLORS.navy,
          color: 'white',
          px: 5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <UnicodezMark size={46} />
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 1.5,
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}
          >
            {template.companyName}
          </Typography>
          <Typography sx={{ fontSize: 9.5, opacity: 0.65, mt: 0.3 }}>
            {template.companyAddress}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', pr: 2 }}>
          <Typography
            sx={{
              fontSize: 9,
              letterSpacing: 4,
              opacity: 0.7,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Document
          </Typography>
        </Box>
      </Box>

      {/* Title */}
      <Box sx={{ px: 5, pt: 3, pb: 1 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 0.5,
            color: COLORS.navy,
            textTransform: 'uppercase',
            textAlign: 'center',
            mb: 0.5,
          }}
        >
          {template.title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0.5,
            mb: 2,
          }}
        >
          <Box sx={{ width: 24, height: 3, bgcolor: COLORS.pink, borderRadius: 1 }} />
          <Box sx={{ width: 24, height: 3, bgcolor: COLORS.blue, borderRadius: 1 }} />
          <Box sx={{ width: 24, height: 3, bgcolor: COLORS.yellow, borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Preamble */}
      {preamble && (
        <Box sx={{ px: 5, pb: 2 }}>
          <Typography
            sx={{
              fontSize: 12,
              lineHeight: 1.65,
              color: COLORS.navy,
              whiteSpace: 'pre-wrap',
            }}
          >
            {preamble}
          </Typography>
        </Box>
      )}

      {/* Numbered sections */}
      <Box sx={{ px: 5, pb: 2 }}>
        {sections.map((s, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: COLORS.navy,
                mb: 0.75,
              }}
            >
              {i + 1}. {s.heading}
            </Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                lineHeight: 1.65,
                color: COLORS.muted,
                whiteSpace: 'pre-wrap',
              }}
            >
              {s.body}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Acknowledgment line */}
      {acknowledgment && (
        <Box
          sx={{
            px: 5,
            pb: 2,
            pt: 1,
          }}
        >
          <Box
            sx={{
              borderLeft: `3px solid ${COLORS.pink}`,
              pl: 2,
              py: 1.5,
              bgcolor: 'rgba(236, 69, 153, 0.04)',
            }}
          >
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: 1.5,
                color: COLORS.pink,
                fontWeight: 800,
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Acknowledgment
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                lineHeight: 1.55,
                color: COLORS.navy,
                fontStyle: 'italic',
                whiteSpace: 'pre-wrap',
              }}
            >
              {acknowledgment}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Signature cards */}
      <Box
        sx={{
          px: 5,
          py: 3,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 3,
          borderTop: `1px solid ${COLORS.rule}`,
          bgcolor: 'rgba(3, 40, 64, 0.02)',
        }}
      >
        {/* Company signatory */}
        <Box sx={{ borderLeft: `3px solid ${COLORS.pink}`, pl: 2 }}>
          <Typography
            sx={{
              fontSize: 9,
              letterSpacing: 2,
              color: COLORS.muted,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            For Unicodez
          </Typography>
          <Box
            sx={{
              height: 44,
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            {template.directorSignatureDataUrl ? (
              <img
                src={template.directorSignatureDataUrl}
                alt={`${template.signatoryName} signature`}
                style={{ maxHeight: 44, maxWidth: '100%' }}
              />
            ) : (
              <Box
                sx={{
                  fontFamily: SIGNATURE_CURSIVE_FONT_STACK,
                  fontStyle: 'italic',
                  fontSize: 32,
                  lineHeight: 1,
                  color: COLORS.navy,
                  whiteSpace: 'nowrap',
                }}
              >
                {(template.signatoryName || '').split(' ')[0] ||
                  template.signatoryName}
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.navy,
              borderTop: `1px solid ${COLORS.rule}`,
              pt: 0.75,
            }}
          >
            {template.signatoryName}
          </Typography>
          <Typography
            sx={{ fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 }}
          >
            {template.signatoryTitle}, {template.companyName}
          </Typography>
        </Box>

        {/* Candidate / Employee */}
        <Box sx={{ borderLeft: `3px solid ${COLORS.blue}`, pl: 2 }}>
          <Typography
            sx={{
              fontSize: 9,
              letterSpacing: 2,
              color: COLORS.muted,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Employee
          </Typography>
          <Box
            sx={{
              height: 44,
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            {effective.mode === 'typed' && effective.typedName ? (
              <Box
                sx={{
                  fontFamily: SIGNATURE_CURSIVE_FONT_STACK,
                  fontStyle: 'italic',
                  fontSize: 32,
                  lineHeight: 1,
                  color: COLORS.navy,
                  whiteSpace: 'nowrap',
                }}
              >
                {effective.typedName}
              </Box>
            ) : effective.mode === 'drawn' && effective.dataUrl ? (
              <img
                src={effective.dataUrl}
                alt="Employee signature"
                style={{ maxHeight: 44, maxWidth: '100%' }}
              />
            ) : signed?.signedFullName ? (
              /* Legacy / fallback: render the signed name in cursive
                 if neither typed-name nor drawn-image is available. */
              <Box
                sx={{
                  fontFamily: SIGNATURE_CURSIVE_FONT_STACK,
                  fontStyle: 'italic',
                  fontSize: 32,
                  lineHeight: 1,
                  color: COLORS.navy,
                  whiteSpace: 'nowrap',
                }}
              >
                {signed.signedFullName}
              </Box>
            ) : null}
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.navy,
              borderTop: `1px solid ${COLORS.rule}`,
              pt: 0.75,
            }}
          >
            {candidateLineName}
          </Typography>
          <Typography
            sx={{ fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 }}
          >
            {signed
              ? `Signed on ${moment(signed.signatureDate).format(
                  'DD MMM YYYY',
                )}`
              : 'Signature pending'}
          </Typography>
        </Box>
      </Box>

      {/* Digital verification stamp — only on persisted signatures */}
      {showVerification && (
        <Box
          sx={{
            mx: 5,
            mb: 3,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: `1px solid ${COLORS.rule}`,
            bgcolor: 'rgba(55, 183, 234, 0.05)',
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: COLORS.blue,
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            ✓
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: COLORS.navy,
                mb: 0.5,
              }}
            >
              Digitally verified signature
            </Typography>
            <Stack
              direction="row"
              spacing={3}
              flexWrap="wrap"
              useFlexGap
              sx={{ rowGap: 0.25 }}
            >
              {verificationFields.map((f) => (
                <Box key={f.label} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: COLORS.muted,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    {f.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: COLORS.navy,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    {f.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          px: 5,
          py: 1.5,
          bgcolor: COLORS.navy,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 9.5,
        }}
      >
        <Typography sx={{ fontSize: 9.5, opacity: 0.7, letterSpacing: 0.5 }}>
          {template.companyEmail} · {template.companyWebsite}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 3, bgcolor: COLORS.pink, borderRadius: 1 }} />
          <Box sx={{ width: 16, height: 3, bgcolor: COLORS.blue, borderRadius: 1 }} />
          <Box sx={{ width: 16, height: 3, bgcolor: COLORS.yellow, borderRadius: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}
