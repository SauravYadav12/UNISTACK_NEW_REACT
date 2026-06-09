import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  Typography, Box, Divider, CircularProgress, Stack, alpha,
} from '@mui/material';
import { toast } from 'react-toastify';
import { updateSlip } from '../../services/salaryApi';
import { SalarySlip } from '../../Interfaces/salary';
import { tokens } from '../../theme/theme';

interface Props {
  open: boolean;
  slip?: SalarySlip;
  onClose: () => void;
  onSaved?: (s: SalarySlip) => void;
}

const EARNING_KEYS = [
  ['basic', 'Basic'],
  ['hra', 'House Rent Allowance'],
  ['mobileReimbursement', 'Mobile & Internet'],
  ['booksReimbursement', 'Books & Periodicals'],
  ['specialAllowances', 'Special Allowances'],
  ['incentives', 'Incentives'],
] as const;

const DEDUCTION_KEYS = [
  // PF intentionally hidden — not a deduction this org uses. Schema
  // field stays at 0 for backward compatibility.
  // Professional Tax is now a separate statutory deduction (flat ₹208 /
  // month — set on the salary config). Editable on the slip so HR can
  // override in unusual months without touching the config.
  ['professionalTax', 'Professional Tax'],
  ['tds', 'TDS'],
  ['otherDeductions', 'Other Deductions'],
  ['lopDeduction', 'Leave Deduction'],
] as const;

function numStr(v: number | undefined): string {
  return v ? String(v) : '';
}
function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type EarningsState = Record<(typeof EARNING_KEYS)[number][0], number>;
type DeductionsState = Record<(typeof DEDUCTION_KEYS)[number][0], number>;

const ZERO_EARNINGS: EarningsState = {
  basic: 0, hra: 0, mobileReimbursement: 0,
  booksReimbursement: 0, specialAllowances: 0, incentives: 0,
};
const ZERO_DEDUCTIONS: DeductionsState = {
  professionalTax: 0, tds: 0, otherDeductions: 0, lopDeduction: 0,
};

export default function EditSlipDialog({ open, slip, onClose, onSaved }: Props) {
  const [earnings, setEarnings] = useState<EarningsState>(ZERO_EARNINGS);
  const [deductions, setDeductions] = useState<DeductionsState>(ZERO_DEDUCTIONS);
  const [designation, setDesignation] = useState('');
  const [workingDays, setWorkingDays] = useState(0);
  const [presentDays, setPresentDays] = useState(0);
  const [unpaidDays, setUnpaidDays] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !slip) return;
    setEarnings({
      basic: slip.earnings?.basic || 0,
      hra: slip.earnings?.hra || 0,
      mobileReimbursement: slip.earnings?.mobileReimbursement || 0,
      booksReimbursement: slip.earnings?.booksReimbursement || 0,
      specialAllowances: slip.earnings?.specialAllowances || 0,
      incentives: slip.earnings?.incentives || 0,
    });
    setDeductions({
      professionalTax: slip.deductions?.professionalTax || 0,
      tds: slip.deductions?.tds || 0,
      otherDeductions: slip.deductions?.otherDeductions || 0,
      lopDeduction: slip.deductions?.lopDeduction || 0,
    });
    setDesignation(slip.designation || '');
    setWorkingDays(slip.workingDays || 0);
    setPresentDays(slip.presentDays || 0);
    setUnpaidDays(slip.leaves?.unpaidDays || 0);
  }, [open, slip]);

  const sym = slip?.currency === 'USD' ? '$' : '\u20B9';

  // Live-recomputed totals mirror the server formula — admin can see the impact
  // of their edits before hitting Save.
  const grossEarnings = useMemo(
    () => (Object.values(earnings) as number[]).reduce((a, b) => a + (Number(b) || 0), 0),
    [earnings],
  );
  const totalDeductions = useMemo(
    () => (Object.values(deductions) as number[]).reduce((a, b) => a + (Number(b) || 0), 0),
    [deductions],
  );
  const netPay = Math.max(grossEarnings - totalDeductions, 0);

  async function handleSave() {
    if (!slip?._id) return;
    setSaving(true);
    try {
      const { data } = await updateSlip(slip._id, {
        designation,
        workingDays,
        presentDays,
        earnings: { ...earnings, total: grossEarnings },
        // PF is hidden from the UI but still required by the schema —
        // ship a 0 so the type-check is happy and the field stays at
        // its baseline value on save.
        deductions: { pf: 0, ...deductions, total: totalDeductions },
        leaves: { ...slip.leaves, unpaidDays },
      });
      toast.success('Payslip updated');
      onSaved?.(data);
      onClose();
    } catch (e) {
      console.error('updateSlip failed', e);
      toast.error('Failed to update payslip');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit Payslip — {slip?.employeeName || '—'}
        <Typography variant="caption" sx={{ display: 'block', color: tokens.colors.lightTextSecondary, fontWeight: 500 }}>
          Overrides stored on this slip only. The employee&rsquo;s salary config is unchanged.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {!slip ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: tokens.colors.blue, fontWeight: 700, letterSpacing: 1 }}>
              EMPLOYEE & PAY PERIOD
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Designation"
                  fullWidth size="small"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Working days"
                  type="number" fullWidth size="small"
                  value={numStr(workingDays)}
                  inputProps={{ min: 0, inputMode: 'numeric' }}
                  onChange={(e) => setWorkingDays(parseNum(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Present days"
                  type="number" fullWidth size="small"
                  value={numStr(presentDays)}
                  inputProps={{ min: 0, inputMode: 'numeric' }}
                  onChange={(e) => setPresentDays(parseNum(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Unpaid days"
                  type="number" fullWidth size="small"
                  helperText="Auto-updates Leave Deduction below"
                  value={numStr(unpaidDays)}
                  inputProps={{ min: 0, inputMode: 'numeric', step: '0.5' }}
                  onChange={(e) => {
                    const newUnpaid = parseNum(e.target.value);
                    setUnpaidDays(newUnpaid);
                    // ── Auto-recompute Leave Deduction ──
                    // Mirrors the server formula. Full-time employees
                    // are paid a fixed monthly salary that covers every
                    // calendar day (weekends included), so:
                    //   perDayRate = grossEarnings / totalDays
                    //   lop = round(perDayRate × unpaidDays)
                    // `totalDays` comes from the slip (the calendar
                    // days in the pay month — 31 for May, 28 for Feb,
                    // etc.) and isn't user-editable here. HR can still
                    // manually override the Leave Deduction field
                    // afterwards for unusual months.
                    const totalDays = slip?.totalDays || 0;
                    if (totalDays > 0 && grossEarnings > 0) {
                      const perDayRate = grossEarnings / totalDays;
                      const newLop = Math.round(perDayRate * newUnpaid);
                      setDeductions((s) => ({ ...s, lopDeduction: newLop }));
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1.5, color: tokens.colors.pink, fontWeight: 700, letterSpacing: 1 }}>
              EARNINGS
            </Typography>
            <Grid container spacing={2}>
              {EARNING_KEYS.map(([k, label]) => (
                <Grid key={k} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={label}
                    type="number" fullWidth size="small"
                    value={numStr(earnings[k])}
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    onChange={(e) => setEarnings((s) => ({ ...s, [k]: parseNum(e.target.value) }))}
                  />
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 1.5, color: tokens.colors.blue, fontWeight: 700, letterSpacing: 1 }}>
              DEDUCTIONS
            </Typography>
            <Grid container spacing={2}>
              {DEDUCTION_KEYS.map(([k, label]) => (
                <Grid key={k} size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label={label}
                    type="number" fullWidth size="small"
                    value={numStr(deductions[k])}
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    onChange={(e) => setDeductions((s) => ({ ...s, [k]: parseNum(e.target.value) }))}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{
              mt: 3, p: 2, borderRadius: 2,
              bgcolor: alpha(tokens.colors.brand, 0.04),
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary, fontWeight: 600, letterSpacing: 1 }}>
                  LIVE PREVIEW
                </Typography>
                <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
                  Gross {sym}{grossEarnings.toLocaleString()} &minus; Deductions {sym}{totalDeductions.toLocaleString()}
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 800, color: tokens.colors.brand, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
                Net: {sym}{netPay.toLocaleString()}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !slip}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}
          sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
