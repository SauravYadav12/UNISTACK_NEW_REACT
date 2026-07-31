import { Box, CircularProgress, Stack, Typography, alpha } from '@mui/material';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { listQuoMessages } from '../../services/quoApi';
import { QuoMessage } from '../../Interfaces/quo';
import { tokens } from '../../theme/theme';

interface Props {
  conversationId: string;
  ownedNumberE164?: string;
}

export default function MessageThreadPanel({
  conversationId,
  ownedNumberE164,
}: Props) {
  const [messages, setMessages] = useState<QuoMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listQuoMessages({ conversationId, limit: 200 })
      .then((res) => {
        if (!cancelled) setMessages(res.rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (messages.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No messages in this conversation.
      </Typography>
    );
  }
  return (
    <Stack spacing={1}>
      {messages.map((m) => {
        const mine = ownedNumberE164 ? m.from === ownedNumberE164 : m.direction === 'outgoing';
        return (
          <Stack
            key={m._id}
            direction="row"
            justifyContent={mine ? 'flex-end' : 'flex-start'}
          >
            <Box
              sx={{
                maxWidth: '70%',
                p: 1.25,
                px: 1.75,
                borderRadius: 2.5,
                bgcolor: mine
                  ? alpha(tokens.colors.blue, 0.14)
                  : '#F1F5F9',
                border: '1px solid',
                borderColor: mine
                  ? alpha(tokens.colors.blueDark, 0.15)
                  : 'grey.200',
                borderTopRightRadius: mine ? 0.5 : 2.5,
                borderTopLeftRadius: mine ? 2.5 : 0.5,
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: '#0A3555', whiteSpace: 'pre-wrap' }}>
                {m.text || <em>(no text)</em>}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}
              >
                {moment(m.createdAt).format('MMM D, h:mm A')} · {m.status}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
