import { Box, Typography, LinearProgress, alpha } from '@mui/material';
import { IconSparkles, IconArrowUpRight } from '@tabler/icons-react';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';

interface SalesLeadAiScoringProps {
  score?: number;
  nextActions?: string[];
  confidence?: string;
}

export default function SalesLeadAiScoring({
  score,
  nextActions,
  confidence,
}: SalesLeadAiScoringProps) {
  const displayScore = score ?? 0;

  const getScoreColor = (s: number) => {
    if (s >= 70) return tokens.colors.success;
    if (s >= 40) return tokens.colors.warning;
    return tokens.colors.error;
  };

  const color = getScoreColor(displayScore);

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconSparkles size={16} color={tokens.colors.primary} />
        <Typography variant="body2" fontWeight={600}>
          Lead Score
        </Typography>
        <AiBadge />
      </Box>

      {/* Score bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
          <Typography variant="h3" fontWeight={700} color={color}>
            {displayScore}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            / 100
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={displayScore}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(color, 0.12),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: color,
            },
          }}
        />
        {confidence && (
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {confidence}
          </Typography>
        )}
      </Box>

      {/* Next actions */}
      {nextActions?.length ? (
        <Box>
          <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
            Suggested Next Actions
          </Typography>
          {nextActions.map((action, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 0.5,
              }}
            >
              <IconArrowUpRight size={12} color={tokens.colors.primary} />
              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                {action}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          AI lead scoring will be available once the backend AI service is connected.
        </Typography>
      )}
    </GlassCard>
  );
}
