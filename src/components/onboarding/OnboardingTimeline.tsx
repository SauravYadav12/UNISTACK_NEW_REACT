import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  IconCheck,
  IconFileText,
  IconMailForward,
  IconShieldCheck,
  IconSignature,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import moment from 'moment';
import {
  OnboardingCandidate,
  ONBOARDING_TOTAL_STEPS,
} from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

/**
 * Branded horizontal timeline for the candidate's onboarding journey.
 *
 * Replaces the plain MUI Stepper used previously. The same five logical
 * stages are presented, but each station is now a station node with:
 *
 *   - A coloured 40px circle holding a stage-specific icon (envelope
 *     for Invited, doc for Form, shield for BG check, etc.). The
 *     circle's background advances from outlined → solid pink (current)
 *     → solid success-green (done).
 *   - A label + status pill below the circle (Done · Active · Upcoming).
 *   - A small timestamp under the status when that stage has a real
 *     completion time on the candidate doc.
 *
 * Connecting lines between stations are colored progressively — green
 * for completed segments, dashed-grey for upcoming ones — so the eye
 * can track "where we are" at a glance.
 *
 * A thin gradient progress bar runs across the bottom of the card to
 * mirror the percent already shown on the candidate card in the grid.
 *
 * For rejected candidates the card paints in the error palette and the
 * failing station shows an X mark.
 */

type StageKey = 'invited' | 'form' | 'bg' | 'offer' | 'signed';

interface Step {
  key: StageKey;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { key: 'invited', label: 'Invited', icon: <IconUserPlus size={18} /> },
  { key: 'form', label: 'Form Submitted', icon: <IconFileText size={18} /> },
  { key: 'bg', label: 'Background Check', icon: <IconShieldCheck size={18} /> },
  { key: 'offer', label: 'Offer Sent', icon: <IconMailForward size={18} /> },
  { key: 'signed', label: 'Signed', icon: <IconSignature size={18} /> },
];

// Maps the candidate's `stage` enum onto the visual step index that's
// currently "in progress". Anything below this index is fully completed;
// anything above is upcoming.
function activeIndex(stage: OnboardingCandidate['stage']): number {
  switch (stage) {
    case 'invited':
      return 0;
    case 'form-submitted':
    case 'info-requested':
      return 1;
    case 'bg-check':
      return 2;
    case 'bg-check-passed':
      return 3;
    case 'offer-sent':
      return 3;
    // Both terminal "done" stages map past the last station so every
    // step is rendered as completed (green tick). `offer-signed` is
    // the legacy single-doc terminal; `onboarded` is the new terminal
    // after all five documents (offer + 4 additional) have been signed.
    case 'offer-signed':
    case 'onboarded':
      return 5;
    case 'rejected':
      return -1;
  }
  return 0;
}

function stageTimestamp(
  doc: OnboardingCandidate,
  key: StageKey,
): Date | null {
  switch (key) {
    case 'invited':
      return doc.createdAt ? new Date(doc.createdAt) : null;
    case 'form':
      return doc.formData?.submittedAt
        ? new Date(doc.formData.submittedAt)
        : null;
    case 'bg':
      return doc.bgCheckCompletedAt
        ? new Date(doc.bgCheckCompletedAt)
        : doc.bgCheckStartedAt
          ? new Date(doc.bgCheckStartedAt)
          : null;
    case 'offer':
      return doc.offer?.sentAt ? new Date(doc.offer.sentAt) : null;
    case 'signed':
      return doc.offer?.signedAt ? new Date(doc.offer.signedAt) : null;
  }
  return null;
}

interface Props {
  candidate: OnboardingCandidate;
}

export default function OnboardingTimeline({ candidate }: Props) {
  const isRejected = candidate.stage === 'rejected';
  // Either terminal "done" stage flips the timeline into its complete
  // state — all stations green, progress bar full, "Onboarding
  // complete" headline.
  const isComplete =
    candidate.stage === 'offer-signed' || candidate.stage === 'onboarded';
  const active = activeIndex(candidate.stage);
  const totalSegments = STEPS.length - 1; // 4 connectors between 5 stations
  // Visual fill for connectors + progress bar. Each completed station
  // contributes 1/segments + the current "in-progress" station adds a
  // half-segment so the line has visible momentum even before the next
  // completion.
  let progressUnits = 0;
  if (isComplete) progressUnits = totalSegments;
  else if (active > 0) progressUnits = Math.max(0, active - 1) + 0.5;
  const progressPercent = isRejected
    ? 0
    : Math.min(100, (progressUnits / totalSegments) * 100);

  const accent = isRejected
    ? tokens.colors.error
    : isComplete
      ? tokens.colors.success
      : tokens.colors.pink;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 4,
        background: isComplete
          ? `linear-gradient(135deg, ${alpha(
              tokens.colors.success,
              0.06,
            )} 0%, ${alpha(tokens.colors.pink, 0.04)} 100%)`
          : isRejected
            ? `linear-gradient(135deg, ${alpha(
                tokens.colors.error,
                0.06,
              )} 0%, ${alpha(tokens.colors.error, 0.02)} 100%)`
            : `linear-gradient(135deg, ${alpha(
                tokens.colors.pink,
                0.04,
              )} 0%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
        border: '1px solid',
        borderColor: alpha(accent, 0.18),
        boxShadow: isComplete
          ? `0 4px 32px ${alpha(tokens.colors.success, 0.15)}`
          : 'none',
        p: { xs: 2.5, sm: 3 },
        pb: { xs: 4, sm: 4.5 },
        overflow: 'hidden',
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Title strip */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: 2.5 }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {isRejected ? 'Candidate journey · halted' : 'Candidate journey'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: tokens.colors.lightTextSecondary,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
          }}
        >
          {isComplete
            ? 'Completed'
            : isRejected
              ? candidate.rejectionReason || 'Rejected'
              : `${Math.round((active / ONBOARDING_TOTAL_STEPS) * 100) || Math.round(progressPercent)}%`}
        </Typography>
      </Stack>

      {/* Station nodes + connectors */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        {STEPS.map((step, i) => {
          const done = !isRejected && i < active;
          const current = !isRejected && i === active && !isComplete;
          const allDone = isComplete;
          const node = renderNode({
            step,
            done: done || allDone,
            current,
            rejected: isRejected,
            timestamp: stageTimestamp(candidate, step.key),
          });
          return (
            <Box
              key={step.key}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                px: 0.5,
              }}
            >
              {/* Connector to next station — sits behind the next node's
                  circle visually. We render it on the LEFT of each
                  station except the first, anchored to the icon row. */}
              {i > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 19,
                    left: 'calc(-50% + 24px)',
                    width: 'calc(100% - 48px)',
                    height: 3,
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: alpha(tokens.colors.lightTextSecondary, 0.12),
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        // Each connector belongs to station `i`. It's
                        // fully filled when station `i` is done. It's
                        // half-filled when station `i-1` was the
                        // current one (visual momentum). Otherwise 0.
                        isComplete
                          ? '100%'
                          : i <= active && !isRejected
                            ? '100%'
                            : i === active + 1 && !isRejected
                              ? '50%'
                              : '0%',
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      height: '100%',
                      background: isRejected
                        ? tokens.colors.error
                        : `linear-gradient(90deg, ${tokens.colors.success}, ${tokens.colors.pink})`,
                    }}
                  />
                </Box>
              )}
              {node}
            </Box>
          );
        })}
      </Box>

      {/* Bottom progress bar — mirrors the per-card bar in the grid. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          bgcolor: alpha(accent, 0.1),
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
  );
}

// ─────────────────────────────────────────────────────────────────────
// Station node — circle + label + status pill + timestamp.

function renderNode({
  step,
  done,
  current,
  rejected,
  timestamp,
}: {
  step: Step;
  done: boolean;
  current: boolean;
  rejected: boolean;
  timestamp: Date | null;
}) {
  const size = 40;
  const upcoming = !done && !current && !rejected;

  const bg = rejected
    ? tokens.colors.error
    : done
      ? tokens.colors.success
      : current
        ? tokens.colors.pink
        : 'transparent';
  const fg = rejected || done || current
    ? '#fff'
    : tokens.colors.lightTextSecondary;
  const borderColor = upcoming
    ? alpha(tokens.colors.lightTextSecondary, 0.35)
    : 'transparent';

  return (
    <Tooltip
      title={
        timestamp
          ? `${step.label} · ${moment(timestamp).format('DD MMM YYYY · hh:mm A')}`
          : step.label
      }
      arrow
      placement="top"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bg,
            color: fg,
            border: '2px solid',
            borderColor,
            position: 'relative',
            zIndex: 1,
            boxShadow: done
              ? `0 0 0 4px ${alpha(tokens.colors.success, 0.18)}`
              : current
                ? `0 0 0 4px ${alpha(tokens.colors.pink, 0.18)}`
                : 'none',
            transition: 'box-shadow 0.3s',
            animation: current
              ? 'onboardingPulse 1.8s ease-in-out infinite'
              : 'none',
            '@keyframes onboardingPulse': {
              '0%, 100%': {
                boxShadow: `0 0 0 4px ${alpha(tokens.colors.pink, 0.18)}`,
              },
              '50%': {
                boxShadow: `0 0 0 9px ${alpha(tokens.colors.pink, 0)}`,
              },
            },
          }}
        >
          {/* Done shows a check; rejected shows X; current shows its own icon;
              upcoming shows the muted icon. */}
          {rejected ? (
            <IconX size={18} />
          ) : done ? (
            <IconCheck size={18} />
          ) : (
            step.icon
          )}
        </Box>

        <Typography
          sx={{
            mt: 1.25,
            fontSize: 11.5,
            fontWeight: 700,
            color:
              done || current
                ? tokens.colors.lightText
                : tokens.colors.lightTextSecondary,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          {step.label}
        </Typography>

        {/* Status pill — Done / Active / Upcoming, color-coded. */}
        <Box
          sx={{
            mt: 0.5,
            px: 0.85,
            py: 0.1,
            borderRadius: 1.5,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: rejected
              ? tokens.colors.error
              : done
                ? tokens.colors.success
                : current
                  ? tokens.colors.pink
                  : tokens.colors.lightTextSecondary,
            bgcolor: rejected
              ? alpha(tokens.colors.error, 0.1)
              : done
                ? alpha(tokens.colors.success, 0.12)
                : current
                  ? alpha(tokens.colors.pink, 0.12)
                  : alpha(tokens.colors.lightTextSecondary, 0.08),
          }}
        >
          {rejected ? 'Halted' : done ? 'Done' : current ? 'Active' : 'Upcoming'}
        </Box>

        {/* Timestamp only when present + the station is done (or
            current, for stages like BG Check where the started-at
            timestamp is shown even while in-progress). */}
        {timestamp && (done || current) && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              fontSize: 9.5,
              color: tokens.colors.lightTextSecondary,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {moment(timestamp).format('DD MMM')}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
