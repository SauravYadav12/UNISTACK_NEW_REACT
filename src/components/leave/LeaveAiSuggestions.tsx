import { Box, Typography, Chip, alpha } from '@mui/material';
import { IconCalendarEvent, IconSparkles } from '@tabler/icons-react';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';

interface LeaveAiSuggestionsProps {
  suggestedDates?: string[];
  teamAvailability?: string;
}

export default function LeaveAiSuggestions({ suggestedDates, teamAvailability }: LeaveAiSuggestionsProps) {
  return (
    <GlassCard sx={{ p: 2.5, background: tokens.gradients.aiSubtle }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconSparkles size={16} color={tokens.colors.primary} />
        <Typography variant="body2" fontWeight={600}>
          Leave Suggestions
        </Typography>
        <AiBadge />
      </Box>

      {suggestedDates?.length ? (
        <Box>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Best dates for leave (based on team availability):
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {suggestedDates.map((date) => (
              <Chip
                key={date}
                icon={<IconCalendarEvent size={14} />}
                label={date}
                size="small"
                sx={{
                  bgcolor: alpha(tokens.colors.primary, 0.1),
                  color: tokens.colors.primary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          AI leave suggestions will appear here once team calendar data is available.
        </Typography>
      )}

      {teamAvailability && (
        <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
          {teamAvailability}
        </Typography>
      )}
    </GlassCard>
  );
}
