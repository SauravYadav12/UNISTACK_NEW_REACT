import { Box, Typography, List, ListItem, ListItemText, alpha, Divider } from '@mui/material';
import { IconSparkles, IconMessageQuestion, IconTarget } from '@tabler/icons-react';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';

interface InterviewAiAssistantProps {
  suggestedQuestions?: string[];
  scoringTips?: string[];
  jobTitle?: string;
}

export default function InterviewAiAssistant({
  suggestedQuestions,
  scoringTips,
  jobTitle,
}: InterviewAiAssistantProps) {
  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconSparkles size={18} color={tokens.colors.primary} />
        <Typography variant="h6" fontWeight={600}>
          Interview Assistant
        </Typography>
        <AiBadge />
      </Box>

      {jobTitle && (
        <Typography variant="caption" color="text.secondary" mb={2} display="block">
          Suggestions for: {jobTitle}
        </Typography>
      )}

      {/* Suggested Questions */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <IconMessageQuestion size={14} color={tokens.colors.primary} />
          <Typography variant="body2" fontWeight={600}>
            Suggested Questions
          </Typography>
        </Box>
        {suggestedQuestions?.length ? (
          <List dense disablePadding>
            {suggestedQuestions.map((q, i) => (
              <ListItem
                key={i}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: alpha(tokens.colors.primary, 0.04),
                }}
              >
                <ListItemText
                  primary={q}
                  primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
            AI-suggested questions will appear once a job description is available.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Scoring Tips */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <IconTarget size={14} color={tokens.colors.secondary} />
          <Typography variant="body2" fontWeight={600}>
            Scoring Tips
          </Typography>
        </Box>
        {scoringTips?.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {scoringTips.map((tip, i) => (
              <Typography key={i} variant="body2" color="text.secondary" fontSize="0.8rem">
                {tip}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
            AI scoring tips will be generated based on the candidate profile.
          </Typography>
        )}
      </Box>
    </GlassCard>
  );
}
