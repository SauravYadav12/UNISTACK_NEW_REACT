import { Box, Container, Stack, Typography } from '@mui/material';
import { IconLinkOff } from '@tabler/icons-react';
import { tokens } from '../../theme';

/**
 * Shared "this link isn't available" screen for the public candidate
 * surface. Renders when the resolveToken call returns ok:false for
 * any reason (expired, consumed, revoked, not-found).
 *
 * Copy is intentionally non-technical — the candidate doesn't need
 * to know which token state we hit. They just need to ping HR.
 */

const REASON_TEXT: Record<string, string> = {
  expired:
    'This link has expired. Links are valid for 60 days from when HR sent it.',
  consumed:
    'This link has already been used. If you need to make changes, please ask HR for a fresh link.',
  revoked:
    'HR has revoked this link. They may have sent you a new one — check your inbox.',
  'not-found':
    'We could not find this link. Make sure you copied the full URL from the email.',
  'candidate-missing':
    'Something looks off with your record. Please reach out to HR.',
};

interface Props {
  reason: string;
}

export default function LinkUnavailable({ reason }: Props) {
  const message =
    REASON_TEXT[reason] || REASON_TEXT['not-found'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.gradients.warmGlow,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack
          spacing={3}
          alignItems="center"
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: tokens.shadows.soft4,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FECACA 100%)',
              color: tokens.colors.warning,
            }}
          >
            <IconLinkOff size={28} />
          </Box>
          <Typography variant="h5" fontWeight={800}>
            This link isn't available
          </Typography>
          <Typography color="text.secondary">{message}</Typography>
          <Typography variant="caption" color="text.secondary">
            Please ask HR for an updated link by writing to{' '}
            <a
              href="mailto:hr@unicodez.com"
              style={{ color: tokens.colors.pink, textDecoration: 'none' }}
            >
              hr@unicodez.com
            </a>
            .
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
