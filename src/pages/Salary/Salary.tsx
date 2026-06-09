import { useMemo, useState } from 'react';
import {
  Box, Button, Grid, IconButton, Stack, Tooltip, Typography, alpha, Chip,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import moment from 'moment';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  IconCash, IconUsers, IconCalendarEvent, IconReportMoney,
  IconDownload, IconChevronLeft, IconChevronRight, IconEdit, IconEye,
  IconFileInvoice, IconSend, IconEyeOff, IconTrash, IconAlertTriangle,
  IconRefresh, IconPlayerPlayFilled,
} from '@tabler/icons-react';

import { useFetchData } from '../../hooks/fetchDataHook';
import { tokens } from '../../theme/theme';
import {
  getSlipsForMonth, generateSlipsForMonth, generateSlipForUser,
  monthlyReportCsvUrl,
  publishSlip, unpublishSlip, publishSlipsForMonth,
  resetSlipsForMonth,
} from '../../services/salaryApi';
import { usersList } from '../../services/authApi';
import { iUser, UserRole } from '../../Interfaces/iUser';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { axiosClient } from '../../config/axios.config';
import { SalarySlip } from '../../Interfaces/salary';

interface SalaryRow {
  rowId: string;
  userId: string;
  name: string;
  employeeId: string;
  designation: string;
  country: 'IN' | 'US';
  slip?: SalarySlip;
}

function sym(c?: 'INR' | 'USD') {
  return c === 'USD' ? '$' : '\u20B9';
}
import SalaryConfigDialog from '../../components/salary/SalaryConfigDialog';
import SlipPreviewDialog from '../../components/salary/SlipPreviewDialog';
import EditSlipDialog from '../../components/salary/EditSlipDialog';
import LeaveDeductionFormula from '../../components/salary/LeaveDeductionFormula';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../theme/animations';

const MotionBox = motion.create(Box);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Salary() {
  const now = moment();
  const { iUser } = useAuth();
  const isSuperAdmin = !!iUser?.role?.includes(UserRole['super-admin']);
  const [year, setYear] = useState<number>(now.year());
  const [month, setMonth] = useState<number>(now.month() + 1);
  const [configUser, setConfigUser] = useState<{ id: string; name: string } | null>(null);
  const [previewSlip, setPreviewSlip] = useState<SalarySlip | undefined>();
  const [editingSlip, setEditingSlip] = useState<SalarySlip | undefined>();
  const [generating, setGenerating] = useState(false);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  // Track per-row publish-button busy state so a row-level click doesn't
  // freeze the whole grid.
  const [rowPublishBusy, setRowPublishBusy] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  // Per-user generate spinner — keyed by userId so each row's button
  // shows its own busy state without freezing the rest of the grid.
  const [rowGenBusy, setRowGenBusy] = useState<string | null>(null);

  // Selected month status — drives the mid-month warning + future-month
  // block in the generate confirmation dialog.
  // `monthEnd` = end-of-day on the last day of the selected month.
  // `monthStatus` = 'past' | 'current' | 'future', where 'current' means
  // today is somewhere inside the month and the slip will only cover
  // days elapsed so far.
  const selectedMonthEnd = useMemo(
    () => moment({ year, month: month - 1 }).endOf('month'),
    [year, month],
  );
  const selectedMonthStart = useMemo(
    () => moment({ year, month: month - 1 }).startOf('month'),
    [year, month],
  );
  const monthStatus: 'past' | 'current' | 'future' = useMemo(() => {
    const today = moment().endOf('day');
    if (today.isAfter(selectedMonthEnd)) return 'past';
    if (today.isBefore(selectedMonthStart)) return 'future';
    return 'current';
  }, [selectedMonthEnd, selectedMonthStart]);
  // Days elapsed in the current month (capped at the month end) — used
  // only in the warning copy so HR knows what slice will be covered.
  const elapsedDaysInMonth = useMemo(() => {
    if (monthStatus !== 'current') return 0;
    return moment().diff(selectedMonthStart, 'days') + 1;
  }, [monthStatus, selectedMonthStart]);

  const {
    data, loading, loadData,
  } = useFetchData<{ users: iUser[]; slips: SalarySlip[] }>(async () => {
    const [u, s] = await Promise.all([
      usersList(),
      getSlipsForMonth(year, month),
    ]);
    return {
      users: (u.data.users || []).filter(
        (x) => x.active && !x.role?.includes(UserRole['super-admin']),
      ),
      slips: s.data || [],
    };
  }, [year, month]);

  const rows: SalaryRow[] = useMemo(() => {
    const users = data?.users || [];
    const slips = data?.slips || [];
    const slipByUser = new Map(slips.map((s) => [s.user, s]));
    return users.map((u) => ({
      rowId: u._id,
      userId: u._id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      employeeId: slipByUser.get(u._id)?.employeeId || '—',
      designation: slipByUser.get(u._id)?.designation || '—',
      country: (u.shift === 'India' ? 'IN' : 'US') as 'IN' | 'US',
      slip: slipByUser.get(u._id),
    }));
  }, [data]);

  const totalPayroll = rows.reduce((s, x) => s + (x.slip?.netPay || 0), 0);
  const totalUnpaid = rows.reduce((s, x) => s + (x.slip?.leaves?.unpaidDays || 0), 0);
  const slipCount = rows.filter((r) => r.slip).length;

  function shiftMonth(delta: number) {
    const m = moment({ year, month: month - 1 }).add(delta, 'month');
    setYear(m.year());
    setMonth(m.month() + 1);
  }

  async function runGenerate() {
    setGenerating(true);
    try {
      const res = await generateSlipsForMonth(year, month);
      const parts: string[] = [`Generated ${res.ok} slips`];
      // Pre-DOJ / post-relieving users get skipped deliberately — show
      // separately so HR doesn't read it as a failure. Published slips
      // are also skipped now (separately tracked) so HR knows their
      // signed-off slips weren't touched.
      if (res.skipped) parts.push(`${res.skipped} skipped (not on payroll)`);
      if (res.publishedSkipped) {
        parts.push(`${res.publishedSkipped} skipped (already published)`);
      }
      if (res.failed) parts.push(`${res.failed} failed`);
      toast.success(parts.join(' · '));
      loadData();
    } catch (e) {
      toast.error('Failed to generate slips');
      throw e; // keep ConfirmDialog open so admin can retry
    } finally {
      setGenerating(false);
    }
  }

  /** Per-user generate / regenerate — always runs regardless of
   *  publish state, so HR can update a single employee's slip on
   *  demand. The published flag stays as-is (see server's
   *  generateForUser: payload spread doesn't include `published`), so
   *  if HR regenerates an already-published slip the new numbers go
   *  live to the employee immediately. That's the supported
   *  "republish" workflow. */
  async function generateForRow(row: SalaryRow) {
    setRowGenBusy(row.userId);
    try {
      await generateSlipForUser(row.userId, year, month);
      const wasPublished = !!row.slip?.published;
      const verb = row.slip ? 'Regenerated' : 'Generated';
      toast.success(
        wasPublished
          ? `${verb} ${row.name}'s slip — employee sees the updated numbers immediately (was published).`
          : `${verb} ${row.name}'s slip.`,
      );
      loadData();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to generate slip.';
      toast.error(msg);
    } finally {
      setRowGenBusy(null);
    }
  }

  // Count slips that are generated but not yet published — drives both
  // the publish-all button enable state and the helper text under it.
  const unpublishedCount = rows.filter(
    (r) => r.slip && !r.slip.published,
  ).length;
  const publishedCount = rows.filter((r) => r.slip?.published).length;

  async function runPublishAll() {
    setPublishing(true);
    try {
      const res = await publishSlipsForMonth(year, month);
      toast.success(
        res.published > 0
          ? `Published ${res.published} payslip${res.published > 1 ? 's' : ''}`
          : 'Nothing to publish — all slips already published',
      );
      loadData();
    } catch (e) {
      toast.error('Failed to publish slips');
      throw e; // keep ConfirmDialog open so admin can retry
    } finally {
      setPublishing(false);
    }
  }

  async function runReset() {
    setResetting(true);
    try {
      const res = await resetSlipsForMonth(year, month);
      toast.success(
        res.deleted > 0
          ? `Reset complete — deleted ${res.deleted} slip${res.deleted > 1 ? 's' : ''}`
          : 'Nothing to reset — no slips existed for this month',
      );
      loadData();
    } catch (e) {
      toast.error('Failed to reset slips');
      throw e;
    } finally {
      setResetting(false);
    }
  }

  async function toggleRowPublish(row: SalaryRow) {
    if (!row.slip?._id) return;
    const slipId = row.slip._id;
    const wasPublished = !!row.slip.published;
    setRowPublishBusy(slipId);
    try {
      if (wasPublished) {
        await unpublishSlip(slipId);
        toast.success(`Unpublished ${row.name}'s payslip`);
      } else {
        await publishSlip(slipId);
        toast.success(`Published ${row.name}'s payslip`);
      }
      loadData();
    } catch {
      toast.error(
        wasPublished ? 'Failed to unpublish' : 'Failed to publish',
      );
    } finally {
      setRowPublishBusy(null);
    }
  }

  async function handleDownloadCsv() {
    try {
      const res = await axiosClient.get(monthlyReportCsvUrl(year, month), {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-${year}-${String(month).padStart(2, '0')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download report');
    }
  }

  const columns: GridColDef<SalaryRow>[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Employee',
      flex: 1.2, minWidth: 180,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: tokens.colors.lightText }}>
            {row.name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
            {row.employeeId}
          </Typography>
        </Box>
      ),
    },
    { field: 'designation', headerName: 'Designation', flex: 1, minWidth: 140 },
    {
      field: 'country', headerName: 'Shift', width: 80,
      renderCell: ({ row }) => (
        <Chip
          label={row.country}
          size="small"
          sx={{
            bgcolor: row.country === 'IN'
              ? alpha(tokens.colors.pink, 0.1)
              : alpha(tokens.colors.blue, 0.1),
            color: row.country === 'IN' ? tokens.colors.pink : tokens.colors.blue,
            fontWeight: 600, fontSize: 10, height: 22,
          }}
        />
      ),
    },
    {
      field: 'workingDays', headerName: 'Work Days', width: 100, type: 'number',
      valueGetter: (_v, row) => row.slip?.workingDays,
      renderCell: ({ value }) => value ?? '—',
    },
    {
      field: 'presentDays', headerName: 'Present', width: 90, type: 'number',
      valueGetter: (_v, row) => row.slip?.presentDays,
      renderCell: ({ value }) => value ?? '—',
    },
    {
      field: 'unpaid', headerName: 'Unpaid', width: 90, type: 'number',
      valueGetter: (_v, row) => row.slip?.leaves?.unpaidDays,
      renderCell: ({ value }) => value ?? '—',
    },
    {
      field: 'gross', headerName: 'Gross', width: 120, type: 'number',
      valueGetter: (_v, row) => row.slip?.earnings?.total,
      renderCell: ({ value, row }) =>
        value != null
          ? `${sym(row.slip?.currency)}${(value as number).toLocaleString()}`
          : '—',
    },
    {
      field: 'netPay', headerName: 'Net Pay', width: 140, type: 'number',
      valueGetter: (_v, row) => row.slip?.netPay,
      renderCell: ({ value, row }) =>
        value != null ? (
          <Typography sx={{ fontWeight: 700, color: tokens.colors.lightText, fontVariantNumeric: 'tabular-nums' }}>
            {sym(row.slip?.currency)}{(value as number).toLocaleString()}
          </Typography>
        ) : (
          <Chip label="No slip" size="small" sx={{
            bgcolor: alpha(tokens.colors.yellowDark, 0.1),
            color: tokens.colors.yellowDark, fontWeight: 600, fontSize: 10, height: 22,
          }} />
        ),
    },
    {
      field: 'publishStatus', headerName: 'Status', width: 110, sortable: false, filterable: false,
      renderCell: ({ row }) =>
        !row.slip ? (
          <Chip label="—" size="small" sx={{ height: 22, fontSize: 10, color: tokens.colors.lightTextSecondary }} />
        ) : row.slip.published ? (
          <Chip
            label="Published"
            size="small"
            sx={{
              bgcolor: alpha(tokens.colors.success, 0.12),
              color: tokens.colors.success,
              fontWeight: 700, fontSize: 10, height: 22,
            }}
          />
        ) : (
          <Chip
            label="Draft"
            size="small"
            sx={{
              bgcolor: alpha(tokens.colors.yellowDark, 0.12),
              color: tokens.colors.yellowDark,
              fontWeight: 700, fontSize: 10, height: 22,
            }}
          />
        ),
    },
    {
      field: 'actions', headerName: '', width: 240, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        const pubBusy = rowPublishBusy === row.slip?._id;
        const genBusy = rowGenBusy === row.userId;
        return (
        <Stack direction="row" spacing={0.5}>
          {/* Per-user generate / regenerate. Always runs — even on
              published slips — so HR can push corrected numbers to a
              single employee. Icon switches between "play" (no slip
              yet) and "refresh" (slip exists) so the affordance reads
              right at a glance. */}
          <Tooltip
            title={
              genBusy
                ? 'Working…'
                : !row.slip
                  ? `Generate slip for ${row.name}`
                  : row.slip.published
                    ? `Regenerate ${row.name}'s slip (will update the employee's view immediately — slip stays published)`
                    : `Regenerate ${row.name}'s slip`
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={genBusy || generating}
                onClick={() => generateForRow(row)}
                sx={{
                  color: row.slip
                    ? tokens.colors.blue
                    : tokens.colors.brand,
                }}
              >
                {genBusy ? (
                  <CircularProgress size={14} />
                ) : row.slip ? (
                  <IconRefresh size={16} />
                ) : (
                  <IconPlayerPlayFilled size={14} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.slip ? 'View slip' : 'No slip yet'}>
            <span>
              <IconButton
                size="small"
                disabled={!row.slip}
                onClick={() => row.slip && setPreviewSlip(row.slip)}
              >
                <IconEye size={16} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.slip ? 'Edit slip (corrections)' : 'Generate the slip first'}>
            <span>
              <IconButton
                size="small"
                disabled={!row.slip}
                onClick={() => row.slip && setEditingSlip(row.slip)}
                sx={{ color: tokens.colors.pink }}
              >
                <IconFileInvoice size={16} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              !row.slip
                ? 'Generate the slip first'
                : row.slip.published
                  ? 'Unpublish — hide this slip from the employee'
                  : 'Publish — make this slip visible to the employee'
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={!row.slip || pubBusy}
                onClick={() => toggleRowPublish(row)}
                sx={{ color: row.slip?.published ? tokens.colors.lightTextSecondary : tokens.colors.success }}
              >
                {pubBusy ? (
                  <CircularProgress size={14} />
                ) : row.slip?.published ? (
                  <IconEyeOff size={16} />
                ) : (
                  <IconSend size={16} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Edit salary config">
            <IconButton size="small" onClick={() => setConfigUser({ id: row.userId, name: row.name })}>
              <IconEdit size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
        );
      },
    },
    // ── year + month MUST be in this dep array ──
    // The per-row Generate / Regenerate button's onClick closes over
    // `generateForRow`, which closes over `year` and `month`. If we
    // omit them here, the column array stays cached when HR navigates
    // months — and clicking Generate on May would silently fire the
    // API for whatever month the columns were first computed under
    // (typically June, the page's default landing month). HR would
    // then see a fresh slip appear in the OTHER month and conclude
    // "the page moved." Including the values forces a recompute so
    // the click always uses the currently-displayed month.
  ], [rowPublishBusy, rowGenBusy, generating, year, month]);

  const statCards = [
    { title: 'Total Payroll', count: totalPayroll, prefix: '₹', icon: <IconCash size={22} />, color: tokens.colors.pink },
    { title: 'Active Employees', count: rows.length, icon: <IconUsers size={22} />, color: tokens.colors.blue },
    { title: 'Unpaid Days', count: totalUnpaid, icon: <IconCalendarEvent size={22} />, color: tokens.colors.yellowDark },
    { title: 'Avg Net Pay', count: slipCount ? Math.round(totalPayroll / slipCount) : 0, prefix: '₹', icon: <IconReportMoney size={22} />, color: tokens.colors.brand },
  ];

  return (
    <Box>
      {/* Hero */}
      <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h1" fontWeight={700} sx={{ mb: 0.5 }}>
              Salary{' '}
              <Box component="span" sx={{ background: tokens.gradients.pinkBlue, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Management
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Calculate, review, and distribute monthly payroll
            </Typography>
          </Box>

          {/* Month / Year selector */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => shiftMonth(-1)} size="small">
              <IconChevronLeft size={18} />
            </IconButton>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={month}
                label="Month"
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTH_NAMES.map((m, i) => (
                  <MenuItem key={m} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
                {Array.from({ length: 6 }, (_, i) => now.year() - 3 + i).map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={() => shiftMonth(1)} size="small">
              <IconChevronRight size={18} />
            </IconButton>
          </Stack>
        </Box>
      </MotionBox>

      {/* Stat cards */}
      <MotionBox variants={staggerContainer} initial="initial" animate="animate" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {statCards.map((c) => (
            <Grid key={c.title} size={{ xs: 6, md: 3 }}>
              <MotionBox
                variants={staggerItem}
                whileHover={{ y: -4 }}
                sx={{
                  p: 2.5, borderRadius: 4, bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider',
                  position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.25s',
                  '&:hover': { boxShadow: `0 8px 24px ${alpha(c.color, 0.15)}` },
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: c.color, opacity: 0.7 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    width: 42, height: 42, borderRadius: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(c.color, 0.1), color: c.color,
                  }}>
                    {c.icon}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  {c.prefix && (
                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: tokens.colors.lightText, mr: 0.25 }}>
                      {c.prefix}
                    </Typography>
                  )}
                  <AnimatedCounter
                    value={c.count}
                    variant="h2"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ lineHeight: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                  {c.title}
                </Typography>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </MotionBox>

      {/* Action strip */}
      <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
        sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h5" fontWeight={700} color="#2A3547">
              {MONTH_NAMES[month - 1]} {year}
            </Typography>
            <LeaveDeductionFormula />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {slipCount} of {rows.length} have slips
            {slipCount > 0 && (
              <>
                {' · '}
                <Box component="span" sx={{ color: tokens.colors.success, fontWeight: 700 }}>
                  {publishedCount} published
                </Box>
                {unpublishedCount > 0 && (
                  <>
                    {' · '}
                    <Box component="span" sx={{ color: tokens.colors.yellowDark, fontWeight: 700 }}>
                      {unpublishedCount} draft
                    </Box>
                  </>
                )}
              </>
            )}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined" size="small"
            startIcon={<IconDownload size={16} />}
            onClick={handleDownloadCsv}
            disabled={!slipCount}
          >
            Download CSV
          </Button>
          <Button
            variant="contained" size="small"
            startIcon={generating ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <IconCash size={16} />}
            onClick={() => setGenerateConfirmOpen(true)}
            disabled={generating}
            sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
          >
            {generating ? 'Generating…' : 'Generate Slips'}
          </Button>
          <Button
            variant="contained" size="small"
            startIcon={publishing ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <IconSend size={16} />}
            onClick={() => setPublishConfirmOpen(true)}
            disabled={publishing || unpublishedCount === 0}
            sx={{
              bgcolor: tokens.colors.success,
              '&:hover': { bgcolor: '#0F855F' },
              '&.Mui-disabled': { bgcolor: alpha(tokens.colors.success, 0.4) },
            }}
          >
            {publishing
              ? 'Publishing…'
              : unpublishedCount > 0
                ? `Publish ${unpublishedCount}`
                : 'All Published'}
          </Button>
          {/* Reset = nuke every slip for the month. Super-admin only; the
              endpoint itself enforces the role too. Hidden when there's
              nothing to reset so the button doesn't tempt a misclick. */}
          {isSuperAdmin && slipCount > 0 && (
            <Button
              variant="outlined" size="small"
              startIcon={resetting ? <CircularProgress size={14} /> : <IconTrash size={16} />}
              onClick={() => setResetConfirmOpen(true)}
              disabled={resetting}
              sx={{
                borderColor: tokens.colors.error,
                color: tokens.colors.error,
                '&:hover': {
                  borderColor: tokens.colors.error,
                  bgcolor: alpha(tokens.colors.error, 0.06),
                },
              }}
            >
              {resetting ? 'Resetting…' : 'Reset Month'}
            </Button>
          )}
        </Stack>
      </MotionBox>

      {/* Data grid */}
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
        sx={{ minHeight: 400 }}>
        <DataGrid
          loading={loading}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.rowId}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          getRowHeight={() => 56}
          sx={{
            border: 'none', fontSize: '0.875rem',
            '& .MuiDataGrid-toolbarContainer': {
              px: 2.5, py: 1.5, gap: 1,
              bgcolor: '#fff', borderRadius: '12px',
              border: '1px solid', borderColor: 'grey.200',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)', mb: 2,
            },
            '& .MuiDataGrid-main': {
              bgcolor: '#fff', borderRadius: '12px 12px 0 0',
              border: '1px solid', borderColor: 'grey.200',
              borderBottom: 'none',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
              overflow: 'hidden',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F6F9FC', minHeight: '50px !important', maxHeight: '50px !important',
            },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8125rem', color: '#2A3547' },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#F6F9FC' },
            '& .MuiDataGrid-cell': { px: 2, display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-footerContainer': {
              bgcolor: '#fff', borderRadius: '0 0 12px 12px',
              border: '1px solid', borderColor: 'grey.200',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
            },
          }}
        />
      </MotionBox>

      {configUser && (
        <SalaryConfigDialog
          open={!!configUser}
          userId={configUser.id}
          userName={configUser.name}
          year={year}
          month={month}
          onClose={() => setConfigUser(null)}
          onSaved={() => loadData()}
        />
      )}

      <SlipPreviewDialog
        open={!!previewSlip}
        slip={previewSlip}
        onClose={() => setPreviewSlip(undefined)}
      />

      <EditSlipDialog
        open={!!editingSlip}
        slip={editingSlip}
        onClose={() => setEditingSlip(undefined)}
        onSaved={() => {
          setEditingSlip(undefined);
          loadData();
        }}
      />

      <ConfirmDialog
        open={generateConfirmOpen}
        onClose={() => setGenerateConfirmOpen(false)}
        onConfirm={runGenerate}
        tone={monthStatus === 'current' ? 'warning' : 'neutral'}
        title={`Generate payslips for ${MONTH_NAMES[month - 1]} ${year}?`}
        confirmLabel="Yes, generate"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1.25} sx={{ textAlign: 'left' }}>
            {/* Incomplete-month warning — shown when admin tries to
                generate slips for the month that's currently in
                progress. The server now clips the effective slice by
                `today`, so the slip will only cover days elapsed so
                far. Make sure HR sees this BEFORE confirming. */}
            {monthStatus === 'current' && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(tokens.colors.yellowDark, 0.1),
                  border: `1px solid ${alpha(tokens.colors.yellowDark, 0.35)}`,
                  display: 'flex',
                  gap: 1.25,
                  alignItems: 'flex-start',
                }}
              >
                <IconAlertTriangle
                  size={18}
                  color={tokens.colors.yellowDark}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.colors.yellowDark, fontWeight: 800, letterSpacing: 0.5, display: 'block' }}
                  >
                    THIS MONTH HASN&rsquo;T ENDED YET
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                    Today is <strong>{moment().format('MMM D')}</strong>. Slips will only cover the first <strong>{elapsedDaysInMonth} day{elapsedDaysInMonth > 1 ? 's' : ''}</strong> of {MONTH_NAMES[month - 1]} — the rest of the month counts as LOP until you re-generate after month-end.
                  </Typography>
                </Box>
              </Box>
            )}
            {/* Future month → server will throw PRE_DOJ_OR_POST_RELIEVING
                for everyone, so all slips would skip. Block the click
                upstream and explain why. */}
            {monthStatus === 'future' && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(tokens.colors.error, 0.08),
                  border: `1px solid ${alpha(tokens.colors.error, 0.3)}`,
                  display: 'flex',
                  gap: 1.25,
                  alignItems: 'flex-start',
                }}
              >
                <IconAlertTriangle
                  size={18}
                  color={tokens.colors.error}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.colors.error, fontWeight: 800, letterSpacing: 0.5, display: 'block' }}
                  >
                    FUTURE MONTH
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                    {MONTH_NAMES[month - 1]} {year} hasn&rsquo;t started yet. Nothing will be generated.
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Runs the payroll calculation for <strong>every active employee</strong> ({rows.length}) for <strong>{MONTH_NAMES[month - 1]} {year}</strong> and stores their payslip in the database.
            </Typography>
            <Box sx={{
              p: 1.25, borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.blue, 0.06),
              border: `1px solid ${alpha(tokens.colors.blue, 0.22)}`,
            }}>
              <Typography variant="caption" sx={{ color: tokens.colors.blue, fontWeight: 700, letterSpacing: 1 }}>
                WHAT THIS USES
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                Each slip pulls from the employee&rsquo;s saved <strong>salary config</strong> (earnings + deductions), this month&rsquo;s <strong>working days</strong> (Total days − Sat/Sun − national holidays), any approved <strong>leaves</strong> in the month, and their country&rsquo;s <strong>currency</strong>.
              </Typography>
            </Box>
            <Box sx={{
              p: 1.25, borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.success, 0.06),
              border: `1px solid ${alpha(tokens.colors.success, 0.2)}`,
            }}>
              <Typography variant="caption" sx={{ color: tokens.colors.success, fontWeight: 700, letterSpacing: 1 }}>
                PUBLISHED SLIPS ARE SAFE
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                Slips you&rsquo;ve already <strong>published</strong> are skipped on this run — your sign-off and any per-slip edits stay intact. To push corrected numbers to a single published employee, use the per-row <strong>Regenerate</strong> button instead.
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Draft slips (unpublished) <strong>will be overwritten</strong>. Re-apply any pencil-icon corrections after regeneration.
            </Typography>
          </Stack>
        }
      />

      <ConfirmDialog
        open={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        onConfirm={runPublishAll}
        tone="neutral"
        title={`Publish ${unpublishedCount} draft payslip${unpublishedCount > 1 ? 's' : ''}?`}
        confirmLabel="Yes, publish"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1.25} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              Makes <strong>{unpublishedCount}</strong> draft payslip
              {unpublishedCount > 1 ? 's' : ''} for{' '}
              <strong>
                {MONTH_NAMES[month - 1]} {year}
              </strong>{' '}
              visible to the corresponding employees and pings them with a
              notification.
            </Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: alpha(tokens.colors.yellowDark, 0.08),
                border: `1px solid ${alpha(tokens.colors.yellowDark, 0.25)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: tokens.colors.yellowDark, fontWeight: 700, letterSpacing: 1 }}>
                BEFORE YOU PUBLISH
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                Review the numbers, present days, and any LOP deductions for
                each row. Once published, an employee can see and download
                their slip immediately. You can still unpublish individually
                from the row action if you spot an issue later.
              </Typography>
            </Box>
          </Stack>
        }
      />

      {/* Super-admin "panic button" — wipes every slip for the
          selected month so HR can generate from scratch after a
          misconfiguration (wrong CTC, missing DOJ, accidentally
          generating for the wrong month). Confirm dialog is
          deliberately loud about the destructive nature. */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={runReset}
        tone="danger"
        title={`Reset all payslips for ${MONTH_NAMES[month - 1]} ${year}?`}
        confirmLabel="Yes, delete all slips"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1.25} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              This deletes <strong>every</strong> payslip ({slipCount}) for{' '}
              <strong>{MONTH_NAMES[month - 1]} {year}</strong>, including
              published ones. There is no per-row undo. Use this when
              payroll inputs were wrong and you want a clean slate
              before clicking Generate Slips again.
            </Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: alpha(tokens.colors.error, 0.08),
                border: `1px solid ${alpha(tokens.colors.error, 0.3)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: tokens.colors.error, fontWeight: 800, letterSpacing: 1 }}>
                IRREVERSIBLE
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
                Slips are wiped from the database. Anyone whose slip was already
                published will see the &ldquo;No payslip&rdquo; empty state on
                their Salary page until you regenerate and re-publish.
              </Typography>
            </Box>
          </Stack>
        }
      />
    </Box>
  );
}
