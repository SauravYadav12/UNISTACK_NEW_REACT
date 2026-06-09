import { forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import moment from 'moment';
import { SalarySlip } from '../../Interfaces/salary';

const COLORS = {
  pink: '#EC4599',
  blue: '#37B7EA',
  yellow: '#FCE441',
  navy: '#032840',
  paper: '#FFFFFF',
  muted: '#5E7687',
  rule: '#E5EBEF',
};

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currencySymbol(c: 'INR' | 'USD') {
  return c === 'USD' ? '$' : '\u20B9';
}

function formatAmount(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const UnicodezMark = ({ size = 56 }: { size?: number }) => {
  const r = size / 2 - 6;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const seg = circumference / 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={COLORS.pink} strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`} strokeDashoffset="0"
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={COLORS.blue} strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`} strokeDashoffset={-seg}
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={COLORS.yellow} strokeWidth="8"
        strokeDasharray={`${seg - 4} ${circumference}`} strokeDashoffset={-(2 * seg)}
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
    </svg>
  );
};

const SectionTitle = ({ label, accent = COLORS.pink }: { label: string; accent?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
    <Box sx={{ width: 14, height: 4, bgcolor: accent, borderRadius: 2 }} />
    <Typography sx={{
      fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
      color: COLORS.navy, textTransform: 'uppercase',
    }}>
      {label}
    </Typography>
  </Box>
);

const InfoRow = ({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) => (
  <Box sx={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    py: 0.75, borderBottom: `1px solid ${COLORS.rule}`,
  }}>
    <Typography sx={{ fontSize: 10.5, color: COLORS.muted }}>{label}</Typography>
    <Typography sx={{
      fontSize: 11, color: COLORS.navy,
      fontWeight: strong ? 700 : 500,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </Typography>
  </Box>
);

const LeaveBar = ({ label, used, total, color }: {
  label: string; used: number; total: number; color: string;
}) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <Box sx={{ mb: 1.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORS.navy }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 10, color: COLORS.muted, fontVariantNumeric: 'tabular-nums' }}>
          {used} / {total} used
        </Typography>
      </Box>
      <Box sx={{ height: 6, bgcolor: COLORS.rule, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, transition: 'width 0.3s' }} />
      </Box>
    </Box>
  );
};

interface Props {
  slip: SalarySlip;
}

const SalarySlipView = forwardRef<HTMLDivElement, Props>(({ slip }, ref) => {
  const sym = currencySymbol(slip.currency);
  const monthLabel = `${MONTHS[slip.month]} ${slip.year}`;
  const dojLabel = slip.dateOfJoining ? moment(slip.dateOfJoining).format('Do MMMM YYYY') : '—';

  const earnings: Array<[string, number]> = [
    ['Basic', slip.earnings.basic],
    ['House Rent Allowance', slip.earnings.hra],
    ['Mobile & Internet Reimbursement', slip.earnings.mobileReimbursement],
    ['Books & Periodicals Reimbursement', slip.earnings.booksReimbursement],
    ['Special Allowances', slip.earnings.specialAllowances],
    ['Incentives', slip.earnings.incentives],
  ];

  // PF is intentionally not rendered — this org doesn't deduct it. The
  // schema field stays at 0 and isn't surfaced anywhere in the UI.
  const deductions: Array<[string, number, string?]> = [
    // Professional Tax — separate statutory line, flat 208 / mo.
    ['Professional Tax', slip.deductions.professionalTax || 0],
    ['TDS', slip.deductions.tds],
    ['Other Deductions', slip.deductions.otherDeductions],
    [
      'Leave Deduction',
      slip.deductions.lopDeduction,
      slip.leaves.unpaidDays
        ? `${slip.leaves.unpaidDays} unpaid day${slip.leaves.unpaidDays > 1 ? 's' : ''}`
        : undefined,
    ],
  ];

  return (
    <Box
      ref={ref}
      sx={{
        width: '210mm',
        // No minHeight — let the content drive the height so we never overflow
        // A4 unintentionally. Adequate internal padding keeps the slip airy.
        bgcolor: COLORS.paper,
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        color: COLORS.navy,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(3, 40, 64, 0.08)',
      }}
    >
      {/* Diagonal pink corner ribbon (top-right) */}
      <Box sx={{
        position: 'absolute', top: 0, right: 0, zIndex: 1,
        width: 0, height: 0,
        borderTop: `90px solid ${COLORS.pink}`,
        borderLeft: '90px solid transparent',
      }} />

      {/* Navy header band */}
      <Box sx={{
        bgcolor: COLORS.navy, color: 'white',
        px: 5, py: 2.5,
        display: 'flex', alignItems: 'center', gap: 2.5,
        position: 'relative', zIndex: 2,
      }}>
        <UnicodezMark size={46} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{
            fontSize: 15, fontWeight: 800, letterSpacing: 1.5,
            lineHeight: 1.1,
          }}>
            UNICODEZ SOFTCORP PRIVATE LIMITED
          </Typography>
          <Typography sx={{ fontSize: 9.5, opacity: 0.65, mt: 0.3 }}>
            9/10, Floor 6th, Regal Treasure, Ayodhya Bypass RD, Bhopal MP 462041
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', pr: 2 }}>
          <Typography sx={{
            fontSize: 9, letterSpacing: 4, opacity: 0.7, fontWeight: 600,
          }}>
            PAYSLIP
          </Typography>
          <Typography sx={{
            fontSize: 18, fontWeight: 800, color: COLORS.yellow,
            fontVariantNumeric: 'tabular-nums', mt: 0.25,
          }}>
            {monthLabel}
          </Typography>
        </Box>
      </Box>

      {/* Employee / Period cards */}
      <Box sx={{
        px: 5, pt: 2.5, pb: 1.5,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
      }}>
        <Box sx={{ borderLeft: `3px solid ${COLORS.pink}`, pl: 2 }}>
          <Typography sx={{ fontSize: 9, letterSpacing: 2, color: COLORS.muted, fontWeight: 600, textTransform: 'uppercase' }}>
            Employee
          </Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 700, mt: 0.5, color: COLORS.navy, lineHeight: 1.2 }}>
            {slip.employeeName || '—'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 0.3 }}>
            {slip.designation || 'Employee'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.blue, fontWeight: 700, mt: 0.75, letterSpacing: 0.5 }}>
            {slip.employeeId || '—'}
          </Typography>
        </Box>

        <Box sx={{ borderLeft: `3px solid ${COLORS.blue}`, pl: 2 }}>
          <Typography sx={{ fontSize: 9, letterSpacing: 2, color: COLORS.muted, fontWeight: 600, textTransform: 'uppercase' }}>
            Pay Period
          </Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 700, mt: 0.5, color: COLORS.navy, lineHeight: 1.2 }}>
            {monthLabel}
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORS.muted, mt: 0.3 }}>
            {slip.workingDays} working days · {slip.presentDays} worked
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.muted, mt: 0.75 }}>
            Joined: {dojLabel}
          </Typography>
        </Box>
      </Box>

      {/* Earnings + Deductions two-column */}
      <Box sx={{
        px: 5, pt: 1.5, pb: 2,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
      }}>
        <Box>
          <SectionTitle label="Earnings" accent={COLORS.pink} />
          {earnings.map(([label, amt]) => (
            <InfoRow key={label} label={label} value={`${sym}${formatAmount(amt)}`} />
          ))}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', mt: 1,
            pt: 1.25, borderTop: `2px solid ${COLORS.pink}`,
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.navy }}>
              Total Earnings
            </Typography>
            <Typography sx={{
              fontSize: 13, fontWeight: 800, color: COLORS.navy,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {sym}{formatAmount(slip.earnings.total)}
            </Typography>
          </Box>
        </Box>

        <Box>
          <SectionTitle label="Deductions" accent={COLORS.blue} />
          {deductions.map(([label, amt, hint]) => (
            <InfoRow
              key={label}
              label={hint ? `${label} (${hint})` : label}
              value={`${sym}${formatAmount(amt)}`}
            />
          ))}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', mt: 1,
            pt: 1.25, borderTop: `2px solid ${COLORS.blue}`,
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.navy }}>
              Total Deductions
            </Typography>
            <Typography sx={{
              fontSize: 13, fontWeight: 800, color: COLORS.navy,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {sym}{formatAmount(slip.deductions.total)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Leave summary — strictly THIS MONTH so the employee can't
          mis-read a yearly balance as "still available". Shows the
          monthly entitlement vs what was actually used in this payroll
          period, plus the unpaid (LOP) day count that drove the
          deduction. Falls back to legacy YTD fields ONLY when an old
          slip is loaded that pre-dates the monthly fields. */}
      <Box sx={{ px: 5, pt: 1, pb: 1.5 }}>
        <SectionTitle label="Leave Summary (This Month)" accent={COLORS.yellow} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 0.5 }}>
          <LeaveBar
            label="Paid leaves"
            used={slip.leaves.paidUsedThisMonth ?? slip.leaves.paidUsed}
            total={slip.leaves.paidMonthlyQuota ?? slip.leaves.paidAccrued}
            color={COLORS.pink}
          />
          <LeaveBar
            label="Medical leaves"
            used={slip.leaves.medicalUsedThisMonth ?? slip.leaves.medicalUsed}
            total={slip.leaves.medicalMonthlyQuota ?? slip.leaves.medicalAccrued}
            color={COLORS.blue}
          />
        </Box>
        <Box sx={{
          display: 'flex', gap: 2, mt: 1,
          fontSize: 10, color: COLORS.muted,
        }}>
          <Box>
            Paid available this month:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.navy }}>
              {Math.max(
                (slip.leaves.paidMonthlyQuota ?? 0) -
                  (slip.leaves.paidUsedThisMonth ?? 0),
                0,
              )}
            </Box>
            {' '}/ {slip.leaves.paidMonthlyQuota ?? 0}
          </Box>
          <Box>·</Box>
          <Box>
            Medical available this month:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.navy }}>
              {Math.max(
                (slip.leaves.medicalMonthlyQuota ?? 0) -
                  (slip.leaves.medicalUsedThisMonth ?? 0),
                0,
              )}
            </Box>
            {' '}/ {slip.leaves.medicalMonthlyQuota ?? 0}
          </Box>
          <Box>·</Box>
          <Box>
            Unpaid this month: <Box component="span" sx={{ fontWeight: 700, color: COLORS.navy }}>
              {slip.leaves.unpaidDays}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Net Pay hero */}
      <Box sx={{ px: 5, pt: 1.5, pb: 2 }}>
        <Box sx={{
          position: 'relative',
          bgcolor: COLORS.yellow,
          borderRadius: 2,
          px: 4, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          {/* Diagonal navy accent on right edge */}
          <Box sx={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 100,
            bgcolor: COLORS.navy,
            clipPath: 'polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }} />
          <Box sx={{ zIndex: 1 }}>
            <Typography sx={{
              fontSize: 10, letterSpacing: 3, color: COLORS.navy, opacity: 0.65,
              fontWeight: 700,
            }}>
              NET PAY
            </Typography>
            <Typography sx={{
              fontSize: 34, fontWeight: 900, color: COLORS.navy, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', mt: 0.5,
            }}>
              {sym}{formatAmount(slip.netPay)}
            </Typography>
            <Typography sx={{
              fontSize: 10, color: COLORS.navy, opacity: 0.75,
              fontStyle: 'italic', mt: 0.75, maxWidth: 420,
            }}>
              {slip.netPayWords}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{
        px: 5, pt: 2, pb: 2.5,
        borderTop: `1px solid ${COLORS.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: COLORS.muted,
      }}>
        <Box>
          <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORS.navy }}>
            This is a system-generated payslip.
          </Typography>
          <Typography sx={{ fontSize: 8.5, color: COLORS.muted, mt: 0.25 }}>
            No signature is required. Questions? Contact HR at hr@unicodez.com
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 8.5, color: COLORS.muted, letterSpacing: 1 }}>
          Generated {slip.generatedAt ? moment(slip.generatedAt).format('DD MMM YYYY') : moment().format('DD MMM YYYY')}
        </Typography>
      </Box>
    </Box>
  );
});

SalarySlipView.displayName = 'SalarySlipView';
export default SalarySlipView;
