import { useState } from 'react';
import { Box, TextField, Typography, IconButton, alpha, CircularProgress } from '@mui/material';
import { IconSparkles, IconSend } from '@tabler/icons-react';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';

interface ReportsAiQueryProps {
  onQuery?: (query: string) => Promise<string | void>;
}

export default function ReportsAiQuery({ onQuery }: ReportsAiQueryProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim() || !onQuery) return;
    setLoading(true);
    try {
      const result = await onQuery(query);
      if (result) setResponse(result);
    } catch {
      setResponse('Unable to process query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard sx={{ p: 2.5, background: tokens.gradients.aiSubtle }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconSparkles size={16} color={tokens.colors.primary} />
        <Typography variant="body2" fontWeight={600}>
          Ask AI about Reports
        </Typography>
        <AiBadge />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show interviews this month by status"
          size="small"
          fullWidth
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha('#fff', 0.5),
            },
          }}
        />
        <IconButton
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          sx={{
            bgcolor: tokens.colors.primary,
            color: '#fff',
            '&:hover': { bgcolor: tokens.colors.primaryDark },
            '&:disabled': { bgcolor: alpha(tokens.colors.primary, 0.3), color: '#fff' },
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
        </IconButton>
      </Box>

      {response && (
        <Typography variant="body2" color="text.secondary" mt={1.5} fontSize="0.8rem">
          {response}
        </Typography>
      )}
    </GlassCard>
  );
}
