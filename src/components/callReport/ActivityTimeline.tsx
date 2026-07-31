import { Box, Stack, Typography, alpha, Chip, Tooltip } from '@mui/material';
import moment from 'moment';
import {
  IconPhoneCall,
  IconPhoneIncoming,
  IconPhoneOutgoing,
  IconPhoneOff,
  IconPlayerPlay,
  IconMicrophone,
  IconMessageCircle,
  IconCopy,
  IconSparkles,
  IconClockPause,
} from '@tabler/icons-react';
import {
  QuoActivityEvent,
  QuoCall,
  QuoConversationRollup,
  QuoVoicemail,
} from '../../Interfaces/quo';
import { tokens } from '../../theme/theme';

interface Props {
  events: QuoActivityEvent[];
  ownedNumberE164?: string; // to highlight the "our" side of a conversation
  onOpenCall: (call: QuoCall) => void;
  onOpenConversation: (conv: QuoConversationRollup) => void;
  onOpenVoicemail: (vm: QuoVoicemail) => void;
  onCopyNumber: (n: string) => void;
  newIds?: Set<string>; // ids that just arrived via poll — brief highlight
}

function fmtDuration(sec?: number) {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function fmtE164(n?: string) {
  if (!n) return '';
  const m = n.match(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : n;
}

const MISSED_STATUSES = new Set([
  'missed',
  'no-answer',
  'abandoned',
  'ringing',
]);

export default function ActivityTimeline({
  events,
  ownedNumberE164,
  onOpenCall,
  onOpenConversation,
  onOpenVoicemail,
  onCopyNumber,
  newIds,
}: Props) {
  if (events.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          px: 4,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'grey.300',
          borderRadius: 3,
          bgcolor: alpha(tokens.colors.blue, 0.02),
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: '#0A3555' }}>
          Nothing here yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No calls, voicemails, or messages in the selected window.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.25}>
      {events.map((e) => {
        const isNew = newIds?.has(eventKey(e));
        if (e.kind === 'call') {
          return (
            <CallCard
              key={eventKey(e)}
              call={e.data}
              ownedNumberE164={ownedNumberE164}
              onOpen={onOpenCall}
              onCopyNumber={onCopyNumber}
              highlight={isNew}
            />
          );
        }
        if (e.kind === 'voicemail') {
          return (
            <VoicemailCard
              key={eventKey(e)}
              voicemail={e.data}
              onOpen={onOpenVoicemail}
              onCopyNumber={onCopyNumber}
              highlight={isNew}
            />
          );
        }
        return (
          <ConversationCard
            key={eventKey(e)}
            conv={e.data}
            ownedNumberE164={ownedNumberE164}
            onOpen={onOpenConversation}
            onCopyNumber={onCopyNumber}
            highlight={isNew}
          />
        );
      })}
    </Stack>
  );
}

function eventKey(e: QuoActivityEvent) {
  if (e.kind === 'call') return `call:${e.data._id}`;
  if (e.kind === 'voicemail') return `vm:${e.data._id}`;
  return `conv:${e.data._id}`;
}

// ─── Card: call ─────────────────────────────────────────────────

function CallCard({
  call,
  ownedNumberE164,
  onOpen,
  onCopyNumber,
  highlight,
}: {
  call: QuoCall;
  ownedNumberE164?: string;
  onOpen: (c: QuoCall) => void;
  onCopyNumber: (n: string) => void;
  highlight?: boolean;
}) {
  const counterparty = call.participants.find((p) => p !== ownedNumberE164) ||
    call.participants[0] || '';
  const isMissed = MISSED_STATUSES.has(call.status);
  const isOutgoing = call.direction === 'outgoing';
  const color = isMissed
    ? '#EF4444'
    : isOutgoing
      ? '#37B7EA'
      : '#10B981';
  const icon = isMissed ? (
    <IconPhoneOff size={16} />
  ) : isOutgoing ? (
    <IconPhoneOutgoing size={16} />
  ) : (
    <IconPhoneIncoming size={16} />
  );

  return (
    <BaseCard
      color={color}
      leftBorderColor={isMissed ? '#EF4444' : undefined}
      onClick={() => onOpen(call)}
      highlight={highlight}
    >
      <Box sx={{ minWidth: 40, textAlign: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(color, 0.14),
            color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
            {fmtE164(counterparty)}
          </Typography>
          <Chip
            label={call.status}
            size="small"
            sx={{
              bgcolor: alpha(color, 0.12),
              color,
              fontWeight: 700,
              height: 20,
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          />
          {call.aiHandled && (
            <Chip
              icon={<IconSparkles size={12} />}
              label="AI"
              size="small"
              sx={{
                bgcolor: alpha(tokens.colors.pink, 0.15),
                color: tokens.colors.pinkDark,
                fontWeight: 700,
                height: 20,
                fontSize: '0.65rem',
              }}
            />
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ mt: 0.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {moment(call.createdAt).fromNow()} · {moment(call.createdAt).format('MMM D, h:mm A')}
          </Typography>
          {call.duration != null && (
            <Typography variant="caption" color="text.secondary">
              · {fmtDuration(call.duration)}
            </Typography>
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ mt: 1 }}
          flexWrap="wrap"
          useFlexGap
        >
          {call.hasRecording && (
            <ActionChip
              icon={<IconPlayerPlay size={12} />}
              label="Play recording"
              tone={tokens.colors.blueDark}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(call);
              }}
            />
          )}
          {call.hasVoicemail && (
            <ActionChip
              icon={<IconMicrophone size={12} />}
              label="Voicemail"
              tone={tokens.colors.pinkDark}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(call);
              }}
            />
          )}
          {call.summary && (
            <ActionChip
              icon={<IconSparkles size={12} />}
              label="AI summary"
              tone={tokens.colors.pinkDark}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(call);
              }}
            />
          )}
          <ActionChip
            icon={<IconCopy size={12} />}
            label="Copy number"
            tone="#5A6A85"
            onClick={(e) => {
              e.stopPropagation();
              onCopyNumber(counterparty);
            }}
          />
        </Stack>
      </Box>
    </BaseCard>
  );
}

// ─── Card: voicemail ────────────────────────────────────────────

function VoicemailCard({
  voicemail,
  onOpen,
  onCopyNumber,
  highlight,
}: {
  voicemail: QuoVoicemail;
  onOpen: (v: QuoVoicemail) => void;
  onCopyNumber: (n: string) => void;
  highlight?: boolean;
}) {
  return (
    <BaseCard
      color={tokens.colors.pinkDark}
      leftBorderColor={tokens.colors.pinkDark}
      onClick={() => onOpen(voicemail)}
      highlight={highlight}
    >
      <Box sx={{ minWidth: 40, textAlign: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(tokens.colors.pink, 0.14),
            color: tokens.colors.pinkDark,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconMicrophone size={16} />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
            Voicemail from {fmtE164(voicemail.from)}
          </Typography>
          {voicemail.status === 'in-progress' && (
            <Chip
              icon={<IconClockPause size={12} />}
              label="transcribing"
              size="small"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
          {voicemail.durationSec && (
            <Typography variant="caption" color="text.secondary">
              · {fmtDuration(voicemail.durationSec)}
            </Typography>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {moment(voicemail.createdAt).fromNow()} · {moment(voicemail.createdAt).format('MMM D, h:mm A')}
        </Typography>
        {voicemail.transcript && (
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: alpha(tokens.colors.pink, 0.06),
              border: '1px solid',
              borderColor: alpha(tokens.colors.pink, 0.15),
              borderRadius: 2,
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#0A3555',
              fontStyle: 'italic',
            }}
          >
            "{voicemail.transcript}"
          </Box>
        )}
        <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
          <ActionChip
            icon={<IconPlayerPlay size={12} />}
            label="Play voicemail"
            tone={tokens.colors.pinkDark}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(voicemail);
            }}
          />
          <ActionChip
            icon={<IconCopy size={12} />}
            label="Copy number"
            tone="#5A6A85"
            onClick={(e) => {
              e.stopPropagation();
              onCopyNumber(voicemail.from);
            }}
          />
        </Stack>
      </Box>
    </BaseCard>
  );
}

// ─── Card: rolled-up conversation ──────────────────────────────

function ConversationCard({
  conv,
  ownedNumberE164,
  onOpen,
  onCopyNumber,
  highlight,
}: {
  conv: QuoConversationRollup;
  ownedNumberE164?: string;
  onOpen: (c: QuoConversationRollup) => void;
  onCopyNumber: (n: string) => void;
  highlight?: boolean;
}) {
  const others = new Set<string>();
  for (const p of conv.counterparties) if (p !== ownedNumberE164) others.add(p);
  for (const arr of conv.counterpartiesTo)
    for (const p of arr) if (p !== ownedNumberE164) others.add(p);
  const counterparty = Array.from(others)[0] || '';

  return (
    <BaseCard
      color={tokens.colors.blueDark}
      onClick={() => onOpen(conv)}
      highlight={highlight}
    >
      <Box sx={{ minWidth: 40, textAlign: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(tokens.colors.blue, 0.14),
            color: tokens.colors.blueDark,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconMessageCircle size={16} />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
            {fmtE164(counterparty)}
          </Typography>
          <Chip
            label={`${conv.count} msg${conv.count === 1 ? '' : 's'}`}
            size="small"
            sx={{
              bgcolor: alpha(tokens.colors.blue, 0.14),
              color: tokens.colors.blueDark,
              fontWeight: 700,
              height: 20,
              fontSize: '0.68rem',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {moment(conv.latestAt).fromNow()}
          </Typography>
        </Stack>
        <Typography
          sx={{
            mt: 0.5,
            fontSize: '0.85rem',
            color: '#5A6A85',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {conv.latestDirection === 'outgoing' ? 'You: ' : ''}
          {conv.latestText || '(no text)'}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
          <ActionChip
            icon={<IconMessageCircle size={12} />}
            label="Open thread"
            tone={tokens.colors.blueDark}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(conv);
            }}
          />
          <ActionChip
            icon={<IconCopy size={12} />}
            label="Copy number"
            tone="#5A6A85"
            onClick={(e) => {
              e.stopPropagation();
              onCopyNumber(counterparty);
            }}
          />
        </Stack>
      </Box>
    </BaseCard>
  );
}

// ─── Shared building blocks ────────────────────────────────────

function BaseCard({
  color,
  leftBorderColor,
  onClick,
  highlight,
  children,
}: {
  color: string;
  leftBorderColor?: string;
  onClick: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: 1.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'grey.200',
        borderLeftWidth: leftBorderColor ? 4 : 1,
        borderLeftColor: leftBorderColor || 'grey.200',
        bgcolor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: highlight ? `2px solid ${alpha(color, 0.5)}` : 'none',
        outlineOffset: highlight ? '2px' : 0,
        '&:hover': {
          borderColor: alpha(color, 0.5),
          boxShadow: `0 4px 14px ${alpha(color, 0.12)}`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      {children}
    </Box>
  );
}

function ActionChip({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Tooltip title={label}>
      <Box
        onClick={onClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.875,
          py: 0.375,
          borderRadius: 1.25,
          border: '1px solid',
          borderColor: alpha(tone, 0.25),
          bgcolor: alpha(tone, 0.06),
          color: tone,
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          '&:hover': { bgcolor: alpha(tone, 0.12) },
        }}
      >
        {icon}
        <span>{label}</span>
      </Box>
    </Tooltip>
  );
}

// Re-export the icon that call-site want without importing tabler
// twice — avoids un-used-import warnings if only some card kinds
// are used.
export { IconPhoneCall };
