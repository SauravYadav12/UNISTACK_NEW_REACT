import { Box, Stack, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import moment from 'moment';
import { tokens } from '../../../../theme/theme';
import { IInvoice } from '../../../../Interfaces/invoice';
import { IProject } from '../../../../Interfaces/project';
import { formatMoney } from '../../../../utils/money';

interface Props {
  invoice: IInvoice;
  project: IProject;
}

/**
 * Fetch a remote image and encode it to a base64 data URL. html2canvas reads
 * pixel data from `<img>` nodes and will refuse cross-origin bitmaps unless
 * the bucket explicitly returns permissive CORS headers. Inlining the bytes
 * at base64 sidesteps the whole browser-security question.
 */
function useInlinedImage(url?: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    fetch(url, { mode: 'cors' })
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = () => reject(fr.error);
            fr.readAsDataURL(blob);
          })
      )
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        // CORS or network error — fall back to the remote URL. html2canvas
        // may still fail, but the user at least sees the logo on screen.
        if (!cancelled) setDataUrl(url);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return dataUrl;
}

const BRAND_NAVY = '#0B1F3A';
const BRAND_INK = '#111827';
const BRAND_MUTED = '#6B7280';
const BRAND_RULE = '#E5E7EB';
const BRAND_SOFT_BG = '#F9FAFB';

/**
 * Redesigned invoice preview. Goals:
 *   - Unique header band with a brand gradient strip under the ID
 *   - Facing "From" / "Bill to" cards instead of a left-right brick
 *   - Stat chips for Date / Due / Terms / Period
 *   - Table with airy spacing and soft dashed separators
 *   - Clean single-accent total panel
 */
const InvoicePreview = forwardRef<HTMLDivElement, Props>(function InvoicePreview(
  { invoice, project },
  ref
) {
  const logoSrc = useInlinedImage(project.organizationLogoUrl);

  // Pretty invoice number: take the trailing numeric chunk from INV-XYZ-YYYYMM-NN
  const numParts = invoice.invoiceNumber.split('-');
  const trailingNum = numParts[numParts.length - 1];

  const issueDateLabel = invoice.issueDate
    ? moment(invoice.issueDate).format('MMM Do, YYYY')
    : moment().format('MMM Do, YYYY');
  const dueDateLabel = invoice.dueDate
    ? moment(invoice.dueDate).format('MMM Do, YYYY')
    : '—';
  const periodLabel = moment(invoice.periodMonth + '-01').format('MMMM YYYY');
  const paymentTermsLabel = project.paymentTerms
    ? project.paymentTerms.preset === 'Custom'
      ? `Net ${project.paymentTerms.days} days`
      : `${project.paymentTerms.preset} days`
    : 'Net 30 days';

  return (
    <Box
      ref={ref}
      sx={{
        width: 794, // ~A4 width at 96 dpi
        bgcolor: '#fff',
        color: BRAND_INK,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      {/* ── Cover band: gradient strip behind the ID + logo row ── */}
      <Box
        sx={{
          position: 'relative',
          px: 6,
          pt: 6,
          pb: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 8,
            height: '100%',
            background: tokens.gradients.pinkBlue,
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ maxWidth: 320 }}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={invoice.organizationName}
                style={{
                  maxHeight: 64,
                  maxWidth: 240,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 900,
                  background: tokens.gradients.pinkBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                {(invoice.organizationName || 'Unicodez').toUpperCase()}
              </Typography>
            )}
            <Typography
              sx={{
                mt: logoSrc ? 0.75 : 0.25,
                fontSize: 11,
                fontWeight: 700,
                color: BRAND_MUTED,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {project.organizationEIN
                ? `EIN · ${project.organizationEIN}`
                : invoice.organizationName}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: BRAND_MUTED,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Invoice
            </Typography>
            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 900,
                color: BRAND_NAVY,
                lineHeight: 1.1,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              }}
            >
              #{trailingNum}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: BRAND_MUTED,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              }}
            >
              {invoice.invoiceNumber}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Stat chip row: Date · Due · Terms · Period ── */}
      <Box sx={{ px: 6, mb: 2.5 }}>
        <Stack direction="row" spacing={1.25}>
          <Stat label="Issue date" value={issueDateLabel} />
          <Stat label="Due date" value={dueDateLabel} accent="pink" />
          <Stat label="Payment terms" value={paymentTermsLabel} />
          <Stat label="Period" value={periodLabel} />
        </Stack>
      </Box>

      {/* ── Facing party cards ── */}
      <Box sx={{ px: 6, mb: 2.5 }}>
        <Stack direction="row" spacing={1.5}>
          <PartyCard
            title="From"
            name={invoice.organizationName}
            lines={[
              project.organizationAddress,
              project.organizationEmail && `Email · ${project.organizationEmail}`,
              project.organizationWebsite,
            ]}
            accent="blue"
          />
          <PartyCard
            title="Bill to"
            name={project.clientCompany || '—'}
            lines={[
              project.clientAddress,
              project.clientPerson && `Attn · ${project.clientPerson}`,
              project.clientEmail && `Email · ${project.clientEmail}`,
            ]}
            accent="pink"
          />
        </Stack>
      </Box>

      {/* ── Consultant / project meta strip ── */}
      <Box
        sx={{
          mx: 6,
          mb: 2.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: BRAND_SOFT_BG,
          border: `1px solid ${BRAND_RULE}`,
        }}
      >
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <MetaBit label="Project" value={invoice.projectId} />
          {project.consultant && (
            <MetaBit label="Candidate" value={project.consultant} />
          )}
          {project.vendorCompany && (
            <MetaBit label="Vendor" value={project.vendorCompany} />
          )}
          {project.primeVendorCompany && (
            <MetaBit label="Prime vendor" value={project.primeVendorCompany} />
          )}
        </Stack>
      </Box>

      {/* ── Line items ── */}
      <Box sx={{ px: 6, mb: 2 }}>
        {/* Table header */}
        <Stack
          direction="row"
          sx={{
            py: 1,
            borderTop: `2px solid ${BRAND_NAVY}`,
            borderBottom: `1px solid ${BRAND_RULE}`,
          }}
        >
          <Box sx={{ flex: 4 }}>
            <ColLabel>Description</ColLabel>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>
            <ColLabel>Hours</ColLabel>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>
            <ColLabel>Rate</ColLabel>
          </Box>
          <Box sx={{ flex: 1.2, textAlign: 'right' }}>
            <ColLabel>Amount</ColLabel>
          </Box>
        </Stack>

        {/* Rows */}
        {invoice.lineItems.map((li, i) => (
          <Stack
            key={li._id || i}
            direction="row"
            sx={{
              py: 1.1,
              borderBottom: `1px dashed ${BRAND_RULE}`,
            }}
          >
            <Box sx={{ flex: 4 }}>
              <Typography sx={{ fontSize: 12.5, color: BRAND_INK }}>
                {li.description}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <Typography sx={{ fontSize: 12.5 }}>{li.hours ?? ''}</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <Typography sx={{ fontSize: 12.5 }}>
                {li.rate ? formatMoney(li.rate, invoice.currency) : ''}
              </Typography>
            </Box>
            <Box sx={{ flex: 1.2, textAlign: 'right' }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                {formatMoney(li.amount, invoice.currency)}
              </Typography>
            </Box>
          </Stack>
        ))}
        {invoice.lineItems.length === 0 && (
          <Box sx={{ py: 1.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              No line items — fill timesheets and re-approve to regenerate.
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Totals panel ── */}
      <Box sx={{ px: 6, mb: 3 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Box
            sx={{
              minWidth: 320,
              borderRadius: 2.5,
              border: `1px solid ${BRAND_RULE}`,
              overflow: 'hidden',
            }}
          >
            <TotalRow
              label="Subtotal"
              value={formatMoney(invoice.subtotal, invoice.currency)}
            />
            {invoice.taxPercent > 0 && (
              <TotalRow
                label={`${invoice.taxLabel || 'Tax'} (${invoice.taxPercent}%)`}
                value={formatMoney(invoice.taxAmount, invoice.currency)}
              />
            )}
            <Box
              sx={{
                px: 1.75,
                py: 1.25,
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Total due
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                {formatMoney(invoice.total, invoice.currency)}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* ── Amount in words ── */}
      <Box
        sx={{
          mx: 6,
          mb: 3,
          p: 1.5,
          borderLeft: `3px solid ${tokens.colors.pink}`,
          bgcolor: BRAND_SOFT_BG,
        }}
      >
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 800,
            color: BRAND_MUTED,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 0.25,
          }}
        >
          Amount in words
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: BRAND_INK }}>
          {invoice.currency} {numToEnglishWords(invoice.total)} Only
        </Typography>
      </Box>

      {/* ── Notes ── */}
      {invoice.notes && (
        <Box sx={{ px: 6, mb: 2 }}>
          <Typography
            sx={{
              fontSize: 10.5,
              fontWeight: 800,
              color: BRAND_MUTED,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            Notes
          </Typography>
          <Typography sx={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </Typography>
        </Box>
      )}

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 6,
          pt: 2,
          pb: 4,
          borderTop: `1px solid ${BRAND_RULE}`,
          mt: 1.5,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.5}>
            <BrandDot color={tokens.colors.pink} />
            <BrandDot color={tokens.colors.blue} />
            <BrandDot color={tokens.colors.yellow} />
          </Stack>
          <Typography
            sx={{
              fontSize: 10.5,
              color: BRAND_MUTED,
              fontStyle: 'italic',
            }}
          >
            This is a computer-generated invoice — signature is not required.
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: BRAND_MUTED }}>
            Generated · {moment().format('MMM D, YYYY')}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
});

// ── Subcomponents ─────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  accent = 'navy',
}: {
  label: string;
  value: string;
  accent?: 'navy' | 'pink' | 'blue';
}) {
  const accentColor =
    accent === 'pink'
      ? tokens.colors.pinkDark
      : accent === 'blue'
        ? tokens.colors.blueDark
        : BRAND_NAVY;
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: BRAND_SOFT_BG,
        border: `1px solid ${BRAND_RULE}`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 800,
          color: BRAND_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: accentColor,
          lineHeight: 1.25,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PartyCard({
  title,
  name,
  lines,
  accent = 'blue',
}: {
  title: string;
  name: string;
  lines: Array<string | undefined | false>;
  accent?: 'pink' | 'blue';
}) {
  const accentColor =
    accent === 'pink' ? tokens.colors.pinkDark : tokens.colors.blueDark;
  const visible = lines.filter((l): l is string => !!l);
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${BRAND_RULE}`,
        bgcolor: '#fff',
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          color: accentColor,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: 13.5,
          fontWeight: 800,
          color: BRAND_NAVY,
          wordBreak: 'break-word',
        }}
      >
        {name}
      </Typography>
      {visible.map((l, i) => (
        <Typography
          key={i}
          sx={{ fontSize: 11.5, color: BRAND_MUTED, wordBreak: 'break-word' }}
        >
          {l}
        </Typography>
      ))}
    </Box>
  );
}

function MetaBit({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 800,
          color: BRAND_MUTED,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: BRAND_INK }}>
        {value}
      </Typography>
    </Box>
  );
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 800,
        color: BRAND_MUTED,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Typography>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        px: 1.75,
        py: 1,
        borderBottom: `1px solid ${BRAND_RULE}`,
      }}
    >
      <Typography sx={{ fontSize: 12, color: BRAND_MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}

function BrandDot({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
      }}
    />
  );
}

// ── Local num-to-words (mirror of server util) ────────────────────────────

const UNITS = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigit(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]}-${UNITS[u]}`;
}
function threeDigit(n: number): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${UNITS[h]} Hundred`);
  if (rest > 0) parts.push(twoDigit(rest));
  return parts.join(' ');
}
function numToEnglishWords(value: number): string {
  if (!Number.isFinite(value)) return '';
  const abs = Math.abs(value);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  let words: string;
  if (whole === 0) words = 'Zero';
  else {
    const billions = Math.floor(whole / 1_000_000_000);
    const millions = Math.floor((whole % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((whole % 1_000_000) / 1000);
    const rest = whole % 1000;
    const parts: string[] = [];
    if (billions > 0) parts.push(`${threeDigit(billions)} Billion`);
    if (millions > 0) parts.push(`${threeDigit(millions)} Million`);
    if (thousands > 0) parts.push(`${threeDigit(thousands)} Thousand`);
    if (rest > 0) parts.push(threeDigit(rest));
    words = parts.join(' ');
  }
  if (cents > 0) words += ` and ${cents.toString().padStart(2, '0')}/100`;
  return words;
}

export default InvoicePreview;
