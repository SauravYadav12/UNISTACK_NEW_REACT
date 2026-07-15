/**
 * Employee Pulse — per-employee activity dashboard with side-by-side compare.
 *
 * Single-page layout with a sticky header (employee picker, date range,
 * filter drawer trigger) followed by six stacked sections:
 *   1. KPI ribbon (score + counts + sparkline per employee)
 *   2. Activity heatmap stack (GitHub-style contribution grid per employee)
 *   3. Today's chronological timeline (only rendered when range = today)
 *   4. Unified activity feed (reverse-chrono, filterable)
 *   5. Metric comparison table (visible with ≥2 employees)
 *   6. Position / Tech trend chart (multi-line, independent of picker)
 *
 * All data comes from a single GET /employee-pulse call so the page
 * renders on one round-trip. Filter + picker + range state is persisted
 * to the URL so the view is shareable.
 */
import {
  Alert,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconAdjustmentsHorizontal,
  IconArrowDown,
  IconArrowUp,
  IconBolt,
  IconChartLine,
  IconFilter,
  IconGauge,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconTrophy,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { tokens } from '../../theme/theme';
import {
  getEmployeePulse,
  getStatusDrilldown,
  listPulseEmployees,
} from '../../services/employeePulseApi';
import type {
  PulseBucket,
  PulseBundle,
  PulseEmployeeRow,
  PulseGroupBy,
  PulseKpi,
  PulseMetric,
  PulseProactivity,
  PulseReqFilter,
  PulseStatusDrilldownReq,
} from '../../Interfaces/employeePulse';

// ─── Constants ─────────────────────────────────────────────────────

const MAX_USERS = 4;

type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';

const PRESET_LABELS: Record<Preset, string> = {
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  custom: 'Custom',
};

// Rotating palette used to distinguish employees in charts + heatmap
// borders. Order matches the picker order so an employee's identity
// stays visually consistent across sections.
const EMPLOYEE_COLORS = ['#EC4599', '#37B7EA', '#F59E0B', '#10B981'];


// ─── Stat catalog for the KPI card ───────────────────────────────
// The card shows 4 stats out of this set. Super-admin picks which 4;
// selection persists in localStorage under LS_STATS_KEY.
//
// Each entry: id (persisted key), label (shown on card + picker),
// extractor (reads the value from a PulseKpi), and highlight (green
// tint for positive-outcome metrics like offers).

interface StatDef {
  id: string;
  label: string;
  group: 'Status' | 'Activity' | 'Streak';
  extract: (k: PulseKpi) => number;
  highlight?: boolean;
  /**
   * Raw server-facing status name (must match the reqStatus enum
   * exactly). Present only for Status-group stats — powers the
   * drilldown drawer's server call.
   */
  statusKey?: string;
}

const STAT_CATALOG: StatDef[] = [
  { id: 'status.newWorking', label: 'New Working', group: 'Status', statusKey: 'New Working', extract: (k) => k.statusCounts?.['New Working'] || 0 },
  { id: 'status.submissionInProgress', label: 'In progress', group: 'Status', statusKey: 'Submission in progress', extract: (k) => k.statusCounts?.['Submission in progress'] || 0 },
  { id: 'status.submitted', label: 'Submitted', group: 'Status', statusKey: 'Submitted', extract: (k) => k.statusCounts?.['Submitted'] || 0 },
  { id: 'status.interviewed', label: 'Interviewed', group: 'Status', statusKey: 'Interviewed', extract: (k) => k.statusCounts?.['Interviewed'] || 0 },
  { id: 'status.projectActive', label: 'Project Active', group: 'Status', statusKey: 'Project Active', extract: (k) => k.statusCounts?.['Project Active'] || 0, highlight: true },
  { id: 'status.projectInactive', label: 'Project Inactive', group: 'Status', statusKey: 'Project Inactive', extract: (k) => k.statusCounts?.['Project Inactive'] || 0 },
  { id: 'status.cancelled', label: 'Cancelled', group: 'Status', statusKey: 'Cancelled', extract: (k) => k.statusCounts?.['Cancelled'] || 0 },
  { id: 'activity.submissions', label: 'Submissions (window)', group: 'Activity', extract: (k) => k.submissions },
  { id: 'activity.interviewsConfirmed', label: 'Confirmed (window)', group: 'Activity', extract: (k) => k.interviewsConfirmed },
  { id: 'activity.interviewsCompleted', label: 'Completed (window)', group: 'Activity', extract: (k) => k.interviewsCompleted },
  { id: 'activity.offers', label: 'Offers', group: 'Activity', extract: (k) => k.offers, highlight: true },
  { id: 'streak.activeDay', label: 'Active-day streak', group: 'Streak', extract: (k) => k.activeDayStreak },
];

const LS_STATS_KEY = 'employeePulse.selectedStats.v1';
const DEFAULT_STATS: string[] = [
  'status.submissionInProgress',
  'status.submitted',
  'status.interviewed',
  'activity.offers',
];
const MAX_STATS = 4;

function loadSelectedStats(): string[] {
  try {
    const raw = localStorage.getItem(LS_STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((s) => typeof s === 'string'))
      return DEFAULT_STATS;
    // Silently drop ids that no longer exist in the catalog (e.g. after
    // a rename in a future release) so we don't crash extracting.
    const valid = parsed.filter((id) =>
      STAT_CATALOG.some((s) => s.id === id),
    );
    return valid.length ? valid.slice(0, MAX_STATS) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

function saveSelectedStats(ids: string[]): void {
  try {
    localStorage.setItem(LS_STATS_KEY, JSON.stringify(ids));
  } catch {
    // Full localStorage / privacy mode — silent.
  }
}

// ─── Filter drawer catalog ───────────────────────────────────────
// Structured schema for the form-builder: pick section → field →
// value. Field type drives the input kind (text/dropdown/date/number/
// multichip).

type FilterFieldType = 'text' | 'select' | 'multichip' | 'number' | 'date';
interface FilterFieldDef {
  key: keyof PulseReqFilter;
  label: string;
  type: FilterFieldType;
  options?: string[]; // for select / multichip
  hint?: string;
}
interface FilterSectionDef {
  label: string;
  fields: FilterFieldDef[];
}

const REQ_STATUS_OPTS = [
  'New Working',
  'Submission in progress',
  'Submitted',
  'Interviewed',
  'Project Active',
  'Project Inactive',
  'Cancelled',
];
const STAR_COLOR_OPTS = ['none', 'green', 'yellow', 'orange'];
const YES_NO_OPTS = ['yes', 'no'];

const FILTER_SECTIONS: FilterSectionDef[] = [
  {
    label: 'Ownership',
    fields: [
      { key: 'assignedToRef', label: 'Assigned to (marketer)', type: 'select', options: [] },
      { key: 'reqEnteredByRef', label: 'Entered by (support)', type: 'select', options: [] },
      { key: 'recordOwner', label: 'Record owner', type: 'text' },
    ],
  },
  {
    label: 'Status',
    fields: [
      { key: 'reqStatus', label: 'Req status', type: 'multichip', options: REQ_STATUS_OPTS },
      { key: 'starColor', label: 'Star colour', type: 'multichip', options: STAR_COLOR_OPTS },
      { key: 'isDuplicate', label: 'Is duplicate', type: 'select', options: YES_NO_OPTS },
    ],
  },
  {
    label: 'Job',
    fields: [
      { key: 'jobTitle', label: 'Job title', type: 'text', hint: 'contains' },
      { key: 'employementType', label: 'Employment type', type: 'multichip', options: ['W2', 'C2C', '1099', 'Full-time', 'Contract'] },
      { key: 'primaryTech', label: 'Primary tech', type: 'text', hint: 'contains' },
      { key: 'secondaryTech', label: 'Secondary tech', type: 'text', hint: 'contains' },
      { key: 'primaryTechStack', label: 'Tech stack', type: 'text', hint: 'contains' },
      { key: 'gotOnResume', label: 'Got on resume', type: 'text' },
    ],
  },
  {
    label: 'Commercial',
    fields: [
      { key: 'rateMin', label: 'Rate min', type: 'number' },
      { key: 'rateMax', label: 'Rate max', type: 'number' },
      { key: 'taxType', label: 'Tax type', type: 'multichip', options: ['W2', 'C2C', '1099'] },
      { key: 'remote', label: 'Remote', type: 'multichip', options: ['Remote', 'Onsite', 'Hybrid'] },
      { key: 'duration', label: 'Duration', type: 'multichip', options: ['3 months', '6 months', '12 months', '12+ months'] },
    ],
  },
  {
    label: 'Client',
    fields: [
      { key: 'clientCompany', label: 'Company', type: 'text' },
      { key: 'clientPerson', label: 'Person', type: 'text' },
      { key: 'clientEmail', label: 'Email', type: 'text' },
      { key: 'clientPhone', label: 'Phone', type: 'text' },
      { key: 'clientWebsite', label: 'Website', type: 'text' },
      { key: 'clientAddress', label: 'Address', type: 'text' },
    ],
  },
  {
    label: 'Prime Vendor',
    fields: [
      { key: 'primeVendorCompany', label: 'Company', type: 'text' },
      { key: 'primeVendorName', label: 'Name', type: 'text' },
      { key: 'primeVendorEmail', label: 'Email', type: 'text' },
      { key: 'primeVendorPhone', label: 'Phone', type: 'text' },
      { key: 'primeVendorWebsite', label: 'Website', type: 'text' },
    ],
  },
  {
    label: 'Vendor',
    fields: [
      { key: 'vendorCompany', label: 'Company', type: 'text' },
      { key: 'vendorPersonName', label: 'Name', type: 'text' },
      { key: 'vendorEmail', label: 'Email', type: 'text' },
      { key: 'vendorPhone', label: 'Phone', type: 'text' },
      { key: 'vendorWebsite', label: 'Website', type: 'text' },
    ],
  },
  {
    label: 'Source & meta',
    fields: [
      { key: 'gotReqFrom', label: 'Got req from', type: 'text' },
      { key: 'jobPortalLink', label: 'Job portal link', type: 'text' },
      { key: 'parentReqID', label: 'Parent reqID', type: 'text' },
      { key: 'childSuffix', label: 'Child suffix', type: 'text' },
      { key: 'reqEnteredFrom', label: 'Req entered from', type: 'date' },
      { key: 'reqEnteredTo', label: 'Req entered to', type: 'date' },
    ],
  },
];

function findFieldDef(key: string): {
  section: FilterSectionDef;
  field: FilterFieldDef;
} | null {
  for (const section of FILTER_SECTIONS) {
    for (const field of section.fields) {
      if (field.key === key) return { section, field };
    }
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────

function computeRange(
  preset: Preset,
  custom?: { from: string; to: string },
): { from: string; to: string } {
  const today = moment().startOf('day');
  switch (preset) {
    case 'today':
      return {
        from: today.format('YYYY-MM-DD'),
        to: today.clone().endOf('day').format('YYYY-MM-DD'),
      };
    case '7d':
      return {
        from: today.clone().subtract(6, 'day').format('YYYY-MM-DD'),
        to: today.clone().endOf('day').format('YYYY-MM-DD'),
      };
    case '30d':
      return {
        from: today.clone().subtract(29, 'day').format('YYYY-MM-DD'),
        to: today.clone().endOf('day').format('YYYY-MM-DD'),
      };
    case '90d':
      return {
        from: today.clone().subtract(89, 'day').format('YYYY-MM-DD'),
        to: today.clone().endOf('day').format('YYYY-MM-DD'),
      };
    case 'custom':
      return (
        custom || {
          from: today.clone().subtract(29, 'day').format('YYYY-MM-DD'),
          to: today.clone().endOf('day').format('YYYY-MM-DD'),
        }
      );
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

function urlPersistedParams(params: URLSearchParams): {
  userIds: string[];
  preset: Preset;
  customFrom: string;
  customTo: string;
  groupBy: PulseGroupBy;
  bucket: PulseBucket;
  metric: PulseMetric;
  filter: PulseReqFilter;
} {
  const userIds = (params.get('userIds') || '')
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_USERS);
  const preset = (params.get('preset') as Preset) || '7d';
  const customFrom =
    params.get('customFrom') || moment().subtract(29, 'day').format('YYYY-MM-DD');
  const customTo = params.get('customTo') || moment().format('YYYY-MM-DD');
  const groupBy = (params.get('groupBy') as PulseGroupBy) || 'jobTitle';
  const bucket = (params.get('bucket') as PulseBucket) || 'week';
  const metric = (params.get('metric') as PulseMetric) || 'positions';
  const filter: PulseReqFilter = {};
  // Only keys we intend to persist go through the picker; every other
  // query key is left alone (safe with react-router's URLSearchParams).
  const arrKeys: (keyof PulseReqFilter)[] = [
    'reqStatus',
    'starColor',
    'employementType',
    'taxType',
    'remote',
    'duration',
  ];
  const strKeys: (keyof PulseReqFilter)[] = [
    'assignedToRef',
    'reqEnteredByRef',
    'appliedForRef',
    'recordOwner',
    'isDuplicate',
    'jobTitle',
    'primaryTech',
    'secondaryTech',
    'primaryTechStack',
    'gotOnResume',
    'clientCompany',
    'clientPerson',
    'clientEmail',
    'clientPhone',
    'clientWebsite',
    'clientAddress',
    'primeVendorCompany',
    'primeVendorName',
    'primeVendorEmail',
    'primeVendorPhone',
    'primeVendorWebsite',
    'vendorCompany',
    'vendorPersonName',
    'vendorEmail',
    'vendorPhone',
    'vendorWebsite',
    'gotReqFrom',
    'jobPortalLink',
    'parentReqID',
    'childSuffix',
    'reqEnteredFrom',
    'reqEnteredTo',
  ];
  for (const k of arrKeys) {
    const v = params.get(k);
    if (v) (filter as Record<string, unknown>)[k] = v.split(',').filter(Boolean);
  }
  for (const k of strKeys) {
    const v = params.get(k);
    if (v) (filter as Record<string, unknown>)[k] = v;
  }
  const rateMin = params.get('rateMin');
  const rateMax = params.get('rateMax');
  if (rateMin) filter.rateMin = Number(rateMin);
  if (rateMax) filter.rateMax = Number(rateMax);
  return { userIds, preset, customFrom, customTo, groupBy, bucket, metric, filter };
}

// ─── Root page ────────────────────────────────────────────────────

export default function EmployeePulse() {
  const [params, setParams] = useSearchParams();
  const parsed = urlPersistedParams(params);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(parsed.userIds);
  const [preset, setPreset] = useState<Preset>(parsed.preset);
  const [customFrom, setCustomFrom] = useState(parsed.customFrom);
  const [customTo, setCustomTo] = useState(parsed.customTo);
  const [groupBy, setGroupBy] = useState<PulseGroupBy>(parsed.groupBy);
  const [bucket, setBucket] = useState<PulseBucket>(parsed.bucket);
  const [metric, setMetric] = useState<PulseMetric>(parsed.metric);
  const [reqFilter, setReqFilter] = useState<PulseReqFilter>(parsed.filter);

  const [employees, setEmployees] = useState<PulseEmployeeRow[]>([]);
  const [bundle, setBundle] = useState<PulseBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number>(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState<string[]>(() =>
    loadSelectedStats(),
  );
  const [statPickerOpen, setStatPickerOpen] = useState(false);
  const [drilldownTarget, setDrilldownTarget] = useState<
    { userId: string; statusKey: string; statusLabel: string } | null
  >(null);

  // Employees list — fetched once.
  useEffect(() => {
    listPulseEmployees()
      .then((res) => setEmployees(res.data?.data || []))
      .catch(() => toast.error('Could not load employees list'));
  }, []);

  // Persist state to URL.
  useEffect(() => {
    const p = new URLSearchParams();
    if (selectedUserIds.length) p.set('userIds', selectedUserIds.join(','));
    p.set('preset', preset);
    if (preset === 'custom') {
      p.set('customFrom', customFrom);
      p.set('customTo', customTo);
    }
    p.set('groupBy', groupBy);
    p.set('bucket', bucket);
    p.set('metric', metric);
    for (const [k, v] of Object.entries(reqFilter)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        if (!v.length) continue;
        p.set(k, v.join(','));
      } else {
        p.set(k, String(v));
      }
    }
    setParams(p, { replace: true });
    // setParams is stable from react-router; skip it in the deps to avoid
    // an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserIds, preset, customFrom, customTo, groupBy, bucket, metric, reqFilter]);

  const range = useMemo(
    () => computeRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeePulse({
        userIds: selectedUserIds,
        fromDate: range.from,
        toDate: range.to,
        groupBy,
        bucket,
        metric,
        reqFilter,
      });
      setBundle(res.data?.data || null);
      setLastLoadedAt(Date.now());
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Could not load pulse data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedUserIds, range.from, range.to, groupBy, bucket, metric, reqFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    for (const v of Object.values(reqFilter)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        if (v.length) n++;
      } else {
        n++;
      }
    }
    return n;
  }, [reqFilter]);

  return (
    <Box>
      {/* ── Sticky header ── */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(tokens.colors.blue, 0.1)}`,
          bgcolor: '#fff',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
              }}
            >
              <IconGauge size={22} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Employee Pulse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare up to {MAX_USERS} employees · filter by any requirement
                field
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <EmployeePicker
              employees={employees}
              value={selectedUserIds}
              onChange={setSelectedUserIds}
            />
            <ToggleButtonGroup
              value={preset}
              exclusive
              size="small"
              onChange={(_e, v: Preset | null) => v && setPreset(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none' } }}
            >
              {(Object.keys(PRESET_LABELS) as Preset[]).map((k) => (
                <ToggleButton key={k} value={k}>
                  {PRESET_LABELS[k]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {preset === 'custom' && (
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <TextField
                  size="small"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </Stack>
            )}
            <Badge
              color="secondary"
              badgeContent={activeFilterCount || undefined}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<IconFilter size={16} />}
                onClick={() => setFilterOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                Filters
              </Button>
            </Badge>
            <Tooltip
              title={
                lastLoadedAt
                  ? `Last updated ${moment(lastLoadedAt).fromNow()}`
                  : 'Refresh'
              }
            >
              <IconButton size="small" onClick={() => void load()} disabled={loading}>
                {loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <IconRefresh size={18} />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {activeFilterCount > 0 && (
          <ActiveFilterChips
            filter={reqFilter}
            onRemove={(k) => setReqFilter({ ...reqFilter, [k]: undefined })}
            onClear={() => setReqFilter({})}
          />
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {selectedUserIds.length === 0 && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          Pick 1–{MAX_USERS} employees above to see their activity. The Position
          / Tech trend chart at the bottom still renders across the whole
          organisation while nobody is selected.
        </Alert>
      )}

      {/* Section 1 — KPI ribbon */}
      {bundle && selectedUserIds.length > 0 && (
        <KpiRibbon
          kpis={bundle.kpis}
          users={bundle.users}
          bucket={bucket}
          selectedStats={selectedStats}
          onOpenStatPicker={() => setStatPickerOpen(true)}
          onOpenDrilldown={setDrilldownTarget}
        />
      )}

      {/* Section 2 — Proactivity board */}
      {bundle && (
        <ProactivityBoard
          proactivity={bundle.proactivity}
          selectedUserIds={selectedUserIds}
        />
      )}

      {/* Section 5 — Compare table */}
      {bundle && selectedUserIds.length >= 2 && (
        <MetricCompareTable
          metricsGrid={bundle.metricsGrid}
          users={bundle.users}
        />
      )}

      {/* Section 6 — Trend chart (always) */}
      {bundle && (
        <PositionTrendChart
          trend={bundle.trend}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          bucket={bucket}
          setBucket={setBucket}
          metric={metric}
          setMetric={setMetric}
        />
      )}

      {/* Filter drawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={reqFilter}
        onChange={setReqFilter}
        employees={employees}
      />

      {/* KPI card stat picker */}
      <StatPickerDialog
        open={statPickerOpen}
        onClose={() => setStatPickerOpen(false)}
        value={selectedStats}
        onChange={setSelectedStats}
      />

      {/* KPI status drilldown */}
      <StatDrilldownDrawer
        open={!!drilldownTarget}
        onClose={() => setDrilldownTarget(null)}
        target={drilldownTarget}
        employeeName={
          drilldownTarget
            ? bundle?.users.find((u) => u.userId === drilldownTarget.userId)?.name
            : undefined
        }
        range={range}
        reqFilter={reqFilter}
      />
    </Box>
  );
}

// ─── Employee picker ──────────────────────────────────────────────

function EmployeePicker({
  employees,
  value,
  onChange,
}: {
  employees: PulseEmployeeRow[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const selectedRows = value
    .map((id) => employees.find((e) => e.userId === id))
    .filter(Boolean) as PulseEmployeeRow[];

  return (
    <Autocomplete
      multiple
      size="small"
      sx={{ minWidth: 320, maxWidth: 520 }}
      options={employees}
      getOptionLabel={(o) => o.name}
      value={selectedRows}
      isOptionEqualToValue={(a, b) => a.userId === b.userId}
      onChange={(_e, next) => {
        if (next.length > MAX_USERS) {
          toast.info(`Max ${MAX_USERS} employees`);
          return;
        }
        onChange(next.map((n) => n.userId));
      }}
      renderTags={(rows, getTagProps) =>
        rows.map((row, idx) => {
          const { key, ...rest } = getTagProps({ index: idx });
          return (
            <Chip
              key={key}
              {...rest}
              size="small"
              avatar={
                <Avatar
                  sx={{
                    bgcolor: EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length],
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {initials(row.name)}
                </Avatar>
              }
              label={row.name}
            />
          );
        })
      }
      renderInput={(p) => (
        <TextField
          {...p}
          placeholder={value.length ? '' : `Pick up to ${MAX_USERS} employees`}
        />
      )}
    />
  );
}

// ─── Active filter chip strip ────────────────────────────────────

function ActiveFilterChips({
  filter,
  onRemove,
  onClear,
}: {
  filter: PulseReqFilter;
  onRemove: (key: keyof PulseReqFilter) => void;
  onClear: () => void;
}) {
  const entries = Object.entries(filter).filter(
    ([, v]) =>
      v !== undefined &&
      v !== null &&
      v !== '' &&
      !(Array.isArray(v) && v.length === 0),
  );
  if (!entries.length) return null;
  return (
    <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
      {entries.map(([k, v]) => (
        <Chip
          key={k}
          size="small"
          label={`${k}: ${Array.isArray(v) ? v.join(', ') : v}`}
          onDelete={() => onRemove(k as keyof PulseReqFilter)}
          sx={{
            bgcolor: alpha(tokens.colors.pink, 0.08),
            color: tokens.colors.pinkDark,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      ))}
      <Button
        size="small"
        onClick={onClear}
        startIcon={<IconX size={12} />}
        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11 }}
      >
        Clear all
      </Button>
    </Stack>
  );
}

// ─── Section 1: KPI ribbon ───────────────────────────────────────

function KpiRibbon({
  kpis,
  users,
  bucket,
  selectedStats,
  onOpenStatPicker,
  onOpenDrilldown,
}: {
  kpis: PulseKpi[];
  users: PulseBundle['users'];
  bucket: PulseBucket;
  selectedStats: string[];
  onOpenStatPicker: () => void;
  /** Fires when the user clicks a Status-group stat number. `statusKey`
   *  is the raw server-facing status name (e.g. "Submission in progress"),
   *  `statusLabel` is the friendly display label. */
  onOpenDrilldown: (input: {
    userId: string;
    statusKey: string;
    statusLabel: string;
  }) => void;
}) {
  const userIndex = new Map(users.map((u, i) => [u.userId, i] as const));
  // Resolve the ids back to StatDef instances in the same order the
  // user picked them. Silently drop any id that no longer exists.
  const stats: StatDef[] = selectedStats
    .map((id) => STAT_CATALOG.find((s) => s.id === id))
    .filter(Boolean) as StatDef[];

  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="caption" color="text.secondary">
          {stats.length} of {MAX_STATS} stats shown · click the gear to change
        </Typography>
        <Button
          size="small"
          onClick={onOpenStatPicker}
          startIcon={<IconSettings size={14} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 12,
            color: tokens.colors.pinkDark,
          }}
        >
          Customise stats
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: `repeat(${Math.min(kpis.length, 4)}, 1fr)`,
          },
          gap: 1.5,
        }}
      >
        {kpis.map((k) => {
          const u = users.find((x) => x.userId === k.userId);
          const idx = userIndex.get(k.userId) ?? 0;
          const color = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
          return (
            <Paper
              key={k.userId}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(color, 0.25)}`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: color, fontWeight: 800 }}>
                  {initials(u?.name || '')}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 800, fontSize: '0.95rem' }}
                    noWrap
                  >
                    {u?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {k.role} · streak {k.activeDayStreak}{' '}
                    {k.activeDayStreak === 1 ? 'day' : 'days'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      color: tokens.colors.pinkDark,
                    }}
                  >
                    {k.score}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    score
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.25 }} />

              {stats.length ? (
                <Stack direction="row" spacing={2}>
                  {stats.map((s) => (
                    <Stat
                      key={s.id}
                      label={s.label}
                      value={s.extract(k)}
                      highlight={s.highlight}
                      onClick={
                        s.statusKey
                          ? () =>
                              onOpenDrilldown({
                                userId: k.userId,
                                statusKey: s.statusKey as string,
                                statusLabel: s.label,
                              })
                          : undefined
                      }
                    />
                  ))}
                </Stack>
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', py: 1 }}
                >
                  No stats selected — click <em>Customise stats</em> above.
                </Typography>
              )}

              <Box sx={{ mt: 1 }}>
                <Sparkline data={k.sparkline} color={color} bucket={bucket} />
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

function Stat({
  label,
  value,
  highlight,
  onClick,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick && value > 0;
  return (
    <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
      <Typography
        component={clickable ? 'button' : 'div'}
        onClick={clickable ? onClick : undefined}
        sx={{
          fontWeight: 800,
          fontSize: '1rem',
          color: highlight ? '#10B981' : 'text.primary',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: clickable ? 'pointer' : 'default',
          textDecoration: clickable ? 'underline dotted' : 'none',
          textUnderlineOffset: 3,
          textDecorationColor: clickable
            ? alpha(tokens.colors.pinkDark, 0.5)
            : 'transparent',
          '&:hover': clickable
            ? {
                color: tokens.colors.pinkDark,
                textDecorationColor: tokens.colors.pinkDark,
              }
            : undefined,
        }}
      >
        {value}
      </Typography>
      <Tooltip
        title={
          clickable
            ? `${label} · click to see the requirements`
            : label
        }
        placement="top"
        enterDelay={400}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            fontSize: 11,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
      </Tooltip>
    </Box>
  );
}

function StatPickerDialog({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  // Local buffer so cancel = revert. Ordering matters (left→right on
  // the card follows the selection order), so `value` is an ordered
  // list, not a Set.
  const [buf, setBuf] = useState<string[]>(value);
  useEffect(() => setBuf(value), [value, open]);

  const toggle = (id: string) => {
    if (buf.includes(id)) {
      setBuf(buf.filter((x) => x !== id));
      return;
    }
    if (buf.length >= MAX_STATS) {
      toast.info(`Pick up to ${MAX_STATS} stats`);
      return;
    }
    setBuf([...buf, id]);
  };

  const grouped: Record<string, StatDef[]> = {};
  for (const s of STAT_CATALOG) {
    (grouped[s.group] = grouped[s.group] || []).push(s);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        Customise KPI card stats
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Pick up to {MAX_STATS} stats. Order below controls the left-to-right
          order on the card. Selection is saved to this browser.
        </Typography>
        {buf.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.colors.blueDark }}>
              SELECTED ({buf.length}/{MAX_STATS})
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
              {buf.map((id, i) => {
                const s = STAT_CATALOG.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <Chip
                    key={id}
                    size="small"
                    label={`${i + 1}. ${s.label}`}
                    onDelete={() => setBuf(buf.filter((x) => x !== id))}
                    sx={{
                      bgcolor: tokens.colors.pinkDark,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 11,
                      '& .MuiChip-deleteIcon': { color: alpha('#fff', 0.8) },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
        {Object.entries(grouped).map(([group, items]) => (
          <Box key={group} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: tokens.colors.blueDark,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {group}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
              {items.map((s) => {
                const active = buf.includes(s.id);
                return (
                  <Chip
                    key={s.id}
                    size="small"
                    label={s.label}
                    onClick={() => toggle(s.id)}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      bgcolor: active ? tokens.colors.pinkDark : 'transparent',
                      color: active ? '#fff' : 'text.primary',
                      borderColor: active ? tokens.colors.pinkDark : undefined,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        ))}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
          <Button
            onClick={() => setBuf(DEFAULT_STATS)}
            sx={{ textTransform: 'none' }}
          >
            Reset to default
          </Button>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onChange(buf);
              saveSelectedStats(buf);
              onClose();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: tokens.gradients.pinkBlue,
              '&:hover': { background: alpha(tokens.colors.pinkDark, 0.9) },
            }}
          >
            Save
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function Sparkline({
  data,
  color,
  bucket: _bucket,
}: {
  data: number[];
  color: string;
  bucket: PulseBucket;
}) {
  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    colors: [color],
    tooltip: { enabled: false },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
  };
  return (
    <Chart
      options={options}
      series={[{ name: 'events', data }]}
      type="area"
      height={40}
    />
  );
}


// ─── Status drilldown drawer ─────────────────────────────────────
// Opens when the user clicks a Status-group stat number on a KPI card.
// Fetches `/employee-pulse/status-drilldown` on open with the same
// window + reqFilter the card was computed against so counts + rows
// always agree.

function StatDrilldownDrawer({
  open,
  onClose,
  target,
  employeeName,
  range,
  reqFilter,
}: {
  open: boolean;
  onClose: () => void;
  target: { userId: string; statusKey: string; statusLabel: string } | null;
  employeeName?: string;
  range: { from: string; to: string };
  reqFilter: PulseReqFilter;
}) {
  const [rows, setRows] = useState<PulseStatusDrilldownReq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !target) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);
    getStatusDrilldown({
      userId: target.userId,
      statusKey: target.statusKey,
      fromDate: range.from,
      toDate: range.to,
      reqFilter,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data?.data?.rows || []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || 'Could not load requirements';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, target, range.from, range.to, reqFilter]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 520 }, p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }}>
              {target?.statusLabel || 'Status'} · {employeeName || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {moment(range.from).format('DD MMM')} –{' '}
              {moment(range.to).format('DD MMM YYYY')} · {rows.length}{' '}
              {rows.length === 1 ? 'req' : 'reqs'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <IconX size={16} />
          </IconButton>
        </Stack>

        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={22} />
          </Stack>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && rows.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', py: 4 }}
          >
            No requirements hit this status for this employee in the selected
            window.
          </Typography>
        )}

        <Stack spacing={0.75}>
          {rows.map((r) => (
            <Paper
              key={r.reqID}
              variant="outlined"
              sx={{
                p: 1.25,
                borderRadius: 2,
                borderColor: alpha(tokens.colors.blue, 0.15),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 13,
                        color: tokens.colors.pinkDark,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.reqID}
                    </Typography>
                    <Chip
                      size="small"
                      label={r.reqStatus}
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        height: 20,
                        bgcolor: alpha(tokens.colors.blue, 0.1),
                        color: tokens.colors.blueDark,
                      }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
                    {r.jobTitle}
                    {r.primaryTech ? ` · ${r.primaryTech}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {r.clientCompany || '—'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 700 }}
                    color="text.secondary"
                  >
                    {r.relevantAt
                      ? moment(r.relevantAt).format('DD MMM · HH:mm')
                      : '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.relevantField.replace('_perf', '').replace('At', '')}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {rows.length >= 200 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
          >
            Showing the 200 most-recent · narrow the range or filters to see
            others.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Section 2: Proactivity board ────────────────────────────────
// For each parent requirement entered in the window, rank marketers by
// their first-action time. Two views: per-position (who acted #1/#2/#3
// on each new position) and leaderboard (aggregate first-place counts +
// median time-to-act). The winning "first action" is the first COMMENT
// added on any child of that parent — a marketer who was assigned a
// child but never commented does not count as an actor.

const RANK_STYLE: Record<number, { bg: string; fg: string; label: string }> = {
  0: { bg: '#FEF3C7', fg: '#B45309', label: '🥇' },
  1: { bg: '#E5E7EB', fg: '#374151', label: '🥈' },
  2: { bg: '#FED7AA', fg: '#9A3412', label: '🥉' },
};

function formatT(ms: number): string {
  if (ms < 60_000) return `T+${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `T+${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60_000);
    return m ? `T+${h}h ${m}m` : `T+${h}h`;
  }
  return `T+${Math.round(ms / 86_400_000)}d`;
}

function ProactivityBoard({
  proactivity,
  selectedUserIds,
}: {
  proactivity: PulseProactivity;
  selectedUserIds: string[];
}) {
  const [view, setView] = useState<'positions' | 'leaderboard'>('positions');
  const highlightSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  const totals = proactivity.totals;
  const hasPositions = proactivity.reqs.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(tokens.colors.blue, 0.1)}`,
        mb: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconBolt size={20} color={tokens.colors.pinkDark} />
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Proactivity board</Typography>
            <Typography variant="caption" color="text.secondary">
              Ranks marketers by fastest first comment on a child requirement
              of positions entered in this window. A marketer with no comment
              is not counted.
            </Typography>
          </Box>
        </Stack>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_e, v: 'positions' | 'leaderboard' | null) => v && setView(v)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none' } }}
        >
          <ToggleButton value="positions">Per-position</ToggleButton>
          <ToggleButton value="leaderboard">Leaderboard</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Totals ribbon */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
          mt: 2,
          mb: 2,
        }}
      >
        <TotalTile
          label="Positions entered"
          value={totals.positionsEntered}
          color={tokens.colors.blueDark}
        />
        <TotalTile
          label="Children assigned"
          value={totals.childrenCreated}
          color={tokens.colors.pinkDark}
        />
        <TotalTile
          label="Unclaimed"
          value={totals.unclaimedParents}
          color={totals.unclaimedParents > 0 ? '#DC2626' : '#94A3B8'}
          alert={totals.unclaimedParents > 0}
        />
      </Box>

      {view === 'positions' &&
        (hasPositions ? (
          <ProactivityPositionsTable
            reqs={proactivity.reqs}
            highlightSet={highlightSet}
          />
        ) : (
          <EmptyState
            title="No positions entered in this window yet"
            hint="Widen the range or clear filters to pull in older positions."
          />
        ))}

      {view === 'leaderboard' &&
        (proactivity.leaderboard.length ? (
          <ProactivityLeaderboard
            rows={proactivity.leaderboard}
            highlightSet={highlightSet}
          />
        ) : (
          <EmptyState
            title="Nobody has acted yet"
            hint="Once a marketer creates a child req or drops the first comment on any new position, they show up here."
          />
        ))}
    </Paper>
  );
}

function TotalTile({
  label,
  value,
  color,
  alert,
}: {
  label: string;
  value: number;
  color: string;
  alert?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: alert ? alpha(color, 0.6) : alpha(color, 0.25),
        bgcolor: alert ? alpha(color, 0.06) : 'transparent',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.75rem',
          color,
          lineHeight: 1.1,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    </Box>
  );
}

function ProactivityPositionsTable({
  reqs,
  highlightSet,
}: {
  reqs: PulseProactivity['reqs'];
  highlightSet: Set<string>;
}) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            px: 1.5,
            py: 1.25,
            borderBottom: `1px solid ${alpha(tokens.colors.blue, 0.08)}`,
            textAlign: 'left',
            fontSize: 13,
            verticalAlign: 'top',
          },
          '& th': {
            fontWeight: 700,
            color: 'text.secondary',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          },
        }}
      >
        <thead>
          <tr>
            <th>Position</th>
            <th>Entered</th>
            <th>By</th>
            <th>Actors (ranked)</th>
          </tr>
        </thead>
        <tbody>
          {reqs.map((r) => {
            const unclaimed = r.actors.length === 0;
            return (
              <tr
                key={r.parentReqID}
                style={
                  unclaimed
                    ? {
                        background: alpha('#EF4444', 0.03),
                      }
                    : undefined
                }
              >
                <td>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                    {r.parentReqID}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[r.jobTitle, r.clientCompany].filter(Boolean).join(' @ ') ||
                      '—'}
                  </Typography>
                </td>
                <td>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {moment(r.enteredAt).format('DD MMM · HH:mm')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {moment(r.enteredAt).fromNow()}
                  </Typography>
                </td>
                <td>
                  <Typography variant="caption" sx={{ fontSize: 12 }}>
                    {r.enteredBy.name}
                  </Typography>
                </td>
                <td>
                  {unclaimed ? (
                    <Chip
                      size="small"
                      label="Unclaimed"
                      sx={{
                        bgcolor: alpha('#EF4444', 0.14),
                        color: '#DC2626',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    />
                  ) : (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {r.actors.map((actor, i) => {
                        const rank = RANK_STYLE[i];
                        const highlighted = highlightSet.has(actor.userId);
                        return (
                          <Tooltip
                            key={actor.userId}
                            title={
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: 12 }}>
                                  {actor.name}
                                </Typography>
                                <Typography variant="caption">
                                  First comment on{' '}
                                  {actor.childReqID || 'a child req'}
                                </Typography>
                                <br />
                                <Typography variant="caption">
                                  {moment(actor.firstActionAt).format(
                                    'DD MMM · HH:mm',
                                  )}
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Chip
                              size="small"
                              label={`${rank?.label ? rank.label + ' ' : '#' + (i + 1) + ' '}${actor.name} · ${formatT(actor.msFromEntry)}`}
                              sx={{
                                bgcolor: rank?.bg || alpha(tokens.colors.blue, 0.08),
                                color: rank?.fg || tokens.colors.blueDark,
                                fontWeight: 700,
                                fontSize: 11,
                                border: highlighted
                                  ? `2px solid ${tokens.colors.pinkDark}`
                                  : '2px solid transparent',
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
}

function ProactivityLeaderboard({
  rows,
  highlightSet,
}: {
  rows: PulseProactivity['leaderboard'];
  highlightSet: Set<string>;
}) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${alpha(tokens.colors.blue, 0.08)}`,
            textAlign: 'left',
            fontSize: 13,
          },
          '& th': {
            fontWeight: 700,
            color: 'text.secondary',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          },
        }}
      >
        <thead>
          <tr>
            <th>Rank</th>
            <th>Marketer</th>
            <th>🥇 #1</th>
            <th>🥈 #2</th>
            <th>🥉 #3+</th>
            <th>Total</th>
            <th>Median T+</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const highlighted = highlightSet.has(r.userId);
            return (
              <tr
                key={r.userId}
                style={
                  highlighted
                    ? { background: alpha(tokens.colors.pink, 0.05) }
                    : undefined
                }
              >
                <td>
                  <IconTrophy
                    size={14}
                    color={
                      i === 0
                        ? '#B45309'
                        : i === 1
                          ? '#6B7280'
                          : i === 2
                            ? '#9A3412'
                            : '#CBD5E1'
                    }
                    style={{ verticalAlign: 'middle', marginRight: 4 }}
                  />
                  <strong>{i + 1}</strong>
                </td>
                <td>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 22,
                        height: 22,
                        fontSize: 10,
                        bgcolor: highlighted
                          ? tokens.colors.pinkDark
                          : alpha(tokens.colors.blueDark, 0.6),
                      }}
                    >
                      {initials(r.name)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                      {r.name}
                    </Typography>
                  </Stack>
                </td>
                <td style={{ fontWeight: 700 }}>{r.firstPlaceCount}</td>
                <td>{r.secondPlaceCount}</td>
                <td>{r.thirdOrLaterCount}</td>
                <td>{r.totalActedOn}</td>
                <td>{r.medianMsToAct == null ? '—' : formatT(r.medianMsToAct)}</td>
              </tr>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
}

// ─── Section 5: Compare table ────────────────────────────────────

function MetricCompareTable({
  metricsGrid,
  users,
}: {
  metricsGrid: PulseBundle['metricsGrid'];
  users: PulseBundle['users'];
}) {
  const rows = Object.entries(metricsGrid);
  const highLow = (values: number[]) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { max, min };
  };
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(tokens.colors.blue, 0.1)}`,
        mb: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <IconUsers size={18} color={tokens.colors.blueDark} />
        <Typography sx={{ fontWeight: 800 }}>Head-to-head comparison</Typography>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              px: 1.5,
              py: 1,
              borderBottom: `1px solid ${alpha(tokens.colors.blue, 0.08)}`,
              textAlign: 'left',
              fontSize: 13,
            },
            '& th': { fontWeight: 700, color: 'text.secondary' },
          }}
        >
          <thead>
            <tr>
              <th>Metric</th>
              {users.map((u, i) => (
                <th key={u.userId}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: 10,
                        bgcolor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length],
                      }}
                    >
                      {initials(u.name)}
                    </Avatar>
                    <span>{u.name}</span>
                  </Stack>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([metricKey, perUser]) => {
              const values = users.map((u) => perUser[u.userId] || 0);
              const { max, min } = highLow(values);
              const allSame = max === min;
              return (
                <tr key={metricKey}>
                  <td style={{ fontWeight: 700 }}>{metricKey}</td>
                  {users.map((u) => {
                    const v = perUser[u.userId] || 0;
                    const isTop = !allSame && v === max;
                    const isBot = !allSame && v === min;
                    return (
                      <td
                        key={u.userId}
                        style={{
                          fontWeight: 700,
                          background: isTop
                            ? alpha('#10B981', 0.1)
                            : isBot
                              ? alpha('#EF4444', 0.08)
                              : 'transparent',
                          color: isTop ? '#059669' : isBot ? '#DC2626' : undefined,
                        }}
                      >
                        {v}
                        {isTop && (
                          <IconArrowUp
                            size={12}
                            style={{ marginLeft: 4, verticalAlign: 'middle' }}
                          />
                        )}
                        {isBot && (
                          <IconArrowDown
                            size={12}
                            style={{ marginLeft: 4, verticalAlign: 'middle' }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Section 6: Trend chart ──────────────────────────────────────

const GROUP_BY_LABELS: Record<PulseGroupBy, string> = {
  jobTitle: 'Position',
  primaryTech: 'Primary Tech',
  secondaryTech: 'Secondary Tech',
  primaryTechStack: 'Tech Stack',
  clientCompany: 'Client Company',
  employementType: 'Employment Type',
  taxType: 'Tax Type',
  remote: 'Remote',
};

const BUCKET_LABELS: Record<PulseBucket, string> = {
  day: 'Daily',
  week: 'Weekly',
  biweek: 'Bi-weekly',
  month: 'Monthly',
};

// Order here drives the dropdown order. `positions` (count of reqs
// created in the window) is first so it's the natural default and
// answers the "what came in today" question.
const METRIC_LABELS: Record<PulseMetric, string> = {
  positions: 'Positions entered',
  submissions: 'Submissions',
  interviewsCompleted: 'Interviews completed',
  offers: 'Offers',
  score: 'Composite score',
};

function PositionTrendChart({
  trend,
  groupBy,
  setGroupBy,
  bucket,
  setBucket,
  metric,
  setMetric,
}: {
  trend: PulseBundle['trend'];
  groupBy: PulseGroupBy;
  setGroupBy: (g: PulseGroupBy) => void;
  bucket: PulseBucket;
  setBucket: (b: PulseBucket) => void;
  metric: PulseMetric;
  setMetric: (m: PulseMetric) => void;
}) {
  const [showOverlay, setShowOverlay] = useState(true);

  const series = [
    ...trend.series.map((s) => ({ name: s.name, data: s.data, type: 'line' as const })),
    ...(showOverlay && trend.perEmployeeOverlay?.length
      ? trend.perEmployeeOverlay.map((o, i) => ({
          name: `${o.name} (overlay)`,
          data: o.data,
          type: 'area' as const,
          color: alpha(EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length], 0.35),
        }))
      : []),
  ];

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trend.xAxis.map((d) => moment(d).format('DD MMM')),
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: { labels: { style: { fontSize: '11px' } } },
    legend: { position: 'bottom', fontSize: '12px' },
    grid: { borderColor: alpha(tokens.colors.blue, 0.08) },
    tooltip: { shared: true, intersect: false },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(tokens.colors.blue, 0.1)}`,
        mb: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconChartLine size={18} color={tokens.colors.blueDark} />
          <Typography sx={{ fontWeight: 800 }}>
            Position / Tech trend
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Group by</InputLabel>
            <Select
              label="Group by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as PulseGroupBy)}
            >
              {(Object.keys(GROUP_BY_LABELS) as PulseGroupBy[]).map((k) => (
                <MenuItem key={k} value={k}>
                  {GROUP_BY_LABELS[k]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Bucket</InputLabel>
            <Select
              label="Bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as PulseBucket)}
            >
              {(Object.keys(BUCKET_LABELS) as PulseBucket[]).map((k) => (
                <MenuItem key={k} value={k}>
                  {BUCKET_LABELS[k]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              label="Metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as PulseMetric)}
            >
              {(Object.keys(METRIC_LABELS) as PulseMetric[]).map((k) => (
                <MenuItem key={k} value={k}>
                  {METRIC_LABELS[k]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {trend.perEmployeeOverlay?.length ? (
            <Button
              size="small"
              variant={showOverlay ? 'contained' : 'outlined'}
              onClick={() => setShowOverlay(!showOverlay)}
              sx={{ textTransform: 'none' }}
            >
              {showOverlay ? 'Hide overlay' : 'Show overlay'}
            </Button>
          ) : null}
        </Stack>
      </Stack>
      {trend.truncated && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Showing top 8 of {trend.totalSeries} {GROUP_BY_LABELS[groupBy].toLowerCase()}s
          — narrow with a filter to see others.
        </Typography>
      )}
      {series.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No data in this window.
        </Typography>
      ) : (
        <Chart options={options} series={series} type="line" height={320} />
      )}
    </Paper>
  );
}

// ─── Filter drawer (form-builder) ────────────────────────────────
// User pattern: pick a section → pick a field → enter value → Add.
// Applied filters render below as removable chips grouped by section.
// Apply commits the buffer to the parent so the API refetch happens
// once, not on every field tweak.

function FilterDrawer({
  open,
  onClose,
  value,
  onChange,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  value: PulseReqFilter;
  onChange: (v: PulseReqFilter) => void;
  employees: PulseEmployeeRow[];
}) {
  const [buf, setBuf] = useState<PulseReqFilter>(value);
  useEffect(() => setBuf(value), [value, open]);

  // Selected section + field for the "add filter" row. Reset the field
  // whenever the section changes so we don't display a stale field
  // reference.
  const [pickedSection, setPickedSection] = useState<string>(FILTER_SECTIONS[0].label);
  const [pickedField, setPickedField] = useState<string>('');
  useEffect(() => setPickedField(''), [pickedSection]);

  const currentSection = FILTER_SECTIONS.find((s) => s.label === pickedSection);
  const currentField = currentSection?.fields.find((f) => f.key === pickedField);

  const userOpts = employees.map((e) => ({ id: e.userId, name: e.name }));

  // Value editor state — buffered so Add is atomic. Reset when the
  // selected field changes.
  const [textVal, setTextVal] = useState('');
  const [numVal, setNumVal] = useState('');
  const [selectVal, setSelectVal] = useState('');
  const [multiVal, setMultiVal] = useState<string[]>([]);
  const [userVal, setUserVal] = useState<string>('');
  useEffect(() => {
    setTextVal('');
    setNumVal('');
    setSelectVal('');
    setMultiVal([]);
    setUserVal('');
  }, [pickedField]);

  const canAdd = (() => {
    if (!currentField) return false;
    switch (currentField.type) {
      case 'text':
        return textVal.trim().length > 0;
      case 'number':
        return numVal !== '' && !isNaN(Number(numVal));
      case 'select':
        // 'select' with options.length === 0 is our sentinel for the
        // user-picker (assignedToRef / reqEnteredByRef). Otherwise it's
        // a small enum dropdown.
        return currentField.options && currentField.options.length === 0
          ? userVal !== ''
          : selectVal !== '';
      case 'multichip':
        return multiVal.length > 0;
      case 'date':
        return textVal !== '';
    }
  })();

  const commitAdd = () => {
    if (!currentField) return;
    const patch: Partial<PulseReqFilter> = {};
    switch (currentField.type) {
      case 'text':
        (patch as Record<string, unknown>)[currentField.key] = textVal.trim();
        break;
      case 'number':
        (patch as Record<string, unknown>)[currentField.key] = Number(numVal);
        break;
      case 'select':
        (patch as Record<string, unknown>)[currentField.key] =
          currentField.options && currentField.options.length === 0
            ? userVal
            : selectVal;
        break;
      case 'multichip':
        (patch as Record<string, unknown>)[currentField.key] = multiVal;
        break;
      case 'date':
        (patch as Record<string, unknown>)[currentField.key] = textVal;
        break;
    }
    setBuf({ ...buf, ...patch });
    // Reset editor for a quick next add.
    setPickedField('');
  };

  const remove = (key: string) => {
    const next = { ...buf };
    delete (next as Record<string, unknown>)[key];
    setBuf(next);
  };

  // Group applied filters by section for readable chip clusters.
  const appliedGrouped: Array<{
    section: string;
    entries: Array<{ key: string; label: string; display: string }>;
  }> = FILTER_SECTIONS.map((s) => {
    const entries: Array<{ key: string; label: string; display: string }> = [];
    for (const f of s.fields) {
      const v = (buf as Record<string, unknown>)[f.key];
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      let display: string;
      if (f.type === 'select' && f.options && f.options.length === 0) {
        // user-ref field — show the employee's name, fall back to id.
        const u = employees.find((e) => e.userId === v);
        display = u?.name || String(v);
      } else if (Array.isArray(v)) {
        display = v.join(', ');
      } else {
        display = String(v);
      }
      entries.push({ key: f.key as string, label: f.label, display });
    }
    return { section: s.label, entries };
  }).filter((g) => g.entries.length > 0);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 480 }, p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconAdjustmentsHorizontal size={20} />
            <Typography sx={{ fontWeight: 800 }}>Requirement filters</Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <IconX size={16} />
          </IconButton>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Pick a section, then a field, then enter a value. Every KPI +
          heatmap + feed + trend recomputes against the filtered pool
          when you hit Apply.
        </Typography>

        {/* Add-filter builder */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2,
            borderColor: alpha(tokens.colors.pink, 0.3),
            bgcolor: alpha(tokens.colors.pink, 0.03),
            mb: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: tokens.colors.pinkDark,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Add a filter
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                label="Section"
                value={pickedSection}
                onChange={(e) => setPickedSection(e.target.value)}
              >
                {FILTER_SECTIONS.map((s) => (
                  <MenuItem key={s.label} value={s.label}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth disabled={!currentSection}>
              <InputLabel>Field</InputLabel>
              <Select
                label="Field"
                value={pickedField}
                onChange={(e) => setPickedField(e.target.value)}
              >
                {(currentSection?.fields || []).map((f) => (
                  <MenuItem key={f.key as string} value={f.key as string}>
                    {f.label}
                    {f.hint ? (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                      >
                        ({f.hint})
                      </Typography>
                    ) : null}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Value editor — swaps by field type */}
            {currentField && (
              <FilterValueEditor
                field={currentField}
                userOpts={userOpts}
                textVal={textVal}
                setTextVal={setTextVal}
                numVal={numVal}
                setNumVal={setNumVal}
                selectVal={selectVal}
                setSelectVal={setSelectVal}
                multiVal={multiVal}
                setMultiVal={setMultiVal}
                userVal={userVal}
                setUserVal={setUserVal}
              />
            )}

            <Button
              variant="contained"
              size="small"
              disabled={!canAdd}
              startIcon={<IconPlus size={14} />}
              onClick={commitAdd}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                background: tokens.gradients.pinkBlue,
                '&:hover': { background: alpha(tokens.colors.pinkDark, 0.9) },
                alignSelf: 'flex-end',
              }}
            >
              Add filter
            </Button>
          </Stack>
        </Paper>

        {/* Applied filters */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: tokens.colors.blueDark,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Applied ({appliedGrouped.reduce((n, g) => n + g.entries.length, 0)})
        </Typography>
        {appliedGrouped.length === 0 ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            No filters yet.
          </Typography>
        ) : (
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            {appliedGrouped.map((g) => (
              <Box key={g.section}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {g.section}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                  {g.entries.map((e) => (
                    <Chip
                      key={e.key}
                      size="small"
                      label={
                        <span>
                          <strong>{e.label}:</strong> {e.display}
                        </span>
                      }
                      onDelete={() => remove(e.key)}
                      sx={{
                        bgcolor: alpha(tokens.colors.blue, 0.08),
                        color: tokens.colors.blueDark,
                        fontSize: 11,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 3 }} justifyContent="flex-end">
          <Button
            onClick={() => setBuf({})}
            sx={{ textTransform: 'none' }}
          >
            Clear all
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onChange(buf);
              onClose();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: tokens.gradients.pinkBlue,
              '&:hover': { background: alpha(tokens.colors.pinkDark, 0.9) },
            }}
          >
            Apply filters
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

function FilterValueEditor({
  field,
  userOpts,
  textVal,
  setTextVal,
  numVal,
  setNumVal,
  selectVal,
  setSelectVal,
  multiVal,
  setMultiVal,
  userVal,
  setUserVal,
}: {
  field: FilterFieldDef;
  userOpts: Array<{ id: string; name: string }>;
  textVal: string;
  setTextVal: (v: string) => void;
  numVal: string;
  setNumVal: (v: string) => void;
  selectVal: string;
  setSelectVal: (v: string) => void;
  multiVal: string[];
  setMultiVal: (v: string[]) => void;
  userVal: string;
  setUserVal: (v: string) => void;
}) {
  if (field.type === 'text') {
    return (
      <TextField
        size="small"
        label={field.hint ? `Value (${field.hint})` : 'Value'}
        value={textVal}
        onChange={(e) => setTextVal(e.target.value)}
        fullWidth
      />
    );
  }
  if (field.type === 'number') {
    return (
      <TextField
        size="small"
        type="number"
        label="Value"
        value={numVal}
        onChange={(e) => setNumVal(e.target.value)}
        fullWidth
      />
    );
  }
  if (field.type === 'date') {
    return (
      <TextField
        size="small"
        type="date"
        label="Value"
        InputLabelProps={{ shrink: true }}
        value={textVal}
        onChange={(e) => setTextVal(e.target.value)}
        fullWidth
      />
    );
  }
  if (field.type === 'select') {
    // Empty options ⇒ user picker.
    if (field.options && field.options.length === 0) {
      return (
        <Autocomplete
          size="small"
          options={userOpts}
          getOptionLabel={(o) => o.name}
          value={userOpts.find((o) => o.id === userVal) || null}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_e, next) => setUserVal(next?.id || '')}
          renderInput={(p) => <TextField {...p} label="Employee" />}
        />
      );
    }
    return (
      <FormControl size="small" fullWidth>
        <InputLabel>Value</InputLabel>
        <Select
          label="Value"
          value={selectVal}
          onChange={(e) => setSelectVal(e.target.value as string)}
        >
          {(field.options || []).map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
  // multichip
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Select one or more
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
        {(field.options || []).map((o) => {
          const active = multiVal.includes(o);
          return (
            <Chip
              key={o}
              size="small"
              label={o}
              variant={active ? 'filled' : 'outlined'}
              onClick={() =>
                setMultiVal(
                  active ? multiVal.filter((x) => x !== o) : [...multiVal, o],
                )
              }
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
