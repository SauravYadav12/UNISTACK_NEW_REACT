import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Typography, Box, Divider, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Stack, alpha, Chip,
} from '@mui/material';
import { IconCalculator, IconLock, IconRefresh } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import {
  getSalaryConfig, upsertSalaryConfig,
  generateSlipForUser,
} from '../../services/salaryApi';
import { SalaryConfig } from '../../Interfaces/salary';
import { tokens } from '../../theme/theme';

interface Props {
  open: boolean;
  userId: string;
  userName: string;
  year: number;
  month: number;
  onClose: () => void;
  onSaved?: () => void;
}

// Components HR enters directly. Order matters — rendered in this sequence.
const EARNING_FIELDS: Array<{ key: keyof SalaryConfig; label: string; derived: boolean; helper?: string }> = [
  { key: 'basic',                label: 'Basic',                       derived: true,  helper: '50% of CTC' },
  { key: 'hra',                  label: 'House Rent Allowance',        derived: true,  helper: '40% of Basic' },
  { key: 'mobileReimbursement',  label: 'Mobile & Internet',           derived: true,  helper: 'Flat ₹3,000 / month' },
  { key: 'booksReimbursement',   label: 'Books & Periodicals',         derived: true,  helper: 'Flat ₹2,000 / month' },
  { key: 'specialAllowances',    label: 'Special Allowances',          derived: false, helper: 'Manual entry' },
  { key: 'incentives',           label: 'Incentives',                  derived: false, helper: 'Manual entry' },
];

const DEDUCTION_FIELDS: Array<{ key: keyof SalaryConfig; label: string }> = [
  { key: 'pf',              label: 'PF' },
  // Standard statutory deduction — flat ₹208 / month for everyone (set
  // on Apply, can be overridden in the field if regulations change).
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'tds',             label: 'TDS' },
  { key: 'otherDeductions', label: 'Other Deductions' },
];

// Default Professional Tax — Karnataka PT slab. Applied to every config
// so the field auto-populates whether HR clicks Apply on the CTC or
// just opens a fresh config screen.
const FIXED_PROFESSIONAL_TAX = 208;

const EMPTY_CONFIG: SalaryConfig = {
  user: '',
  ctc: 0,
  basic: 0, hra: 0, mobileReimbursement: 0, booksReimbursement: 0,
  specialAllowances: 0, incentives: 0,
  pf: 0, professionalTax: FIXED_PROFESSIONAL_TAX, tds: 0, otherDeductions: 0,
  currency: 'INR',
  country: 'IN',
};

const FIXED_MOBILE = 3000;
const FIXED_BOOKS = 2000;
// Reimbursements (Mobile + Books) only kick in for salaries at or above
// this monthly CTC threshold. Below it, both components stay 0 and the
// fields are hidden from the form entirely — the equivalent amount
// flows into Special Allowances instead (manually entered by HR).
// Policy: anyone earning ≤ ₹30,000 is paid through Special Allowances
// only; the Mobile/Books split kicks in from ₹30,001 onwards.
const REIMBURSEMENT_CTC_THRESHOLD = 30001;

// Show empty string when the stored value is 0 so the user doesn't fight a
// leading zero when typing. Empty strings parse back to 0 on save.
function numStr(v: number | undefined): string {
  return v ? String(v) : '';
}
function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function computeBreakdown(ctc: number) {
  const basic = Math.round(ctc * 0.5);
  const hra = Math.round(basic * 0.4);
  // Below the threshold the company doesn't pay Mobile/Books reimbursements —
  // both components zero out and the UI hides their fields.
  const qualifiesForReimbursement = ctc >= REIMBURSEMENT_CTC_THRESHOLD;
  return {
    basic,
    hra,
    mobileReimbursement: qualifiesForReimbursement ? FIXED_MOBILE : 0,
    booksReimbursement: qualifiesForReimbursement ? FIXED_BOOKS : 0,
  };
}

export default function SalaryConfigDialog({
  open, userId, userName, year, month, onClose, onSaved,
}: Props) {
  const [config, setConfig] = useState<SalaryConfig>(EMPTY_CONFIG);
  const [ctcInput, setCtcInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const c = await getSalaryConfig(userId);
        const merged = { ...EMPTY_CONFIG, ...(c.data || {}), user: userId };
        setConfig(merged);
        setCtcInput(merged.ctc ? String(merged.ctc) : '');
      } catch {
        toast.error('Failed to load salary config');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId, year]);

  const setField = (k: keyof SalaryConfig, v: number) =>
    setConfig((c) => ({ ...c, [k]: v }));

  // Gate state. Earning fields are locked until either:
  //  - CTC has been applied this session, OR
  //  - The loaded config already has earnings (legacy / previously-saved rows).
  // Deductions and manual-entry fields (Special, Incentives) stay editable.
  const hasExistingEarnings = useMemo(
    () => !!(config.basic || config.hra || config.mobileReimbursement || config.booksReimbursement),
    [config.basic, config.hra, config.mobileReimbursement, config.booksReimbursement],
  );
  const fieldsUnlocked = hasExistingEarnings || !!config.ctc;

  const parsedCtc = parseNum(ctcInput);
  const preview = useMemo(() => computeBreakdown(parsedCtc), [parsedCtc]);
  const ctcDirty = parsedCtc !== (config.ctc || 0);

  function applyCtc() {
    if (parsedCtc <= 0) {
      toast.error('Enter a CTC greater than 0');
      return;
    }
    const derived = computeBreakdown(parsedCtc);
    setConfig((c) => ({
      ...c,
      ctc: parsedCtc,
      ...derived,
      // Professional Tax is a flat statutory deduction — re-stamp it on
      // every Apply so legacy configs that predate this field get it
      // populated the first time HR re-applies CTC. Existing overrides
      // (rare — usually only changes if the PT slab changes) are
      // intentionally overwritten here; HR can still edit afterwards.
      professionalTax: FIXED_PROFESSIONAL_TAX,
    }));
    toast.success('CTC applied — adjust components as needed');
  }

  const totalEarnings = EARNING_FIELDS.reduce((s, f) => s + Number(config[f.key] || 0), 0);
  const totalDeductions = DEDUCTION_FIELDS.reduce((s, f) => s + Number(config[f.key] || 0), 0);
  const net = totalEarnings - totalDeductions;

  async function handleSave() {
    if (!fieldsUnlocked) {
      toast.error('Enter CTC and click Apply first');
      return;
    }
    setSaving(true);
    try {
      const country = config.country || 'IN';
      const currency = country === 'US' ? 'USD' : 'INR';
      const finalCtc = parsedCtc || config.ctc;
      // Enforce reimbursement rule: below the threshold both fields must be 0,
      // even if a stale value sits in config from a previous edit.
      const belowThreshold = finalCtc > 0 && finalCtc < REIMBURSEMENT_CTC_THRESHOLD;
      await upsertSalaryConfig(userId, {
        ...config,
        ctc: finalCtc,
        country,
        currency,
        ...(belowThreshold
          ? { mobileReimbursement: 0, booksReimbursement: 0 }
          : {}),
      });
      // Re-compute the slip for the month the admin is viewing so the preview
      // reflects the saved config immediately.
      try {
        await generateSlipForUser(userId, year, month);
      } catch {
        // Non-fatal — admin can hit "Generate Slips" manually.
      }
      toast.success('Salary config saved');
      onSaved?.();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Salary Setup — {userName}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* ─── STEP 1: CTC ─── */}
            <Box sx={{
              p: 2, mb: 3, borderRadius: 2,
              bgcolor: alpha(tokens.colors.pink, 0.04),
              border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  bgcolor: tokens.colors.pink, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11,
                }}>1</Box>
                <Typography sx={{ fontWeight: 700, letterSpacing: 1, color: tokens.colors.pink }}>
                  ENTER MONTHLY CTC
                </Typography>
                {hasExistingEarnings && (
                  <Chip
                    size="small"
                    label="Saved"
                    sx={{
                      bgcolor: alpha(tokens.colors.success, 0.1),
                      color: tokens.colors.success,
                      fontWeight: 700, fontSize: 10, height: 20,
                    }}
                  />
                )}
              </Stack>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Monthly CTC"
                    type="number"
                    fullWidth
                    size="small"
                    value={ctcInput}
                    onChange={(e) => setCtcInput(e.target.value)}
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {config.country === 'US' ? '$' : '₹'}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="contained"
                    onClick={applyCtc}
                    disabled={!ctcDirty || parsedCtc <= 0}
                    startIcon={hasExistingEarnings ? <IconRefresh size={16} /> : <IconCalculator size={16} />}
                    sx={{
                      bgcolor: tokens.colors.pink,
                      '&:hover': { bgcolor: tokens.colors.pinkDark },
                      height: 40,
                    }}
                  >
                    {hasExistingEarnings ? 'Recalculate from CTC' : 'Apply & Unlock'}
                  </Button>
                </Grid>
              </Grid>

              {/* Formula preview */}
              {parsedCtc > 0 && (
                <Grid container spacing={1} sx={{ mt: 1.5 }}>
                  {[
                    { label: 'Basic (50%)', v: preview.basic },
                    { label: 'HRA (40% of Basic)', v: preview.hra },
                    ...(parsedCtc >= REIMBURSEMENT_CTC_THRESHOLD
                      ? [
                          { label: 'Mobile & Internet', v: preview.mobileReimbursement },
                          { label: 'Books & Periodicals', v: preview.booksReimbursement },
                        ]
                      : []),
                  ].map((p) => (
                    <Grid key={p.label} size={{ xs: 6, sm: 3 }}>
                      <Box sx={{
                        p: 1.25, borderRadius: 1.5,
                        bgcolor: 'white',
                        border: `1px solid ${alpha(tokens.colors.pink, 0.15)}`,
                      }}>
                        <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, fontWeight: 600, letterSpacing: 0.5 }}>
                          {p.label}
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.colors.lightText, fontVariantNumeric: 'tabular-nums' }}>
                          {config.country === 'US' ? '$' : '₹'}{p.v.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Below-threshold note */}
              {parsedCtc > 0 && parsedCtc < REIMBURSEMENT_CTC_THRESHOLD && (
                <Box sx={{
                  mt: 1.5, px: 1.25, py: 1, borderRadius: 1.5,
                  bgcolor: alpha(tokens.colors.warning, 0.07),
                  border: `1px solid ${alpha(tokens.colors.warning, 0.25)}`,
                }}>
                  <Typography sx={{ fontSize: 11, color: tokens.colors.lightText, lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: tokens.colors.warning, letterSpacing: 0.5 }}>
                      Reimbursements skipped —
                    </Box>{' '}
                    Mobile & Internet and Books & Periodicals kick in only at monthly CTC ₹{REIMBURSEMENT_CTC_THRESHOLD.toLocaleString()}+. Special Allowances + Incentives still work.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Country */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Country of residence</InputLabel>
                  <Select
                    label="Country of residence"
                    value={config.country || 'IN'}
                    onChange={(e) => setConfig((c) => ({
                      ...c,
                      country: e.target.value as 'IN' | 'US',
                      currency: e.target.value === 'IN' ? 'INR' : 'USD',
                    }))}
                  >
                    <MenuItem value="IN">India — ₹ INR</MenuItem>
                    <MenuItem value="US">USA — $ USD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* ─── STEP 2: EARNINGS ─── */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: fieldsUnlocked ? tokens.colors.pink : alpha(tokens.colors.pink, 0.3),
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11,
              }}>2</Box>
              <Typography sx={{ fontWeight: 700, letterSpacing: 1, color: tokens.colors.pink }}>
                EARNINGS
              </Typography>
              {!fieldsUnlocked && (
                <Chip
                  size="small"
                  icon={<IconLock size={12} />}
                  label="Locked — apply CTC to edit"
                  sx={{
                    bgcolor: alpha(tokens.colors.lightTextSecondary, 0.1),
                    color: tokens.colors.lightTextSecondary,
                    fontWeight: 600, fontSize: 10, height: 22,
                    '& .MuiChip-icon': { color: tokens.colors.lightTextSecondary, ml: 0.5 },
                  }}
                />
              )}
            </Stack>
            <Grid container spacing={2}>
              {EARNING_FIELDS.map(({ key, label, derived, helper }) => {
                // Hide reimbursement fields entirely when CTC is below the
                // threshold — they're forced to 0 and shouldn't be editable.
                const effectiveCtc = parsedCtc || config.ctc || 0;
                const isReimbursement =
                  key === 'mobileReimbursement' || key === 'booksReimbursement';
                if (isReimbursement && effectiveCtc > 0 && effectiveCtc < REIMBURSEMENT_CTC_THRESHOLD) {
                  return null;
                }
                // Special Allowances + Incentives stay editable from the start.
                const isManualAlways = !derived;
                const disabled = !fieldsUnlocked && !isManualAlways;
                return (
                  <Grid key={key as string} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={label}
                      type="number"
                      fullWidth
                      size="small"
                      disabled={disabled}
                      value={numStr(config[key] as number | undefined)}
                      inputProps={{ min: 0, inputMode: 'numeric' }}
                      onChange={(e) => setField(key, parseNum(e.target.value))}
                      helperText={helper}
                    />
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* ─── STEP 3: DEDUCTIONS ─── */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: tokens.colors.blue, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11,
              }}>3</Box>
              <Typography sx={{ fontWeight: 700, letterSpacing: 1, color: tokens.colors.blue }}>
                DEDUCTIONS
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {DEDUCTION_FIELDS.map(({ key, label }) => (
                <Grid key={key as string} size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label={label}
                    type="number"
                    fullWidth
                    size="small"
                    value={numStr(config[key] as number | undefined)}
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    onChange={(e) => setField(key, parseNum(e.target.value))}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{
              mt: 3, p: 2, borderRadius: 2,
              bgcolor: 'rgba(3,40,64,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Typography sx={{ fontSize: 12, color: '#5E7687' }}>
                Gross {totalEarnings.toLocaleString()} − Deductions {totalDeductions.toLocaleString()} (excl. LOP)
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#032840', fontSize: 18 }}>
                Net: {config.country === 'US' ? '$' : '₹'}{net.toLocaleString()}
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
          disabled={saving || loading || !fieldsUnlocked}
          sx={{ bgcolor: '#EC4599', '&:hover': { bgcolor: '#D03B85' } }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
