import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  TextField,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  alpha,
  Paper,
  Divider,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import CustomDrawer from '../drawer/CustomDrawer';
import { tokens } from '../../theme/theme';
import { consultantsList } from '../../services/consultantApi';
import { usersList } from '../../services/authApi';
import { interviewsList } from '../../services/interviewApi';
import { IConsultant, IInterview, InterviewStatus } from '../../Interfaces/types';
import {
  intStatusOptions,
  interviewStatusColors,
} from '../../pages/Marketing/Interviews/interviewValues';
import { dateFormate2, timeFormate } from '../constants';
import PersonPill from '../ui/PersonPill';
import { UserRole } from '../../Interfaces/iUser';

type ReportKind = 'consultant' | 'marketing';
type DaysWindow = 15 | 30 | 60 | 90;

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenInterview?: (i: IInterview) => void;
}

const DAY_OPTIONS: DaysWindow[] = [15, 30, 60, 90];

// Tabs: one "All" pseudo-status + every InterviewStatus. `null` = All.
const TAB_STATUSES: (InterviewStatus | null)[] = [null, ...intStatusOptions];

const shortStatusLabel = (s: InterviewStatus | null) =>
  s === null ? 'All' : s.replace('Interview ', '');

export default function AdditionalReportDrawer({
  open,
  onClose,
  onOpenInterview,
}: Props) {
  const [kind, setKind] = useState<ReportKind>('consultant');
  const [days, setDays] = useState<DaysWindow>(15);
  const [selectedName, setSelectedName] = useState<string>('');
  const [tabStatus, setTabStatus] = useState<InterviewStatus | null>(null);

  // ── Options for the name dropdown ─────────────────────────────────
  const [consultants, setConsultants] = useState<IConsultant[]>([]);
  const [marketingUsers, setMarketingUsers] = useState<
    { name: string; email: string }[]
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // ── Interviews for the current selection ─────────────────────────
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);

  // Load option lists once on first open — they're cheap enough not to
  // refetch each toggle. Marketing set is derived from the user list
  // filtered to anyone with the "marketing" role.
  useEffect(() => {
    if (!open) return;
    if (consultants.length && marketingUsers.length) return;
    let cancelled = false;
    (async () => {
      setOptionsLoading(true);
      try {
        const [cRes, uRes] = await Promise.all([
          consultantsList('limit=5000'),
          usersList('active=true'),
        ]);
        if (cancelled) return;
        setConsultants(cRes.data.data?.results || []);
        const mkt = (uRes.data.users || [])
          .filter((u) => Array.isArray(u.role) && u.role.includes(UserRole.marketing))
          .map((u) => ({
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
          }));
        setMarketingUsers(mkt);
      } catch {
        // Silent — dropdown just stays empty; retry by re-opening drawer.
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, consultants.length, marketingUsers.length]);

  // Reset name when kind flips so we don't leave a stale selection
  // pointing at a person who doesn't exist in the new list.
  useEffect(() => {
    setSelectedName('');
    setInterviews([]);
    setTabStatus(null);
  }, [kind]);

  // Fetch interviews whenever selection + days combo changes.
  useEffect(() => {
    if (!open || !selectedName) {
      setInterviews([]);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setInterviewsLoading(true);
      setInterviewsError(null);
      try {
        // Filter server-side by name (exact case-insensitive match on
        // consultant or marketingPerson). Date-window filtering runs on
        // the client — interviewDate is stored as a formatted string,
        // not a Date, so a Mongo range would need a schema change.
        const field = kind === 'consultant' ? 'consultant' : 'marketingPerson';
        const params = new URLSearchParams();
        params.set('caseInsensitiveFields', field);
        params.set(field, selectedName);
        params.set('limit', '1000');
        const res = await interviewsList(params.toString(), controller.signal);
        if (cancelled) return;
        const rows: IInterview[] = res.data?.data?.results || [];
        // Window filter — anything with `interviewDate` inside the last
        // N days. Rows with no interviewDate are dropped so the report
        // stays interview-count truthful.
        const cutoff = moment().startOf('day').subtract(days, 'days');
        const filtered = rows.filter((r) => {
          if (!r.interviewDate) return false;
          const d = moment(r.interviewDate);
          return d.isValid() && d.isSameOrAfter(cutoff);
        });
        setInterviews(filtered);
      } catch (e) {
        if (!cancelled) {
          setInterviewsError(
            e instanceof Error ? e.message : 'Failed to load interviews',
          );
        }
      } finally {
        if (!cancelled) setInterviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, kind, selectedName, days]);

  const nameOptions = useMemo(() => {
    if (kind === 'consultant') {
      return consultants
        .map((c) => c.consultantName || '')
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }
    return marketingUsers.map((m) => m.name).sort((a, b) => a.localeCompare(b));
  }, [kind, consultants, marketingUsers]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: interviews.length };
    for (const s of intStatusOptions) map[s] = 0;
    for (const i of interviews) {
      const s = i.interviewStatus;
      if (s && s in map) map[s]++;
    }
    return map;
  }, [interviews]);

  const visibleInterviews = useMemo(() => {
    const rows = tabStatus
      ? interviews.filter((i) => i.interviewStatus === tabStatus)
      : interviews;
    return rows.slice().sort((a, b) => {
      const ad = moment(a.interviewDate || '').valueOf() || 0;
      const bd = moment(b.interviewDate || '').valueOf() || 0;
      return bd - ad;
    });
  }, [interviews, tabStatus]);

  const nameFieldLabel = kind === 'consultant' ? 'Consultant' : 'Marketing person';

  const drawerTitle = (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.gradients.pinkBlue,
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.85rem',
        }}
      >
        AR
      </Box>
      <Typography variant="h6" fontWeight={700}>
        Additional Report
      </Typography>
    </Stack>
  );

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      subTitle="Interviews per consultant or marketing person, windowed by day range."
      closeOnOutSideClick
    >
      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        {/* ── Filter form ─────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.200',
            p: 2.5,
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 0.75,
                  }}
                >
                  REPORT BY
                </Typography>
                <ToggleButtonGroup
                  value={kind}
                  exclusive
                  size="small"
                  onChange={(_, v) => v && setKind(v as ReportKind)}
                  sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}
                >
                  <ToggleButton value="consultant">Consultant</ToggleButton>
                  <ToggleButton value="marketing">Marketing</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ flex: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 0.75,
                  }}
                >
                  {nameFieldLabel.toUpperCase()}
                </Typography>
                <Autocomplete
                  size="small"
                  options={nameOptions}
                  value={selectedName || null}
                  onChange={(_, v) => setSelectedName(v || '')}
                  loading={optionsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={`Select ${nameFieldLabel.toLowerCase()}…`}
                    />
                  )}
                />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 0.75,
                  }}
                >
                  WINDOW (DAYS)
                </Typography>
                <ToggleButtonGroup
                  value={days}
                  exclusive
                  size="small"
                  onChange={(_, v) => v && setDays(v as DaysWindow)}
                  sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.75 } }}
                >
                  {DAY_OPTIONS.map((d) => (
                    <ToggleButton key={d} value={d}>
                      {d}d
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* ── Results ─────────────────────────────────────────── */}
        {!selectedName ? (
          <EmptyState message={`Pick a ${nameFieldLabel.toLowerCase()} to run the report.`} />
        ) : interviewsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : interviewsError ? (
          <EmptyState message={interviewsError} tone="error" />
        ) : (
          <>
            {/* Summary strip */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <SummaryTile
                label="Total"
                value={counts.all}
                color={tokens.colors.blueDark}
              />
              {intStatusOptions.map((s) => (
                <SummaryTile
                  key={s}
                  label={shortStatusLabel(s)}
                  value={counts[s] || 0}
                  color={interviewStatusColors[s] || '#94A3B8'}
                />
              ))}
            </Stack>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabStatus ?? 'all'}
                onChange={(_, v) => setTabStatus(v === 'all' ? null : (v as InterviewStatus))}
                variant="scrollable"
                scrollButtons="auto"
              >
                {TAB_STATUSES.map((s) => {
                  const key = s ?? 'all';
                  const c = s ? interviewStatusColors[s] || '#94A3B8' : tokens.colors.blueDark;
                  const count = s ? counts[s] || 0 : counts.all;
                  return (
                    <Tab
                      key={key}
                      value={key}
                      label={
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <span>{shortStatusLabel(s)}</span>
                          <Chip
                            label={count}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: alpha(c, 0.14),
                              color: c,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        </Stack>
                      }
                      sx={{ textTransform: 'none', minHeight: 44 }}
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* List */}
            {visibleInterviews.length === 0 ? (
              <EmptyState
                message={`No ${shortStatusLabel(tabStatus).toLowerCase()} interviews in the last ${days} days.`}
              />
            ) : (
              <Stack spacing={1}>
                {visibleInterviews.map((i) => (
                  <InterviewRow
                    key={i._id || i.intId}
                    interview={i}
                    onOpen={onOpenInterview}
                  />
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </CustomDrawer>
  );
}

// ─────────────────────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(color, 0.25),
        bgcolor: alpha(color, 0.06),
        minWidth: 88,
      }}
    >
      <Typography variant="caption" sx={{ color, fontWeight: 700, letterSpacing: '0.04em' }}>
        {label.toUpperCase()}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );
}

function InterviewRow({
  interview: i,
  onOpen,
}: {
  interview: IInterview;
  onOpen?: (i: IInterview) => void;
}) {
  const color = i.interviewStatus
    ? interviewStatusColors[i.interviewStatus as InterviewStatus] || '#94A3B8'
    : '#94A3B8';
  const date = i.interviewDate ? moment(i.interviewDate).format(dateFormate2) : '—';
  const time = i.interviewTime
    ? moment(i.interviewTime, timeFormate).format(timeFormate)
    : '';
  return (
    <Paper
      elevation={0}
      onClick={() => onOpen?.(i)}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        cursor: onOpen ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': onOpen
          ? {
              borderColor: alpha(color, 0.5),
              boxShadow: `0 2px 12px ${alpha(color, 0.15)}`,
            }
          : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 4,
            alignSelf: 'stretch',
            borderRadius: 1,
            bgcolor: color,
          }}
        />
        <Box sx={{ minWidth: 90 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A3555' }}>
            {i.intId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {i.interviewType || '—'}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ minWidth: 140 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{date}</Typography>
          <Typography variant="caption" color="text.secondary">
            {time || '—'} {i.timeZone ? `· ${i.timeZone}` : ''}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ minWidth: 160, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
            {i.clientName || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {i.jobTitle || '—'}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ minWidth: 130 }}>
          <PersonPill name={i.consultant || '—'} />
          <Typography variant="caption" color="text.secondary" noWrap>
            by {i.marketingPerson || '—'}
          </Typography>
        </Box>
        <Chip
          label={i.interviewStatus ? i.interviewStatus.replace('Interview ', '') : 'N/A'}
          size="small"
          sx={{
            bgcolor: alpha(color, 0.12),
            color,
            fontWeight: 700,
            height: 24,
          }}
        />
      </Stack>
    </Paper>
  );
}

function EmptyState({ message, tone }: { message: string; tone?: 'error' }) {
  const color = tone === 'error' ? '#EF4444' : 'text.secondary';
  return (
    <Box
      sx={{
        py: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'grey.300',
        borderRadius: 3,
      }}
    >
      <Typography color={color} sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}
