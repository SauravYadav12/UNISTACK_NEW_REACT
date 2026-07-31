import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import moment from 'moment';
import {
  IconCopy,
  IconPhoneIncoming,
  IconPhoneOutgoing,
  IconPhoneOff,
  IconSparkles,
  IconMessageCircle,
} from '@tabler/icons-react';
import CustomDrawer from '../drawer/CustomDrawer';
import { tokens } from '../../theme/theme';
import { QuoCall, QuoConversationRollup, QuoVoicemail } from '../../Interfaces/quo';
import AudioPlayer from './AudioPlayer';
import MessageThreadPanel from './MessageThreadPanel';
import {
  getQuoCallSummary,
  getQuoCallTranscript,
} from '../../services/quoApi';
import { toast } from 'react-toastify';

export type CallDrawerTarget =
  | { kind: 'call'; call: QuoCall }
  | { kind: 'voicemail'; voicemail: QuoVoicemail }
  | { kind: 'conversation'; conv: QuoConversationRollup };

interface Props {
  target: CallDrawerTarget | null;
  open: boolean;
  onClose: () => void;
  ownedNumberE164?: string;
}

function fmtE164(n: string) {
  const m = n.match(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : n;
}

function fmtDuration(sec?: number) {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m === 0 ? `${s}s` : `${m}m ${s.toString().padStart(2, '0')}s`;
}

const MISSED = new Set(['missed', 'no-answer', 'abandoned', 'ringing']);

export default function CallDetailDrawer({
  target,
  open,
  onClose,
  ownedNumberE164,
}: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ content: string; start: number; end: number; identifier: string; userId?: string }> | null
  >(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const callId = target?.kind === 'call' ? target.call.quoCallId : null;

  useEffect(() => {
    setSummary(null);
    setTranscript(null);
    if (!open || !callId) return;
    let cancelled = false;
    setSummaryLoading(true);
    getQuoCallSummary(callId)
      .then((r) => {
        if (!cancelled && r.status === 'completed') setSummary(r.summary || '');
      })
      .catch(() => {})
      .finally(() => !cancelled && setSummaryLoading(false));
    setTranscriptLoading(true);
    getQuoCallTranscript(callId)
      .then((r) => {
        if (!cancelled && r.status === 'completed') setTranscript(r.dialogue || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setTranscriptLoading(false));
    return () => {
      cancelled = true;
    };
  }, [callId, open]);

  if (!target) {
    return (
      <CustomDrawer open={open} onClose={onClose} title="" closeOnOutSideClick>
        <div />
      </CustomDrawer>
    );
  }

  const title = (() => {
    if (target.kind === 'call') {
      const cp = target.call.participants.find((p) => p !== ownedNumberE164) || '';
      return `Call · ${fmtE164(cp)}`;
    }
    if (target.kind === 'voicemail') {
      return `Voicemail · ${fmtE164(target.voicemail.from)}`;
    }
    const others = new Set<string>();
    for (const p of target.conv.counterparties)
      if (p !== ownedNumberE164) others.add(p);
    for (const arr of target.conv.counterpartiesTo)
      for (const p of arr) if (p !== ownedNumberE164) others.add(p);
    return `Messages · ${fmtE164(Array.from(others)[0] || '')}`;
  })();

  const copy = (n: string) => {
    navigator.clipboard.writeText(n).then(
      () => toast.success('Number copied'),
      () => toast.error('Copy failed'),
    );
  };

  return (
    <CustomDrawer open={open} onClose={onClose} title={title} closeOnOutSideClick>
      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        {target.kind === 'call' && (
          <CallDetail
            call={target.call}
            ownedNumberE164={ownedNumberE164}
            summary={summary}
            summaryLoading={summaryLoading}
            transcript={transcript}
            transcriptLoading={transcriptLoading}
            onCopy={copy}
          />
        )}
        {target.kind === 'voicemail' && (
          <VoicemailDetail voicemail={target.voicemail} onCopy={copy} />
        )}
        {target.kind === 'conversation' && (
          <ConversationDetail
            conv={target.conv}
            ownedNumberE164={ownedNumberE164}
            onCopy={copy}
          />
        )}
      </Stack>
    </CustomDrawer>
  );
}

// ─── Call detail body ──────────────────────────────────────────

function CallDetail({
  call,
  ownedNumberE164,
  summary,
  summaryLoading,
  transcript,
  transcriptLoading,
  onCopy,
}: {
  call: QuoCall;
  ownedNumberE164?: string;
  summary: string | null;
  summaryLoading: boolean;
  transcript:
    | Array<{ content: string; start: number; end: number; identifier: string; userId?: string }>
    | null;
  transcriptLoading: boolean;
  onCopy: (n: string) => void;
}) {
  const cp = call.participants.find((p) => p !== ownedNumberE164) || '';
  const isMissed = MISSED.has(call.status);
  const isOut = call.direction === 'outgoing';
  const color = isMissed ? '#EF4444' : isOut ? '#37B7EA' : '#10B981';
  const Icon = isMissed ? IconPhoneOff : isOut ? IconPhoneOutgoing : IconPhoneIncoming;
  return (
    <>
      {/* Hero strip */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(color, 0.25),
          bgcolor: alpha(color, 0.05),
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alpha(color, 0.14),
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={800}>
                {fmtE164(cp)}
              </Typography>
              <Tooltip title="Copy number">
                <IconButton size="small" onClick={() => onCopy(cp)}>
                  <IconCopy size={14} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={call.status}
                size="small"
                sx={{
                  bgcolor: alpha(color, 0.12),
                  color,
                  fontWeight: 700,
                  height: 22,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {moment(call.createdAt).format('LLL')} · {fmtDuration(call.duration)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {call.hasRecording && (
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
            Recording
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <AudioPlayer kind="recording" callId={call.quoCallId} />
          </Box>
        </Box>
      )}

      {call.hasVoicemail && (
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
            Voicemail
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <AudioPlayer kind="voicemail" callId={call.quoCallId} />
          </Box>
        </Box>
      )}

      <SummarySection loading={summaryLoading} text={summary} />
      <TranscriptSection loading={transcriptLoading} segments={transcript} />

      <Divider />
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
          Metadata
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
          <MetaRow k="Direction" v={call.direction} />
          <MetaRow k="Answered at" v={call.answeredAt ? moment(call.answeredAt).format('LLL') : '—'} />
          <MetaRow k="Completed at" v={call.completedAt ? moment(call.completedAt).format('LLL') : '—'} />
          <MetaRow k="Forwarded from" v={call.forwardedFrom || '—'} />
          <MetaRow k="Forwarded to" v={call.forwardedTo || '—'} />
          <MetaRow k="AI handled" v={call.aiHandled ? 'Yes' : 'No'} />
          <MetaRow k="Call ID" v={call.quoCallId} mono />
        </Stack>
      </Box>
    </>
  );
}

function SummarySection({ loading, text }: { loading: boolean; text: string | null }) {
  if (!loading && !text) return null;
  return (
    <Box>
      <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
        <IconSparkles size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        AI summary
      </Typography>
      <Box
        sx={{
          mt: 0.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(tokens.colors.pink, 0.06),
          border: '1px solid',
          borderColor: alpha(tokens.colors.pink, 0.15),
          fontSize: '0.9rem',
          lineHeight: 1.55,
        }}
      >
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={14} />
            <Typography variant="body2">Fetching summary…</Typography>
          </Stack>
        ) : (
          text
        )}
      </Box>
    </Box>
  );
}

function TranscriptSection({
  loading,
  segments,
}: {
  loading: boolean;
  segments:
    | Array<{ content: string; start: number; end: number; identifier: string; userId?: string }>
    | null;
}) {
  if (!loading && (!segments || segments.length === 0)) return null;
  return (
    <Box>
      <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
        Transcript
      </Typography>
      <Box
        sx={{
          mt: 0.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: '#F8FAFC',
          border: '1px solid',
          borderColor: 'grey.200',
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={14} />
            <Typography variant="body2">Fetching transcript…</Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {segments!.map((s, i) => (
              <Box key={i}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: 'ui-monospace, monospace' }}
                >
                  {s.identifier} · {Math.floor(s.start)}s
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {s.content}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// ─── Voicemail detail body ────────────────────────────────────

function VoicemailDetail({
  voicemail,
  onCopy,
}: {
  voicemail: QuoVoicemail;
  onCopy: (n: string) => void;
}) {
  return (
    <>
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(tokens.colors.pink, 0.25),
          bgcolor: alpha(tokens.colors.pink, 0.05),
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={800}>
                Voicemail from {fmtE164(voicemail.from)}
              </Typography>
              <Tooltip title="Copy number">
                <IconButton size="small" onClick={() => onCopy(voicemail.from)}>
                  <IconCopy size={14} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {moment(voicemail.createdAt).format('LLL')} · {fmtDuration(voicemail.durationSec)}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
          Audio
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <AudioPlayer kind="voicemail" callId={voicemail.quoCallId} />
        </Box>
      </Box>
      {voicemail.transcript && (
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
            Transcript
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#F8FAFC',
              border: '1px solid',
              borderColor: 'grey.200',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            "{voicemail.transcript}"
          </Box>
        </Box>
      )}
    </>
  );
}

// ─── Conversation detail body ─────────────────────────────────

function ConversationDetail({
  conv,
  ownedNumberE164,
  onCopy,
}: {
  conv: QuoConversationRollup;
  ownedNumberE164?: string;
  onCopy: (n: string) => void;
}) {
  const others = new Set<string>();
  for (const p of conv.counterparties)
    if (p !== ownedNumberE164) others.add(p);
  for (const arr of conv.counterpartiesTo)
    for (const p of arr) if (p !== ownedNumberE164) others.add(p);
  const cp = Array.from(others)[0] || '';
  return (
    <>
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(tokens.colors.blue, 0.25),
          bgcolor: alpha(tokens.colors.blue, 0.05),
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alpha(tokens.colors.blue, 0.14),
              color: tokens.colors.blueDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconMessageCircle size={22} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={800}>
                {fmtE164(cp)}
              </Typography>
              <Tooltip title="Copy number">
                <IconButton size="small" onClick={() => onCopy(cp)}>
                  <IconCopy size={14} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {conv.count} message{conv.count === 1 ? '' : 's'} · latest {moment(conv.latestAt).fromNow()}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}>
          Full thread
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <MessageThreadPanel
            conversationId={conv._id}
            ownedNumberE164={ownedNumberE164}
          />
        </Box>
      </Box>
    </>
  );
}

function MetaRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>
        {k}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontFamily: mono ? 'ui-monospace, monospace' : undefined,
        }}
      >
        {v}
      </Typography>
    </Stack>
  );
}
