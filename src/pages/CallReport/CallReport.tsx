import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Tooltip,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import {
  IconRefresh,
  IconSearch,
  IconArrowsRightLeft,
  IconArrowLeft,
  IconArrowRight,
  IconAlertCircle,
  IconCircleFilled,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { tokens } from '../../theme/theme';
import NumberListPanel from '../../components/callReport/NumberListPanel';
import ActivityTimeline from '../../components/callReport/ActivityTimeline';
import CallDetailDrawer, {
  CallDrawerTarget,
} from '../../components/callReport/CallDetailDrawer';
import {
  QuoActivityEvent,
  QuoCall,
  QuoConversationRollup,
  QuoPhoneNumber,
  QuoVoicemail,
} from '../../Interfaces/quo';
import {
  listQuoActivity,
  listQuoPhoneNumbers,
  patchQuoPhoneNumberLabel,
  reconcileQuoPhoneNumber,
  syncQuoPhoneNumbers,
} from '../../services/quoApi';
import { useActivityPoll } from '../../hooks/useActivityPoll';

// ── Range presets ──────────────────────────────────────────────

type RangeKey = 'today' | '7d' | '30d' | 'custom';

function rangeToDates(key: RangeKey): { from?: string; to?: string } {
  const now = moment();
  if (key === 'today') return { from: now.clone().startOf('day').toISOString() };
  if (key === '7d') return { from: now.clone().subtract(7, 'day').toISOString() };
  if (key === '30d')
    return { from: now.clone().subtract(30, 'day').toISOString() };
  return {};
}

// ── Event filter chips ────────────────────────────────────────

type EventFilter = 'all' | 'calls' | 'missed' | 'voicemails' | 'sms';

const MISSED_STATUSES = new Set([
  'missed',
  'no-answer',
  'abandoned',
  'ringing',
]);

function applyEventFilter(events: QuoActivityEvent[], f: EventFilter) {
  if (f === 'all') return events;
  if (f === 'calls') return events.filter((e) => e.kind === 'call');
  if (f === 'voicemails') return events.filter((e) => e.kind === 'voicemail');
  if (f === 'sms') return events.filter((e) => e.kind === 'conversation');
  return events.filter(
    (e) => e.kind === 'call' && MISSED_STATUSES.has(e.data.status),
  );
}

export default function CallReport() {
  // ── State ────────────────────────────────────────────────────
  const [numbers, setNumbers] = useState<QuoPhoneNumber[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');
  const [reconcileBusyId, setReconcileBusyId] = useState<string | null>(null);

  const [range, setRange] = useState<RangeKey>('7d');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [search, setSearch] = useState('');

  const [events, setEvents] = useState<QuoActivityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  const [drawerTarget, setDrawerTarget] = useState<CallDrawerTarget | null>(null);

  // ── Derived ─────────────────────────────────────────────────
  const selectedNumber = useMemo(
    () => numbers.find((n) => n._id === selectedId) || null,
    [numbers, selectedId],
  );

  // Memoize the range → ISO date strings so we don't produce a new
  // `from` / `to` on every render (which would infinitely re-fire
  // the loadEvents useEffect below via changed deps).
  const { from, to } = useMemo(() => rangeToDates(range), [range]);
  const phoneNumberId = selectedId === 'all' ? undefined : selectedId;

  const filteredEvents = useMemo(
    () => applyEventFilter(events, eventFilter),
    [events, eventFilter],
  );

  // Today activity counts per number (drives left-rail badges).
  const todayCounts = useMemo(() => {
    const startOfDay = moment().startOf('day').valueOf();
    const map: Record<string, number> = {};
    for (const e of events) {
      const at = new Date(e.at).getTime();
      if (at < startOfDay) continue;
      const pid =
        e.kind === 'call'
          ? e.data.phoneNumberId
          : e.kind === 'voicemail'
            ? e.data.phoneNumberId
            : e.data.phoneNumberId;
      map[pid] = (map[pid] || 0) + 1;
    }
    return map;
  }, [events]);

  // ── Data loads ──────────────────────────────────────────────

  const loadNumbers = async () => {
    setNumbersLoading(true);
    try {
      const rows = await listQuoPhoneNumbers();
      setNumbers(rows);
    } catch (e) {
      // toastId dedupes so a recurring failure only shows one pill.
      toast.error('Could not load numbers.', { toastId: 'quo-numbers-fail' });
    } finally {
      setNumbersLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await listQuoActivity({
        phoneNumberId,
        from,
        to,
        direction: directionFilter === 'all' ? undefined : directionFilter,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setEvents(res.rows);
      setTotal(res.total);
    } catch (e) {
      toast.error('Could not load activity.', { toastId: 'quo-activity-fail' });
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadNumbers();
  }, []);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumberId, from, to, directionFilter, search, page]);

  // Reset page when filters change.
  useEffect(() => {
    setPage(1);
  }, [phoneNumberId, range, directionFilter, search]);

  // ── Actions ─────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    try {
      const rows = await syncQuoPhoneNumbers();
      setNumbers(rows);
      toast.success(`Synced ${rows.length} numbers from Quo.`);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLabelSave = async (id: string, label: string) => {
    const updated = await patchQuoPhoneNumberLabel(id, label);
    setNumbers((prev) => prev.map((n) => (n._id === id ? updated : n)));
    toast.success('Label saved.');
  };

  const handleReconcile = async (id: string) => {
    setReconcileBusyId(id);
    try {
      const res = await reconcileQuoPhoneNumber(id);
      const total = res.counts.calls + res.counts.messages;
      toast.success(
        total > 0
          ? `Pulled ${res.counts.calls} calls, ${res.counts.messages} messages from Quo.`
          : 'Already up to date.',
      );
      loadEvents();
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Reconcile failed.');
    } finally {
      setReconcileBusyId(null);
    }
  };

  const handleCopyNumber = (n: string) => {
    if (!n) return;
    navigator.clipboard.writeText(n).then(
      () => toast.success('Number copied'),
      () => toast.error('Copy failed'),
    );
  };

  // ── Live poll (30s delta) ────────────────────────────────────

  const { newIds, live } = useActivityPoll({
    enabled: true,
    phoneNumberId,
    from,
    to,
    onArrive: (rows) => {
      setEvents((prev) => {
        // Merge — avoid duplicates by id.
        const seen = new Set<string>();
        const key = (e: QuoActivityEvent) =>
          e.kind === 'call'
            ? `call:${e.data._id}`
            : e.kind === 'voicemail'
              ? `vm:${e.data._id}`
              : `conv:${e.data._id}`;
        for (const e of prev) seen.add(key(e));
        const fresh = rows.filter((r) => !seen.has(key(r)));
        return [...fresh, ...prev];
      });
      setTotal((t) => t + rows.length);
    },
  });

  // ── Render ─────────────────────────────────────────────────

  const summary = useMemo(() => {
    let total = 0;
    let answered = 0;
    let voicemail = 0;
    let sms = 0;
    for (const e of events) {
      if (e.kind === 'call') {
        total++;
        if (!MISSED_STATUSES.has(e.data.status)) answered++;
      } else if (e.kind === 'voicemail') {
        voicemail++;
      } else {
        sms += e.data.count;
      }
    }
    const lastAt = events[0]?.at;
    return { total, answered, voicemail, sms, lastAt };
  }, [events]);

  return (
    <Box sx={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
        }}
      >
        {/* ── Left rail: 25% ── */}
        <Box sx={{ width: '25%', minWidth: 260, maxWidth: 380 }}>
          <NumberListPanel
            numbers={numbers}
            loading={numbersLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSync={handleSync}
            syncing={syncing}
            onLabelSave={handleLabelSave}
            onReconcile={handleReconcile}
            reconcileBusyId={reconcileBusyId}
            todayCounts={todayCounts}
          />
        </Box>

        {/* ── Right pane: 75% ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Sticky header */}
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(tokens.colors.blue, 0.02),
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0 }}>
                {selectedNumber ? (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{
                          fontFamily: 'ui-monospace, monospace',
                          color: '#0A3555',
                        }}
                      >
                        {selectedNumber.e164}
                      </Typography>
                      <Chip
                        label={selectedNumber.label || 'Unlabeled'}
                        size="small"
                        sx={{
                          bgcolor: alpha(tokens.colors.pink, 0.12),
                          color: tokens.colors.pinkDark,
                          fontWeight: 700,
                        }}
                      />
                      {live && (
                        <Tooltip title="Live — auto-refreshing every 30s">
                          <Chip
                            size="small"
                            icon={<IconCircleFilled size={8} color="#10B981" />}
                            label="Live"
                            sx={{
                              bgcolor: alpha('#10B981', 0.12),
                              color: '#065F46',
                              fontWeight: 700,
                              '& .MuiChip-icon': { animation: 'pulse 1.4s ease-in-out infinite' },
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.35 },
                              },
                            }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {summary.total} calls · {summary.answered} answered · {summary.voicemail} voicemails · {summary.sms} sms
                      {summary.lastAt && ` · last activity ${moment(summary.lastAt).fromNow()}`}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#0A3555' }}>
                      All numbers
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Activity across every number on the account.
                    </Typography>
                  </>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                {selectedNumber && (
                  <Tooltip title="Refresh from Quo (fills any missed webhooks)">
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          reconcileBusyId === selectedNumber._id ? (
                            <CircularProgress size={14} />
                          ) : (
                            <IconRefresh size={14} />
                          )
                        }
                        disabled={reconcileBusyId === selectedNumber._id}
                        onClick={() => handleReconcile(selectedNumber._id)}
                      >
                        Refresh from Quo
                      </Button>
                    </span>
                  </Tooltip>
                )}
                <Tooltip title="Reload from mirror">
                  <IconButton onClick={loadEvents} disabled={eventsLoading}>
                    {eventsLoading ? <CircularProgress size={18} /> : <IconRefresh size={18} />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Filter chip row */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ md: 'center' }}
              sx={{ mt: 2 }}
            >
              <ToggleButtonGroup
                value={range}
                exclusive
                size="small"
                onChange={(_, v) => v && setRange(v as RangeKey)}
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5 } }}
              >
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="7d">7d</ToggleButton>
                <ToggleButton value="30d">30d</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={eventFilter}
                exclusive
                size="small"
                onChange={(_, v) => v && setEventFilter(v as EventFilter)}
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5 } }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="calls">Calls</ToggleButton>
                <ToggleButton value="missed">Missed</ToggleButton>
                <ToggleButton value="voicemails">Voicemails</ToggleButton>
                <ToggleButton value="sms">SMS</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={directionFilter}
                exclusive
                size="small"
                onChange={(_, v) => v && setDirectionFilter(v as 'all' | 'incoming' | 'outgoing')}
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.25 } }}
              >
                <ToggleButton value="all">
                  <IconArrowsRightLeft size={14} />
                </ToggleButton>
                <ToggleButton value="incoming">
                  <IconArrowLeft size={14} />&nbsp;In
                </ToggleButton>
                <ToggleButton value="outgoing">
                  <IconArrowRight size={14} />&nbsp;Out
                </ToggleButton>
              </ToggleButtonGroup>

              <TextField
                size="small"
                placeholder="Search counterparty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, maxWidth: 320 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={14} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Box>

          {/* Timeline */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            {eventsLoading && events.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : numbers.length === 0 && !numbersLoading ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 3,
                }}
              >
                <IconAlertCircle
                  size={28}
                  color={tokens.colors.blueDark}
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="h6" fontWeight={700}>
                  No numbers synced yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click <b>Sync</b> in the left rail to pull your owned numbers from Quo.
                </Typography>
              </Box>
            ) : (
              <>
                <ActivityTimeline
                  events={filteredEvents}
                  ownedNumberE164={selectedNumber?.e164}
                  onOpenCall={(c: QuoCall) => setDrawerTarget({ kind: 'call', call: c })}
                  onOpenVoicemail={(v: QuoVoicemail) =>
                    setDrawerTarget({ kind: 'voicemail', voicemail: v })
                  }
                  onOpenConversation={(c: QuoConversationRollup) =>
                    setDrawerTarget({ kind: 'conversation', conv: c })
                  }
                  onCopyNumber={handleCopyNumber}
                  newIds={newIds}
                />

                {total > LIMIT && (
                  <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                      Page {page} of {Math.ceil(total / LIMIT)}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={page * LIMIT >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      <CallDetailDrawer
        target={drawerTarget}
        open={!!drawerTarget}
        onClose={() => setDrawerTarget(null)}
        ownedNumberE164={selectedNumber?.e164}
      />
    </Box>
  );
}
