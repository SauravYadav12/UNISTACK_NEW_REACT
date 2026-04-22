import { useState, MouseEvent } from 'react';
import { Box, IconButton, Popover, Stack, Tooltip, Typography, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { IconInfoCircle, IconChevronDown } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

/**
 * LeaveDeductionFormula — a pill-trigger that reveals a step-by-step visual
 * breakdown of how the LOP (Leave Deduction) figure on the payslip is
 * computed. Each step animates in sequentially; a dashed connector between
 * steps makes the data-flow obvious at a glance.
 *
 * Usage: drop `<LeaveDeductionFormula />` anywhere on the Salary admin page.
 * It's stateless and self-contained.
 */
interface Step {
  n: number;
  title: string;
  formula: string;
  example: string;
  color: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Gross earnings',
    formula: 'basic + hra + mobile + books + special + incentives',
    example: '8,500 + 3,400 + 3,000 + 2,000 + 1,100 + 0 = ₹18,000',
    color: tokens.colors.pink,
  },
  {
    n: 2,
    title: 'Working days',
    formula: 'days in month − weekends − holidays (for user\u2019s country)',
    example: 'April 2026 → 30 − 8 Sat/Sun − 0 holidays = 22 days',
    color: tokens.colors.blue,
  },
  {
    n: 3,
    title: 'Per-day rate',
    formula: 'gross ÷ working days',
    example: '₹18,000 ÷ 22 = ₹818.18',
    color: tokens.colors.yellowDark,
  },
  {
    n: 4,
    title: 'Leave deduction',
    formula: 'round(perDayRate × unpaid days)',
    example: '₹818.18 × 2 = ₹1,636   ·   (2.5 days → ₹2,045)',
    color: tokens.colors.brand,
  },
];

export default function LeaveDeductionFormula() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = !!anchor;

  function toggle(e: MouseEvent<HTMLElement>) {
    setAnchor(anchor ? null : e.currentTarget);
  }

  return (
    <>
      <Tooltip title="How we calculate Leave Deduction" arrow>
        <Box
          onClick={toggle}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            px: 1.25, py: 0.5, borderRadius: 999,
            cursor: 'pointer', userSelect: 'none',
            bgcolor: alpha(tokens.colors.pink, 0.08),
            border: `1px solid ${alpha(tokens.colors.pink, 0.22)}`,
            color: tokens.colors.pink,
            transition: 'all 0.18s',
            '&:hover': {
              bgcolor: alpha(tokens.colors.pink, 0.14),
              borderColor: alpha(tokens.colors.pink, 0.35),
            },
          }}
        >
          <IconInfoCircle size={14} stroke={2.25} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            How LOP is calculated
          </Typography>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <IconChevronDown size={12} />
          </motion.div>
        </Box>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(3, 40, 64, 0.18)',
              overflow: 'hidden',
              maxWidth: 460,
              border: 'none',
            },
          },
        }}
      >
        {/* Header band */}
        <Box sx={{
          px: 2.5, py: 1.75,
          bgcolor: tokens.colors.brand,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Tri-color dot row top-right — tiny Unicodez signature */}
          <Box sx={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 0.5, opacity: 0.55 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.pink }} />
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.blue }} />
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.yellow }} />
          </Box>
          <Typography sx={{ fontSize: 10, letterSpacing: 3, opacity: 0.7, fontWeight: 700 }}>
            THE MATH
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.25 }}>
            Leave Deduction, step by step
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.7, mt: 0.25 }}>
            Worked example: April 2026, salary ₹18,000 / month, 2 unpaid days
          </Typography>
        </Box>

        <AnimatePresence>
          {open && (
            <Box sx={{ p: 2.5, position: 'relative' }}>
              {/* Vertical dashed connector behind the steps */}
              <Box sx={{
                position: 'absolute',
                top: 40, bottom: 40,
                left: 33,
                width: 0,
                borderLeft: `2px dashed ${alpha(tokens.colors.brand, 0.15)}`,
                zIndex: 0,
              }} />

              <Stack spacing={1.75} sx={{ position: 'relative', zIndex: 1 }}>
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      {/* Numbered badge */}
                      <Box sx={{
                        width: 30, height: 30, borderRadius: '50%',
                        bgcolor: s.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 13, flexShrink: 0,
                        boxShadow: `0 2px 8px ${alpha(s.color, 0.35)}`,
                      }}>
                        {s.n}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                          fontSize: 12, fontWeight: 700, color: s.color,
                          letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>
                          {s.title}
                        </Typography>
                        {/* Pill-shaped formula */}
                        <Box sx={{
                          display: 'inline-block', mt: 0.5,
                          px: 1, py: 0.3, borderRadius: 999,
                          bgcolor: alpha(s.color, 0.08),
                          border: `1px solid ${alpha(s.color, 0.18)}`,
                        }}>
                          <Typography sx={{
                            fontSize: 10.5,
                            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                            color: tokens.colors.lightText,
                            lineHeight: 1.4,
                          }}>
                            {s.formula}
                          </Typography>
                        </Box>
                        <Typography sx={{
                          fontSize: 11.5, color: tokens.colors.lightTextSecondary,
                          mt: 0.6, fontVariantNumeric: 'tabular-nums', lineHeight: 1.5,
                        }}>
                          {s.example}
                        </Typography>
                      </Box>
                    </Stack>
                  </motion.div>
                ))}
              </Stack>

              {/* Footer hint */}
              <Box sx={{
                mt: 2, pt: 1.5,
                borderTop: `1px dashed ${alpha(tokens.colors.brand, 0.12)}`,
              }}>
                <Typography sx={{ fontSize: 10.5, color: tokens.colors.lightTextSecondary, lineHeight: 1.5 }}>
                  <Box component="span" sx={{ fontWeight: 700, color: tokens.colors.brand }}>
                    Half-days count as 0.5 of an unpaid day.
                  </Box>
                  {' '}
                  A user whose total leaves split as 2 paid + 1 half-unpaid will still be charged{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: tokens.colors.pink, fontVariantNumeric: 'tabular-nums' }}>
                    ₹409
                  </Box>
                  {' '}on the slip.
                </Typography>
              </Box>
            </Box>
          )}
        </AnimatePresence>
      </Popover>
    </>
  );
}
