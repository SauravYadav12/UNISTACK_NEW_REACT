import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconPlus,
  IconChessKnight,
  IconSearch,
  IconDownload,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import {
  ChessLead,
  ChessLeadPayload,
  ChessLeadStats,
} from '../../Interfaces/chessLead';
import {
  createChessLead,
  getChessLeadStats,
  listChessLeads,
} from '../../services/chessLeadApi';
import ChessLeadsDashboard from './ChessLeadsDashboard';
import ChessLeadForm from './ChessLeadForm';
import ChessLeadDrawer from './ChessLeadDrawer';
import {
  CHESS_LEAD_PRIORITIES,
  CHESS_LEAD_STATUSES,
  CHESS_PRIORITY_COLORS,
  CHESS_STATUS_COLORS,
  computePricing,
} from './chessLeadsValues';

/**
 * Chess Leads — subscription-sales pipeline for chess academies.
 *
 * One page holds the dashboard (5 tiles + status donut), a filter strip
 * (search + status + priority + state), and a paginated grid of leads.
 * Row click → detail drawer with view / edit / delete + audit log.
 * "Add lead" opens the same form modal the drawer uses in edit mode.
 */
export default function ChessLeads() {
  const [rows, setRows] = useState<ChessLead[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ChessLeadStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [pagination, setPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (status) p.set('status', status);
    if (priority) p.set('priority', priority);
    if (stateFilter.trim()) p.set('stateOrCity', stateFilter.trim());
    p.set('page', String(pagination.page + 1));
    p.set('limit', String(pagination.pageSize));
    return p.toString();
  }, [q, status, priority, stateFilter, pagination]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listChessLeads(queryString);
      const data = res.data?.data;
      setRows(data?.results || []);
      setTotalRows(data?.totalDocuments || 0);
    } catch {
      toast.error('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getChessLeadStats();
      setStats(res.data?.data || null);
    } catch {
      /* stats are secondary — silent */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function handleCreate(payload: ChessLeadPayload) {
    setCreating(true);
    try {
      await createChessLead(payload);
      toast.success('Lead created');
      setAddOpen(false);
      await Promise.all([loadRows(), loadStats()]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        'Could not create lead';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  function onLeadChanged() {
    void loadRows();
    void loadStats();
  }

  /**
   * Pull every lead matching the CURRENT filters (respecting search /
   * status / priority / state), flatten to a CSV, and trigger a browser
   * download. Cap at 5000 so we don't fetch the whole DB by accident on
   * an empty filter — if the team ever crosses that, we'll add a proper
   * server-side streaming export.
   */
  async function handleExportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set('page', '1');
      params.set('limit', '5000');
      const res = await listChessLeads(params.toString());
      const all = res.data?.data?.results || [];
      if (all.length === 0) {
        toast.info('No leads to export for the current filters');
        return;
      }
      const csv = leadsToCsv(all);
      const stamp = moment().format('YYYY-MM-DD_HHmm');
      downloadTextFile(csv, `chess-leads-${stamp}.csv`, 'text/csv;charset=utf-8;');
      toast.success(`Exported ${all.length} leads`);
    } catch {
      toast.error('Could not export leads');
    } finally {
      setExporting(false);
    }
  }

  const columns: GridColDef<ChessLead>[] = useMemo(
    () => [
      {
        field: 'leadId',
        headerName: 'ID',
        width: 100,
        renderCell: (p) => (
          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: tokens.colors.blueDark }}>
            {p.value as string}
          </Typography>
        ),
      },
      {
        field: 'academyName',
        headerName: 'Academy',
        flex: 1.4,
        minWidth: 200,
        renderCell: (p) => (
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
            {p.value as string}
          </Typography>
        ),
      },
      {
        field: 'subscriptionDate',
        headerName: 'Subscription',
        width: 130,
        renderCell: (p) =>
          p.value ? moment(p.value as string).format('MMM D, YYYY') : '—',
      },
      { field: 'totalIds', headerName: 'IDs', width: 80, type: 'number' },
      { field: 'mobileNumber', headerName: 'Mobile', width: 130 },
      {
        field: 'country',
        headerName: 'Country',
        width: 120,
        // Fall back to the legacy free-text field for pre-triplet rows.
        valueGetter: (_v, row) =>
          (row as ChessLead).country || (row as ChessLead).stateOrCity || '',
      },
      {
        field: 'state',
        headerName: 'State',
        width: 130,
        valueGetter: (_v, row) => (row as ChessLead).state || '',
      },
      {
        field: 'city',
        headerName: 'City',
        width: 130,
        valueGetter: (_v, row) => (row as ChessLead).city || '',
      },
      {
        field: 'pricingPerId',
        headerName: 'Price',
        width: 100,
        renderCell: (p) =>
          p.value != null ? `₹${(p.value as number).toLocaleString('en-IN')}` : '—',
      },
      {
        // Computed — not on the doc. valueGetter drives sort/filter,
        // renderCell handles the ₹ formatting.
        field: '__gstAmount',
        headerName: 'GST',
        width: 110,
        sortable: false,
        valueGetter: (_v, row) => {
          const r = row as ChessLead;
          return computePricing(r.totalIds, r.pricingPerId, r.gstPercent).gstAmount;
        },
        renderCell: (p) => {
          const r = p.row as ChessLead;
          const { gstAmount } = computePricing(
            r.totalIds,
            r.pricingPerId,
            r.gstPercent,
          );
          if (gstAmount === 0) return '—';
          return (
            <Typography sx={{ fontSize: '0.8rem' }}>
              ₹{gstAmount.toLocaleString('en-IN')}
              <Box
                component="span"
                sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.7rem' }}
              >
                @{r.gstPercent ?? 18}%
              </Box>
            </Typography>
          );
        },
      },
      {
        field: '__grandTotal',
        headerName: 'Total',
        width: 120,
        sortable: false,
        valueGetter: (_v, row) => {
          const r = row as ChessLead;
          return computePricing(r.totalIds, r.pricingPerId, r.gstPercent).grandTotal;
        },
        renderCell: (p) => {
          const r = p.row as ChessLead;
          const { grandTotal } = computePricing(
            r.totalIds,
            r.pricingPerId,
            r.gstPercent,
          );
          if (grandTotal === 0) return '—';
          return (
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tokens.colors.pinkDark }}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Typography>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.value as string}
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              bgcolor: alpha(
                CHESS_STATUS_COLORS[
                  p.value as keyof typeof CHESS_STATUS_COLORS
                ] || '#666',
                0.12,
              ),
              color:
                CHESS_STATUS_COLORS[
                  p.value as keyof typeof CHESS_STATUS_COLORS
                ] || '#666',
              border: `1px solid ${alpha(
                CHESS_STATUS_COLORS[
                  p.value as keyof typeof CHESS_STATUS_COLORS
                ] || '#666',
                0.3,
              )}`,
            }}
          />
        ),
      },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 100,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.value as string}
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              bgcolor: alpha(
                CHESS_PRIORITY_COLORS[
                  p.value as keyof typeof CHESS_PRIORITY_COLORS
                ] || '#666',
                0.12,
              ),
              color:
                CHESS_PRIORITY_COLORS[
                  p.value as keyof typeof CHESS_PRIORITY_COLORS
                ] || '#666',
            }}
          />
        ),
      },
      {
        field: 'lastRenewalDate',
        headerName: 'Last renewal',
        width: 130,
        renderCell: (p) => {
          const iso = p.value as string | undefined;
          if (!iso) return '—';
          return (
            <Typography sx={{ fontSize: '0.8rem' }}>
              {moment(iso).format('MMM D, YYYY')}
            </Typography>
          );
        },
      },
      {
        field: 'nextFollowUpDate',
        headerName: 'Next follow-up',
        width: 140,
        renderCell: (p) => {
          const iso = p.value as string | undefined;
          if (!iso) return '—';
          const today = moment().format('YYYY-MM-DD');
          const overdue = iso < today;
          return (
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: overdue ? '#EF4444' : iso === today ? tokens.colors.pinkDark : 'inherit',
              }}
            >
              {moment(iso).format('MMM D, YYYY')}
            </Typography>
          );
        },
      },
      {
        field: 'reason',
        headerName: 'Reason',
        flex: 1,
        minWidth: 160,
        renderCell: (p) => (
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {(p.value as string) || '—'}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: tokens.gradients.pinkBlue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <IconChessKnight size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.3rem' }}>
              Chess Leads
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track chess-academy subscription pipeline.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={
              exporting ? (
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${alpha(tokens.colors.blueDark, 0.3)}`,
                    borderTopColor: tokens.colors.blueDark,
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                  }}
                />
              ) : (
                <IconDownload size={16} />
              )
            }
            onClick={handleExportCsv}
            disabled={exporting || loading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              borderColor: tokens.colors.blueDark,
              color: tokens.colors.blueDark,
              '&:hover': {
                bgcolor: alpha(tokens.colors.blue, 0.06),
                borderColor: tokens.colors.blueDark,
              },
            }}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button
            variant="contained"
            startIcon={<IconPlus size={16} />}
            onClick={() => setAddOpen(true)}
            sx={{
              background: tokens.gradients.pinkBlue,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { background: alpha(tokens.colors.pinkDark, 0.9) },
            }}
          >
            Add lead
          </Button>
        </Stack>
      </Stack>

      <ChessLeadsDashboard stats={stats} loading={statsLoading} />

      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
          bgcolor: '#fff',
          mb: 1.5,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
          <TextField
            size="small"
            placeholder="Search academy, mobile, or lead ID"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            InputProps={{
              startAdornment: (
                <IconSearch
                  size={14}
                  style={{ marginRight: 6, color: tokens.colors.blueDark }}
                />
              ),
            }}
            sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            sx={{ flex: 1, minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            <MenuItem value="">All</MenuItem>
            {CHESS_LEAD_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            sx={{ flex: 1, minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            <MenuItem value="">All</MenuItem>
            {CHESS_LEAD_PRIORITIES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            placeholder="State / City"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
          bgcolor: '#fff',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r._id}
          loading={loading}
          rowCount={totalRows}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(p) => setDrawerId((p.row as ChessLead)._id)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(tokens.colors.blue, 0.06),
              fontWeight: 800,
            },
            // Vertically centre every cell — without this, custom
            // renderCell content stacks to the top while plain string
            // cells sit centred, producing the mis-aligned rows the
            // sales team flagged.
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': {
              bgcolor: alpha(tokens.colors.blue, 0.03),
            },
          }}
          autoHeight
        />
      </Box>

      <ChessLeadForm
        open={addOpen}
        initial={null}
        saving={creating}
        onClose={() => !creating && setAddOpen(false)}
        onSubmit={handleCreate}
      />

      <ChessLeadDrawer
        open={!!drawerId}
        leadId={drawerId}
        onClose={() => setDrawerId(null)}
        onChanged={onLeadChanged}
      />
    </Box>
  );
}

// ── CSV helpers ────────────────────────────────────────────────────────
// Deliberately no library — chess leads have ~15 flat columns and the
// data set is small enough that streaming isn't needed. If we ever need
// to export tens of thousands of rows we'll move this server-side.

function escapeCsvCell(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  // Quote fields that contain the delimiter, quotes, or a newline; double
  // any embedded quote per RFC 4180.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function leadsToCsv(rows: ChessLead[]): string {
  const header = [
    'Lead ID',
    'Academy',
    'Subscription Date',
    'Last Renewal Date',
    'Total IDs',
    'Mobile',
    'Country',
    'State',
    'City',
    'Legacy Location',
    'Pricing per ID',
    'Subtotal',
    'GST %',
    'GST Amount',
    'Grand Total',
    'Status',
    'Priority',
    'Next Follow-up',
    'Reason',
    'Created By',
    'Created At',
  ];
  const lines = [header.map(escapeCsvCell).join(',')];
  for (const r of rows) {
    const { subtotal, gstAmount, grandTotal } = computePricing(
      r.totalIds,
      r.pricingPerId,
      r.gstPercent,
    );
    lines.push(
      [
        r.leadId,
        r.academyName,
        r.subscriptionDate || '',
        r.lastRenewalDate || '',
        r.totalIds ?? '',
        r.mobileNumber || '',
        r.country || '',
        r.state || '',
        r.city || '',
        r.stateOrCity || '',
        r.pricingPerId ?? '',
        subtotal,
        r.gstPercent ?? 18,
        gstAmount,
        grandTotal,
        r.status,
        r.priority,
        r.nextFollowUpDate || '',
        r.reason || '',
        r.createdByName || '',
        r.createdAt ? moment(r.createdAt).format('YYYY-MM-DD HH:mm') : '',
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }
  // Excel picks up UTF-8 correctly with a BOM prefix — without it the ₹
  // symbol arrives as garbage on Windows.
  return '﻿' + lines.join('\r\n');
}

function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
