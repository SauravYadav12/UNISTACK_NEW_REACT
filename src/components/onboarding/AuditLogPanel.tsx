import { useState } from 'react';
import { Box, Collapse, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconChevronDown,
  IconChevronRight,
  IconHistory,
} from '@tabler/icons-react';
import moment from 'moment';
import { OnboardingAuditEntry } from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

/**
 * Renders the candidate's audit trail.
 *
 * Designed for the drawer body. Collapsed by default so the active
 * actions panel + form snapshot stay above the fold; admins expand
 * when they need to see "who flipped this candidate to BG check, and
 * when".
 */

interface Props {
  entries: OnboardingAuditEntry[];
}

// User-friendly labels for the internal action codes. New codes
// default to the raw string (so future events show up without
// requiring a label table update first).
const ACTION_LABELS: Record<string, string> = {
  created: 'Candidate created',
  'form-submitted': 'Candidate submitted onboarding form',
  'info-requested': 'HR requested more information',
  'info-received': 'HR marked info received',
  'bg-check-started': 'HR started background check',
  'bg-check-passed': 'Background check passed',
  'bg-check-failed': 'Background check failed',
  'offer-sent': 'Offer letter sent',
  'offer-signed': 'Candidate signed offer',
  rejected: 'Candidate rejected',
  'link-resent-onboarding': 'HR resent onboarding link',
  'link-resent-offer': 'HR resent offer letter link',
};

// Color hint per action type so the timeline reads at-a-glance.
const ACTION_COLOR: Record<string, string> = {
  created: tokens.colors.pink,
  'form-submitted': tokens.colors.blue,
  'info-requested': tokens.colors.warning,
  'info-received': tokens.colors.blue,
  'bg-check-started': tokens.colors.blue,
  'bg-check-passed': tokens.colors.success,
  'bg-check-failed': tokens.colors.error,
  'offer-sent': tokens.colors.pink,
  'offer-signed': tokens.colors.success,
  rejected: tokens.colors.error,
  'link-resent-onboarding': tokens.colors.lightTextSecondary,
  'link-resent-offer': tokens.colors.lightTextSecondary,
};

export default function AuditLogPanel({ entries }: Props) {
  const [open, setOpen] = useState(false);
  // Newest first — easier to scan "what happened recently".
  const sorted = [...(entries || [])].sort(
    (a, b) => +new Date(b.at) - +new Date(a.at),
  );
  const count = sorted.length;

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        mt: 3,
      }}
    >
      {/* Header — click anywhere to toggle */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        onClick={() => setOpen((x) => !x)}
        sx={{
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          background: `linear-gradient(135deg, ${alpha(
            tokens.colors.lightTextSecondary,
            0.05,
          )} 0%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
          borderBottom: open ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            color: tokens.colors.lightTextSecondary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </Box>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(tokens.colors.blue, 0.12),
            color: tokens.colors.blue,
          }}
        >
          <IconHistory size={14} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: tokens.colors.lightText,
              lineHeight: 1.15,
            }}
          >
            Activity log
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            {count
              ? `${count} event${count === 1 ? '' : 's'} recorded`
              : 'No activity yet'}
          </Typography>
        </Box>
      </Stack>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ p: 2 }}>
          {count === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No activity recorded yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {sorted.map((e, i) => {
                const color = ACTION_COLOR[e.action] || tokens.colors.lightTextSecondary;
                return (
                  <Stack
                    key={`${e.at}-${i}`}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    {/* Timeline rail dot + connector */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: 14,
                        flexShrink: 0,
                        alignSelf: 'stretch',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 5,
                          top: 14,
                          bottom: -10,
                          width: 2,
                          bgcolor:
                            i === sorted.length - 1
                              ? 'transparent'
                              : alpha(color, 0.18),
                        }}
                      />
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: color,
                          mt: '4px',
                          boxShadow: `0 0 0 3px ${alpha(color, 0.18)}`,
                        }}
                      />
                    </Box>
                    {/* Content */}
                    <Box sx={{ minWidth: 0, flex: 1, pb: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: tokens.colors.lightText,
                          lineHeight: 1.3,
                        }}
                      >
                        {ACTION_LABELS[e.action] || e.action}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: tokens.colors.lightTextSecondary,
                            fontSize: 11,
                          }}
                        >
                          by <strong>{e.byName}</strong>
                        </Typography>
                        <Box
                          sx={{
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            bgcolor: tokens.colors.lightTextSecondary,
                            opacity: 0.5,
                          }}
                        />
                        <Tooltip
                          title={moment(e.at).format('DD MMM YYYY · hh:mm:ss A')}
                          arrow
                          placement="top"
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: tokens.colors.lightTextSecondary,
                              fontSize: 11,
                            }}
                          >
                            {moment(e.at).fromNow()}
                          </Typography>
                        </Tooltip>
                      </Stack>
                      {e.details && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1.5,
                            bgcolor: alpha(color, 0.06),
                            color: tokens.colors.lightText,
                            fontSize: 11,
                            lineHeight: 1.4,
                            borderLeft: `2px solid ${alpha(color, 0.4)}`,
                          }}
                        >
                          {e.details}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
