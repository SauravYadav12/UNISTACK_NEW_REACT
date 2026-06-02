import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconBriefcase,
  IconMail,
  IconPhone,
  IconRefresh,
} from '@tabler/icons-react';
import {
  ONBOARDING_TOTAL_STEPS,
  OnboardingCandidate,
  STAGE_LABELS,
  STAGE_PROGRESS_INDEX,
} from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

/**
 * Hero card for the candidate drawer header.
 *
 * Replaces the previous flat "Name + tiny chips + grey contact line"
 * stack that read like a debug header. Layers:
 *   - A subtle pink↔blue gradient background and a soft accent border
 *     (turns green on the onboarded state, red on rejected).
 *   - A large avatar circle on the left whose conic-gradient ring
 *     mirrors the candidate's progress percent — matches the grid
 *     card visual so navigating list → drawer feels continuous.
 *   - Name + CAND-id chip + stage chip on top.
 *   - Contact info (position / email / phone) rendered as clickable
 *     icon-chips: email → mailto, phone → tel. Position is purely
 *     informational and just shows the briefcase icon.
 *   - A reload icon-button on the right so the existing refresh
 *     affordance keeps a place on the page.
 */

interface Props {
  candidate: OnboardingCandidate;
  busy?: boolean;
  onRefresh: () => void;
}

export default function CandidateHero({ candidate, busy, onRefresh }: Props) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const isRejected = candidate.stage === 'rejected';
  const isComplete = candidate.stage === 'offer-signed';
  const accent = isRejected
    ? tokens.colors.error
    : isComplete
      ? tokens.colors.success
      : tokens.colors.pink;

  // Reuse the same conic-ring math as CandidateProgressCard so the
  // visual carries over from the grid to the drawer. Derived from
  // the stage enum directly — the full candidate doc returned to the
  // drawer doesn't carry the precomputed progressIndex/progressTotal
  // pair (those live on the lightweight grid summary type).
  const idx = STAGE_PROGRESS_INDEX[candidate.stage] || 0;
  const percent = isRejected
    ? 100
    : isComplete
      ? 100
      : Math.round((idx / ONBOARDING_TOTAL_STEPS) * 100);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 4,
        background: isRejected
          ? `linear-gradient(135deg, ${alpha(
              tokens.colors.error,
              0.06,
            )} 0%, ${alpha(tokens.colors.error, 0.02)} 100%)`
          : isComplete
            ? `linear-gradient(135deg, ${alpha(
                tokens.colors.success,
                0.06,
              )} 0%, ${alpha(tokens.colors.pink, 0.04)} 100%)`
            : `linear-gradient(135deg, ${alpha(
                tokens.colors.pink,
                0.05,
              )} 0%, ${alpha(tokens.colors.blue, 0.05)} 100%)`,
        border: '1px solid',
        borderColor: alpha(accent, 0.2),
        p: { xs: 2, sm: 2.5 },
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={2.5} alignItems="center">
        {/* Avatar with conic-gradient progress ring */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            flexShrink: 0,
            background: isComplete
              ? `conic-gradient(${tokens.colors.success} 360deg, ${tokens.colors.success} 360deg)`
              : `conic-gradient(${accent} ${percent * 3.6}deg, ${alpha(accent, 0.12)} ${percent * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isComplete
              ? `0 0 0 5px ${alpha(tokens.colors.success, 0.18)}`
              : `0 0 0 4px ${alpha(accent, 0.12)}`,
            transition: 'box-shadow 0.3s',
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.3,
              color: tokens.colors.lightText,
            }}
          >
            {candidate.firstName?.[0]?.toUpperCase()}
            {candidate.lastName?.[0]?.toUpperCase()}
          </Box>
        </Box>

        {/* Identity + contact */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5, flexWrap: 'wrap' }}
            useFlexGap
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: tokens.colors.lightText,
                lineHeight: 1.15,
              }}
              noWrap
            >
              {fullName || 'Candidate'}
            </Typography>
            <Box
              sx={{
                px: 0.85,
                py: 0.15,
                borderRadius: 1.5,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.6,
                bgcolor: alpha(tokens.colors.pink, 0.1),
                color: tokens.colors.pink,
              }}
            >
              {candidate.candId}
            </Box>
            <Box
              sx={{
                px: 0.95,
                py: 0.2,
                borderRadius: 1.5,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                bgcolor: alpha(accent, 0.12),
                color: accent,
              }}
            >
              {STAGE_LABELS[candidate.stage]}
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{ mt: 0.75, flexWrap: 'wrap' }}
            useFlexGap
          >
            <ContactChip
              icon={<IconBriefcase size={12} />}
              label={candidate.position}
              color={tokens.colors.lightTextSecondary}
            />
            {candidate.email && (
              <ContactChip
                icon={<IconMail size={12} />}
                label={candidate.email}
                href={`mailto:${candidate.email}`}
                color={tokens.colors.pink}
              />
            )}
            {candidate.phone && (
              <ContactChip
                icon={<IconPhone size={12} />}
                label={candidate.phone}
                href={`tel:${candidate.phone}`}
                color={tokens.colors.blue}
              />
            )}
          </Stack>
        </Box>

        {/* Reload */}
        <Tooltip title="Reload" placement="left">
          <span>
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={busy}
              sx={{
                bgcolor: alpha('#fff', 0.7),
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: '#fff',
                  borderColor: alpha(accent, 0.4),
                },
              }}
            >
              <IconRefresh size={16} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
}

interface ContactChipProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  color: string;
}

function ContactChip({ icon, label, href, color }: ContactChipProps) {
  const interactive = Boolean(href);
  return (
    <Box
      component={interactive ? 'a' : 'div'}
      href={href}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        height: 22,
        px: 1,
        borderRadius: 1.5,
        bgcolor: alpha(color, 0.08),
        color,
        fontSize: 11.5,
        fontWeight: 600,
        textDecoration: 'none',
        maxWidth: 320,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background-color 0.15s, transform 0.15s',
        '&:hover': interactive
          ? {
              bgcolor: alpha(color, 0.15),
            }
          : undefined,
      }}
    >
      {icon}
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 280,
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
