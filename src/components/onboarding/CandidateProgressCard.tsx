import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  OnboardingCandidateSummary,
  ONBOARDING_TOTAL_STEPS,
  STAGE_LABELS,
} from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

/**
 * Card surfacing one onboarding candidate's progress at a glance.
 *
 * Three visual hooks layered on top of the standard MUI card surface:
 *   1. A conic-gradient ring around the avatar — fills proportionally
 *      to `progressPercent`. At 100% the ring turns solid success
 *      green with a soft glow.
 *   2. A row of 7 dots beneath the meta — completed steps fill, the
 *      current step pulses, upcoming steps stay outlined.
 *   3. A thin gradient progress bar at the bottom of the card,
 *      animating from its previous value via framer-motion.
 *
 * Clicking the card opens the drawer (handled by the parent panel).
 */

interface Props {
  candidate: OnboardingCandidateSummary;
  onClick?: () => void;
}

export default function CandidateProgressCard({ candidate, onClick }: Props) {
  const isRejected = candidate.stage === 'rejected';
  const isComplete = candidate.stage === 'offer-signed';
  const accent = isRejected
    ? tokens.colors.error
    : isComplete
      ? tokens.colors.success
      : tokens.colors.pink;
  // For the conic-gradient ring around the avatar.
  const percent = isRejected ? 100 : candidate.progressPercent;

  return (
    <motion.div
      whileHover={onClick && !isRejected ? { y: -3 } : undefined}
      transition={{ duration: 0.18 }}
    >
      <Box
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : -1}
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isComplete
            ? alpha(tokens.colors.success, 0.35)
            : 'divider',
          bgcolor: 'background.paper',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.18s, border-color 0.18s',
          boxShadow: tokens.shadows.soft1,
          '&:hover': onClick
            ? {
                borderColor: alpha(accent, 0.45),
                boxShadow: tokens.shadows.soft4,
              }
            : undefined,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Avatar with conic-gradient progress ring */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              flexShrink: 0,
              background: isComplete
                ? `conic-gradient(${tokens.colors.success} 360deg, ${tokens.colors.success} 360deg)`
                : `conic-gradient(${accent} ${percent * 3.6}deg, ${alpha(
                    accent,
                    0.12,
                  )} ${percent * 3.6}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isComplete
                ? `0 0 0 4px ${alpha(tokens.colors.success, 0.18)}`
                : undefined,
              transition: 'box-shadow 0.3s',
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: tokens.colors.lightText,
                fontSize: 18,
                letterSpacing: 0.3,
              }}
            >
              {candidate.firstName?.[0]?.toUpperCase()}
              {candidate.lastName?.[0]?.toUpperCase()}
            </Box>
          </Box>

          {/* Identity + position */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={700} noWrap sx={{ fontSize: 15 }}>
                {candidate.firstName} {candidate.lastName}
              </Typography>
              <Chip
                label={candidate.candId}
                size="small"
                sx={{
                  bgcolor: alpha(tokens.colors.pink, 0.08),
                  color: tokens.colors.pink,
                  fontWeight: 700,
                  fontSize: 10,
                  height: 18,
                }}
              />
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
              noWrap
            >
              {candidate.position} · {candidate.email}
            </Typography>
          </Box>

          {/* Stage chip */}
          <Chip
            label={STAGE_LABELS[candidate.stage]}
            size="small"
            sx={{
              bgcolor: alpha(accent, 0.12),
              color: accent,
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        </Stack>

        {/* Step dots */}
        {!isRejected && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 2, ml: 0.5 }}
            alignItems="center"
          >
            {Array.from({ length: ONBOARDING_TOTAL_STEPS }).map((_, i) => {
              const stepIndex = i + 1;
              const isDone = stepIndex < candidate.progressIndex;
              const isCurrent = stepIndex === candidate.progressIndex;
              return (
                <Tooltip
                  key={i}
                  title={`Step ${stepIndex}${isCurrent ? ' (current)' : isDone ? ' (done)' : ''}`}
                  placement="top"
                  arrow
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: isDone || isCurrent ? accent : 'transparent',
                      border: '1.5px solid',
                      borderColor: isDone || isCurrent
                        ? accent
                        : alpha(tokens.colors.lightTextSecondary, 0.4),
                      animation: isCurrent
                        ? 'pulseRing 1.8s ease-in-out infinite'
                        : 'none',
                      '@keyframes pulseRing': {
                        '0%, 100%': {
                          boxShadow: `0 0 0 0 ${alpha(accent, 0.45)}`,
                        },
                        '50%': {
                          boxShadow: `0 0 0 6px ${alpha(accent, 0)}`,
                        },
                      },
                    }}
                  />
                </Tooltip>
              );
            })}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {candidate.progressPercent}%
            </Typography>
          </Stack>
        )}

        {/* Footer gradient bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: alpha(accent, 0.08),
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              background: isRejected
                ? tokens.colors.error
                : isComplete
                  ? tokens.colors.success
                  : tokens.gradients.brand,
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
}
