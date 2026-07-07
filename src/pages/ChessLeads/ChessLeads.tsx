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
import { IconPlus, IconChessKnight, IconSearch } from '@tabler/icons-react';
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
      { field: 'stateOrCity', headerName: 'State / City', width: 130 },
      {
        field: 'pricingPerId',
        headerName: 'Price',
        width: 100,
        renderCell: (p) =>
          p.value != null ? `₹${(p.value as number).toLocaleString('en-IN')}` : '—',
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
