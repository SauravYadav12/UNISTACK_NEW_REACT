import { Box, Stack, Typography } from '@mui/material';
import moment from 'moment';
import {
  OnboardingOfferSnapshot,
  OnboardingOfferTemplateSnapshot,
  OnboardingSignedLocation,
} from '../../Interfaces/onboarding';
import { salaryInWords } from '../../utils/numberToIndianWords';

/**
 * Shared cursive font stack for the typed-signature mode. Exported so
 * the offer-letter signing page can paint the preview in the same
 * font the rendered letter uses — what the candidate sees in the
 * signing dialog is exactly what HR sees on the saved document.
 *
 * Caveat (Google Fonts) is loaded by `OfferLetterRender` itself via a
 * <link rel="stylesheet"> injected on mount, so consumers don't need
 * to wire anything global. The fallback chain picks reasonable
 * cursive faces on systems that haven't loaded the webfont yet.
 */
export const SIGNATURE_CURSIVE_FONT_STACK =
  '"Caveat", "Brush Script MT", "Lucida Handwriting", cursive';

const CAVEAT_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap';

/**
 * Branded offer letter — designed to match the SalarySlip aesthetic
 * (`components/salary/SalarySlip.tsx`):
 *
 *   • A4-width navy header band with the Unicodez tri-color mark on
 *     the left and the OFFER badge on the right.
 *   • Pink diagonal corner ribbon (top-right).
 *   • Two-column "Candidate" / "Employment" cards with pink/blue
 *     left-border accent stripes.
 *   • SectionTitle pattern (small colored bar + ALL-CAPS title) for
 *     the Greeting / Terms / Closing blocks.
 *   • Two-column signature block with the same accent stripes.
 *
 * Template body is still `{{placeholder}}`-substituted so the
 * super-admin template editor stays untouched. Supported variables:
 * firstName, lastName, name, position, startDate, annualSalary,
 * probationMonths, signatoryName, signatoryTitle, companyName,
 * companyAddress, companyEmail, companyWebsite.
 *
 * The wrapper preserves the stable `offer-letter-page` class name so
 * the existing `downloadSlipPdf` helper still finds + paginates it.
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

// Same Unicodez mark used on the salary slip — three coloured arcs
// arranged as a single ring. Kept inline (no shared component) so
// this file is self-contained for PDF rendering.
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

const SectionTitle = ({
  label,
  accent = COLORS.pink,
}: {
  label: string;
  accent?: string;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
    <Box
      sx={{ width: 14, height: 4, bgcolor: accent, borderRadius: 2 }}
    />
    <Typography
      sx={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: COLORS.navy,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
  </Box>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      py: 0.6,
      borderBottom: `1px dashed ${COLORS.rule}`,
    }}
  >
    <Typography sx={{ fontSize: 10.5, color: COLORS.muted }}>{label}</Typography>
    <Typography
      sx={{
        fontSize: 11,
        color: COLORS.navy,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </Typography>
  </Box>
);

interface Props {
  snapshot: OnboardingOfferSnapshot;
  template: OnboardingOfferTemplateSnapshot;
  /** Drawn signature as a PNG data URL. Used when signatureMode is
   *  'drawn' or absent (legacy). */
  signatureDataUrl?: string;
  /** Mode of the candidate's signature — drives whether we paint the
   *  drawn image or the typed cursive name. */
  signatureMode?: 'drawn' | 'typed';
  /** Typed cursive name. Used when signatureMode === 'typed'. */
  signatureTypedName?: string;
  signedFullName?: string;
  signatureDate?: string;
  // ── Digital verification stamp (rendered when present) ──
  signedByEmail?: string;
  signedFromIp?: string;
  signedFromLocation?: OnboardingSignedLocation;
}

function substitute(
  raw: string,
  vars: Record<string, string | number>,
): string {
  return raw.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : '',
  );
}

/**
 * Render a multi-line template string with light formatting:
 *   - Lines that look like `Label: value` get the label rendered
 *     bold and the value plain. Catches "Employment Details:",
 *     "Position:", "Start Date:", "Appraisal:", "Leave & Benefits:",
 *     "Terms & Conditions:" etc. without the template editor needing
 *     to add any markdown.
 *   - Lines without a label prefix render unchanged.
 *   - Blank lines are preserved as paragraph spacers.
 *
 * The label regex caps at 40 characters so we don't accidentally
 * treat full sentences with mid-string colons as labels.
 */
const LABEL_RE = /^([A-Z][^:\n]{0,40}):\s*(.*)$/;

function renderTemplateText(
  raw: string,
  baseColor: string,
  baseFontSize = 13,
): React.ReactNode {
  if (!raw) return null;
  const lines = raw.split('\n');
  return lines.map((line, i) => {
    if (line.trim() === '') {
      // Empty line → small paragraph break.
      return <Box key={i} sx={{ height: 6 }} />;
    }
    const match = line.match(LABEL_RE);
    if (match) {
      const [, label, rest] = match;
      return (
        <Box
          key={i}
          sx={{
            fontSize: baseFontSize,
            lineHeight: 1.65,
            color: baseColor,
          }}
        >
          <Box component="span" sx={{ fontWeight: 800 }}>
            {label}:
          </Box>
          {rest ? <Box component="span">{' '}{rest}</Box> : null}
        </Box>
      );
    }
    return (
      <Box
        key={i}
        sx={{
          fontSize: baseFontSize,
          lineHeight: 1.65,
          color: baseColor,
          whiteSpace: 'pre-wrap',
        }}
      >
        {line}
      </Box>
    );
  });
}

// Top-level guard: only insert the Caveat <link> tag once per page
// even if multiple OfferLetterRender instances are mounted (e.g. the
// template-editor preview + the candidate drawer at the same time).
let caveatLinkInjected = false;
function ensureCaveatFont() {
  if (typeof document === 'undefined') return;
  if (caveatLinkInjected) return;
  if (document.querySelector(`link[href="${CAVEAT_HREF}"]`)) {
    caveatLinkInjected = true;
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CAVEAT_HREF;
  document.head.appendChild(link);
  caveatLinkInjected = true;
}

export default function OfferLetterRender({
  snapshot,
  template,
  signatureDataUrl,
  signatureMode,
  signatureTypedName,
  signedFullName,
  signatureDate,
  signedByEmail,
  signedFromIp,
  signedFromLocation,
}: Props) {
  // Lazy-load Caveat the first time we render any offer letter on
  // this page so the typed-signature cursive face is available for
  // both the candidate's preview and the final rendered document.
  if (typeof window !== 'undefined') ensureCaveatFont();

  const formattedSalary = new Intl.NumberFormat('en-IN').format(
    snapshot.annualSalary,
  );
  const formattedStartDate = moment(snapshot.startDate).format('DD MMM YYYY');

  // Pre-compute which signature mode to render. Default to 'drawn'
  // when a data URL is present but the mode wasn't recorded (legacy
  // signed offers from before the typed-signature feature).
  const effectiveMode: 'drawn' | 'typed' =
    signatureMode === 'typed'
      ? 'typed'
      : signatureDataUrl
        ? 'drawn'
        : 'drawn';
  const verificationFields: Array<{ label: string; value: string }> = [];
  if (signedFullName) verificationFields.push({ label: 'Signed by', value: signedFullName });
  if (signedByEmail) verificationFields.push({ label: 'Email', value: signedByEmail });
  if (signatureDate) {
    verificationFields.push({
      label: 'On',
      value: moment(signatureDate).format('DD MMM YYYY · hh:mm:ss A'),
    });
  }
  if (signedFromIp) verificationFields.push({ label: 'IP address', value: signedFromIp });
  if (signedFromLocation) {
    const acc = signedFromLocation.accuracy
      ? ` (±${Math.round(signedFromLocation.accuracy)} m)`
      : '';
    verificationFields.push({
      label: 'Location',
      value: `${signedFromLocation.latitude.toFixed(4)}°, ${signedFromLocation.longitude.toFixed(4)}°${acc}`,
    });
  }
  const showVerification = verificationFields.length > 0;

  const vars: Record<string, string | number> = {
    firstName: snapshot.name.split(' ')[0] || snapshot.name,
    lastName: snapshot.name.split(' ').slice(1).join(' '),
    name: snapshot.name,
    position: snapshot.position,
    startDate: formattedStartDate,
    annualSalary: formattedSalary,
    probationMonths: snapshot.probationMonths,
    signatoryName: template.signatoryName,
    signatoryTitle: template.signatoryTitle,
    companyName: template.companyName,
    companyAddress: template.companyAddress,
    companyEmail: template.companyEmail,
    companyWebsite: template.companyWebsite,
  };

  const salutation = substitute(template.salutationTemplate, vars);
  const body = substitute(template.bodyTemplate, vars);
  const terms = substitute(template.termsTemplate, vars);
  const closing = substitute(template.closingTemplate, vars);

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
      {/* Diagonal pink corner ribbon (top-right) */}
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
            }}
          >
            OFFER LETTER
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 800,
              color: COLORS.yellow,
              fontVariantNumeric: 'tabular-nums',
              mt: 0.25,
              letterSpacing: 0.5,
            }}
          >
            {formattedStartDate}
          </Typography>
        </Box>
      </Box>

      {/* Candidate / Employment cards */}
      <Box
        sx={{
          px: 5,
          pt: 2.5,
          pb: 1.5,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 3,
        }}
      >
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
            Candidate
          </Typography>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              mt: 0.5,
              color: COLORS.navy,
              lineHeight: 1.2,
            }}
          >
            {snapshot.name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 0.3 }}>
            {snapshot.position}
          </Typography>
        </Box>

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
            Employment
          </Typography>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              mt: 0.5,
              color: COLORS.navy,
              lineHeight: 1.2,
            }}
          >
            {formattedStartDate}
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 0.3 }}>
            {snapshot.probationMonths}-month probation · ₹{formattedSalary} LPA
          </Typography>
        </Box>
      </Box>

      {/* Salutation + welcome paragraph */}
      <Box sx={{ px: 5, pt: 2 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.navy,
            mb: 1.5,
          }}
        >
          {salutation}
        </Typography>
        <Box sx={{ mb: 3 }}>{renderTemplateText(body, COLORS.navy, 12)}</Box>
      </Box>

      {/* Employment details snapshot — InfoRow layout */}
      <Box sx={{ px: 5, pb: 2 }}>
        <SectionTitle label="Employment Details" accent={COLORS.pink} />
        <Box>
          <InfoRow label="Position" value={snapshot.position} />
          <InfoRow label="Start Date" value={formattedStartDate} />
          <InfoRow
            label="Annual Salary"
            value={`₹${formattedSalary} LPA CTC (Annually)`}
          />
          {/* Salary in words — formal legal cue ("Twelve Lakh
              Rupees Only") rendered as an italic right-aligned line
              directly below the numeric value. Same pattern used on
              salary slips. */}
          {snapshot.annualSalary > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                py: 0.4,
                borderBottom: `1px dashed ${COLORS.rule}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: COLORS.muted,
                  fontWeight: 500,
                }}
              >
                ({salaryInWords(snapshot.annualSalary)})
              </Typography>
            </Box>
          )}
          <InfoRow
            label="Probation Period"
            value={`${snapshot.probationMonths} months`}
          />
        </Box>
      </Box>

      {/* Terms */}
      <Box sx={{ px: 5, pb: 2 }}>
        <SectionTitle label="Terms & Conditions" accent={COLORS.blue} />
        <Box>{renderTemplateText(terms, COLORS.muted, 11)}</Box>
      </Box>

      {/* Closing */}
      <Box sx={{ px: 5, pb: 3 }}>
        <SectionTitle label="Acceptance" accent={COLORS.pink} />
        <Box>{renderTemplateText(closing, COLORS.navy, 12)}</Box>
      </Box>

      {/* Signature cards — same two-column layout:
          left → director signature image (auto-painted from template);
          right → candidate signature, either the drawn data URL or the
          typed name rendered in a cursive font. */}
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
        {/* Company signatory — director's signature auto-paints when
            the template has one. Otherwise we render the signatory's
            first name in a handwriting font as a sensible default so
            every offer letter ships with a visible signature without
            the super-admin having to upload an image first. */}
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
            Best Regards
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

        {/* Candidate */}
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
            Accepted by
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
            {effectiveMode === 'typed' && signatureTypedName ? (
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
                {signatureTypedName}
              </Box>
            ) : signatureDataUrl ? (
              <img
                src={signatureDataUrl}
                alt="Candidate signature"
                style={{ maxHeight: 44, maxWidth: '100%' }}
              />
            ) : signedFullName ? (
              /* Fallback: legacy signed offers (saved before the
                 signatureMode field existed) won't have a typed name
                 or a drawn data URL. Render the candidate's signed
                 full name in cursive so the signature line is never
                 empty on a signed letter. */
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
                {signedFullName}
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
            {signedFullName || snapshot.name}
          </Typography>
          <Typography
            sx={{ fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 }}
          >
            {signatureDate
              ? `Signed on ${moment(signatureDate).format('DD MMM YYYY')}`
              : 'Signature pending'}
          </Typography>
        </Box>
      </Box>

      {/* Digital verification stamp — only when we have signing
          metadata to attest. Designed to read as a small, formal
          "this signature is provably theirs" tag, mirroring the
          look of a digital-certificate footnote. */}
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

      {/* Footer micro-strip with company contact + tri-color bar — mirrors
          the salary slip's "official document" feel. */}
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
