import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { IconMinus, IconPlus, IconX } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import {
  LeaderboardRow,
  MarketingMetrics,
  PerformanceRole,
  ScoreLine,
  SupportMetrics,
} from '../../Interfaces/performance';
import { getInitials } from '../../components/ui/PersonPill';

interface Props {
  open: boolean;
  onClose: () => void;
  row: LeaderboardRow<MarketingMetrics | SupportMetrics> | null;
  role: PerformanceRole;
  median: number;
}

export default function PerformerDetailDrawer({
  open,
  onClose,
  row,
  role,
  median,
}: Props) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 620,
          maxWidth: '100vw',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {row && (
        <>
          {/* Header band */}
          <Box
            sx={{
              position: 'relative',
              background: tokens.gradients.darkSurface,
              color: '#fff',
              px: 3,
              pt: 2.25,
              pb: 2.5,
              overflow: 'hidden',
              borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: tokens.gradients.pinkBlue,
              }}
            />
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                {getInitials(row.user.name)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#fff', 0.7),
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                  }}
                >
                  RANK #{row.rank} · {role.toUpperCase()}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                  {row.user.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#fff', 0.7) }}
                >
                  {row.user.email}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: '#fff',
                  bgcolor: alpha('#fff', 0.1),
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconX size={18} />
              </IconButton>
            </Stack>
          </Box>

          {/* Score summary */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'baseline',
              gap: 2,
              borderBottom: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography
              sx={{
                fontSize: '3rem',
                fontWeight: 900,
                lineHeight: 1,
                color: tokens.colors.pinkDark,
              }}
            >
              {row.score}
            </Typography>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: tokens.colors.lightTextSecondary,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.66rem',
                  display: 'block',
                }}
              >
                Total points
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                Team median: <strong>{median}</strong>
                {row.score > median
                  ? ` · +${(row.score - median).toFixed(2)} above`
                  : row.score < median
                    ? ` · −${(median - row.score).toFixed(2)} below`
                    : ' · exactly at median'}
              </Typography>
              {row.rawTotal < 0 && (
                <Typography
                  variant="caption"
                  sx={{ color: '#B45309', fontWeight: 600 }}
                >
                  Raw total was {row.rawTotal} — floored to 0 per policy.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Breakdown */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.66rem',
                display: 'block',
                mb: 1,
              }}
            >
              Breakdown
            </Typography>
            <Stack spacing={0.5}>
              {row.breakdown.map((line) => (
                <BreakdownRow key={line.key} line={line} />
              ))}
              <Divider sx={{ my: 1 }} />
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ px: 1.5, py: 0.5 }}
              >
                <Typography fontWeight={800}>Total</Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    color: tokens.colors.pinkDark,
                  }}
                >
                  {row.score}
                </Typography>
              </Stack>
            </Stack>

            {/* Fairness hint */}
            <Box
              sx={{
                mt: 3,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: alpha(tokens.colors.blue, 0.04),
                border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: tokens.colors.blueDark,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.62rem',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                How this score was built
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>
                Every line above comes from the database — no manual
                adjustments. Weights are set by the super-admin and visible
                to everyone. If the formula changes, it appears here
                immediately and the audit log shows who changed it.
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
}

function BreakdownRow({ line }: { line: ScoreLine }) {
  const positive = line.kind === 'positive';
  const color = positive ? tokens.colors.pinkDark : '#EF4444';
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: alpha(color, line.count > 0 ? 0.04 : 0),
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.12),
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {positive ? <IconPlus size={12} /> : <IconMinus size={12} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
          {line.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.7rem',
          }}
        >
          {line.count} × {line.weight}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 800,
          color,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {line.points > 0 ? '+' : ''}
        {line.points}
      </Typography>
    </Stack>
  );
}
