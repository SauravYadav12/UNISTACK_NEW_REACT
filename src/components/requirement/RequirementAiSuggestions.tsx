import { Box, Typography, Chip, alpha } from '@mui/material';
import { IconSparkles, IconAlertCircle } from '@tabler/icons-react';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';

interface Suggestion {
  field: string;
  message: string;
}

interface RequirementAiSuggestionsProps {
  suggestions?: Suggestion[];
  duplicateWarning?: string;
}

export default function RequirementAiSuggestions({
  suggestions,
  duplicateWarning,
}: RequirementAiSuggestionsProps) {
  if (!suggestions?.length && !duplicateWarning) return null;

  return (
    <GlassCard sx={{ p: 2, mb: 2, background: tokens.gradients.aiSubtle }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <IconSparkles size={16} color={tokens.colors.primary} />
        <Typography variant="body2" fontWeight={600}>
          AI Suggestions
        </Typography>
        <AiBadge />
      </Box>

      {duplicateWarning && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.warning, 0.1),
          }}
        >
          <IconAlertCircle size={16} color={tokens.colors.warning} />
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
            {duplicateWarning}
          </Typography>
        </Box>
      )}

      {suggestions?.map((s, i) => (
        <Box key={i} sx={{ mb: 0.75 }}>
          <Chip
            label={`${s.field}: ${s.message}`}
            size="small"
            sx={{
              bgcolor: alpha(tokens.colors.primary, 0.08),
              color: 'text.secondary',
              fontSize: '0.75rem',
              height: 'auto',
              py: 0.5,
              '& .MuiChip-label': { whiteSpace: 'normal' },
            }}
          />
        </Box>
      ))}
    </GlassCard>
  );
}
