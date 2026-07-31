import { Box, CircularProgress, Stack, Typography, alpha } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { listQuoMessages } from '../../services/quoApi';
import { QuoMessage } from '../../Interfaces/quo';
import { tokens } from '../../theme/theme';

interface Props {
  conversationId: string;
  ownedNumberE164?: string;
  /**
   * The local `_id` of the QuoPhoneNumber this thread belongs to.
   * Sent to the server alongside conversationId so a thread is scoped
   * to (ownedNumber × conversation) — Quo can hand the same
   * conversationId to messages that landed on different owned numbers,
   * and without this the drawer would merge them.
   */
  phoneNumberId?: string;
}

/**
 * Chat-style thread renderer. Oldest at top, newest at bottom, auto-
 * scrolls to the latest on load — matches every messaging app the
 * user has ever used. Client-side sort so ordering doesn't depend
 * on the server returning ascending/descending.
 */
export default function MessageThreadPanel({
  conversationId,
  ownedNumberE164,
  phoneNumberId,
}: Props) {
  const [messages, setMessages] = useState<QuoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listQuoMessages({ conversationId, phoneNumberId, limit: 200 })
      .then((res) => {
        if (!cancelled) setMessages(res.rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, phoneNumberId]);

  // Sort ascending client-side — makes render order independent of
  // whatever direction the server hands back.
  const sorted = useMemo(
    () =>
      messages.slice().sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  // After render, snap the scroll container to the bottom so the
  // newest message is in view — like opening any chat app.
  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [loading, sorted.length]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (sorted.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No messages in this conversation.
      </Typography>
    );
  }

  // Group consecutive messages by day so we can drop a date pill in
  // between — same convention as iMessage / WhatsApp.
  const rendered: JSX.Element[] = [];
  let lastDay = '';
  for (const m of sorted) {
    const day = moment(m.createdAt).format('YYYY-MM-DD');
    if (day !== lastDay) {
      lastDay = day;
      rendered.push(
        <DayDivider key={`d-${day}`} label={moment(m.createdAt).calendar(null, {
          sameDay: '[Today]',
          lastDay: '[Yesterday]',
          lastWeek: 'dddd',
          sameElse: 'MMM D, YYYY',
        })} />,
      );
    }
    const mine = ownedNumberE164
      ? m.from === ownedNumberE164
      : m.direction === 'outgoing';
    rendered.push(
      <Bubble key={m._id} m={m} mine={mine} />,
    );
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        p: 2,
        maxHeight: 480,
        overflowY: 'auto',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: '#F8FAFC',
        // Subtle chat-window texture — a faint diagonal wash.
        backgroundImage: `linear-gradient(
          135deg,
          ${alpha(tokens.colors.blue, 0.03)} 0%,
          ${alpha(tokens.colors.pink, 0.02)} 100%
        )`,
      }}
    >
      <Stack spacing={0.75}>{rendered}</Stack>
    </Box>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 1.5 }}>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'grey.300' }} />
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'grey.300' }} />
    </Stack>
  );
}

function Bubble({ m, mine }: { m: QuoMessage; mine: boolean }) {
  return (
    <Stack direction="row" justifyContent={mine ? 'flex-end' : 'flex-start'}>
      <Box
        sx={{
          maxWidth: '72%',
          p: 1.25,
          px: 1.75,
          borderRadius: 2.5,
          bgcolor: mine ? alpha(tokens.colors.blue, 0.16) : '#fff',
          border: '1px solid',
          borderColor: mine
            ? alpha(tokens.colors.blueDark, 0.2)
            : 'grey.200',
          // Chat-app style — tail corner on the sender's side.
          borderTopRightRadius: mine ? 4 : 20,
          borderTopLeftRadius: mine ? 20 : 4,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#0A3555',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {m.text || <em>(no text)</em>}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: '0.65rem',
            display: 'block',
            mt: 0.5,
            textAlign: mine ? 'right' : 'left',
          }}
        >
          {moment(m.createdAt).format('h:mm A')}
          {mine && m.status ? ` · ${m.status}` : ''}
        </Typography>
      </Box>
    </Stack>
  );
}
