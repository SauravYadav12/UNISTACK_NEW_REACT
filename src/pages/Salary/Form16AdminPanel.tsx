import { useMemo, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, FormControl, IconButton,
  InputLabel, MenuItem, Select, Stack, Tooltip, Typography, alpha,
} from '@mui/material';
import {
  DataGrid, GridColDef,
} from '@mui/x-data-grid';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconUpload, IconRocket, IconDownload, IconEye, IconEyeOff, IconTrash,
  IconRefresh, IconCheck, IconAlertCircle,
} from '@tabler/icons-react';

import { tokens } from '../../theme/theme';
import { useFetchData } from '../../hooks/fetchDataHook';
import {
  listForm16, publishForm16, unpublishForm16,
  deleteForm16,
} from '../../services/form16Api';
import { usersList } from '../../services/authApi';
import { Form16 } from '../../Interfaces/form16';
import { UserRole } from '../../Interfaces/iUser';
import {
  getCurrentFYStart, getFYLabel,
} from '../../utils/fiscalYearUtil';
import UploadForm16Drawer from '../../components/form16/UploadForm16Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const FY_OPTIONS = (() => {
  const current = getCurrentFYStart();
  return Array.from({ length: 8 }, (_, i) => current - i);
})();

interface RawUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
  role?: UserRole[];
}

interface RowData {
  id: string;
  userId: string;
  name: string;
  email: string;
  form16?: Form16;
}

/**
 * Super-admin grid for Form-16 management. One row per active
 * employee. Status chip per row: Not uploaded / Draft / Published.
 * Row actions: Upload (opens drawer pre-mapped to this employee),
 * Publish/Unpublish, Download, Delete (with S3 cleanup server-side).
 *
 * Top action cluster:
 *  - "Upload" (opens drawer with no pre-mapped employee)
 *  - "Publish all (FY 2024–25)" — bulk-flips every Draft for the FY
 *  - "Refresh"
 */
export default function Form16AdminPanel() {
  const [fyStart, setFyStart] = useState<number>(getCurrentFYStart());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteCandidate, setDeleteCandidate] = useState<Form16 | null>(null);
  // Per-row busy keyed by form16 id so a row action doesn't freeze
  // the whole grid.
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  // Pull every active user once per refresh — the grid joins them
  // with the FY-filtered form16 list client-side.
  const usersState = useFetchData<RawUser[]>(async () => {
    try {
      const { data } = await usersList('active=true');
      return (data.users || []) as RawUser[];
    } catch {
      return [];
    }
  }, [refreshKey]);

  // Form-16 docs for the selected FY (both Draft + Published; the
  // chip column shows which is which).
  const docsState = useFetchData<Form16[]>(async () => {
    try {
      const { data } = await listForm16({ fiscalYearStart: fyStart });
      return data || [];
    } catch {
      return [];
    }
  }, [fyStart, refreshKey]);

  const loading = usersState.loading || docsState.loading;

  // Build the joined row set: one row per active employee, attaching
  // the form16 doc (if any) for the selected FY. Inactive users are
  // excluded since active=true is passed to usersList above.
  const rows = useMemo<RowData[]>(() => {
    const users = usersState.data || [];
    const docs = docsState.data || [];
    const docByUser = new Map<string, Form16>();
    docs.forEach((d) => docByUser.set(String(d.user), d));
    return users
      // Skip super-admins from the Form-16 surface — they're not
      // employees in the payroll sense.
      .filter((u) => !u.role?.includes(UserRole['super-admin']))
      .map<RowData>((u) => ({
        id: u._id,
        userId: u._id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Employee',
        email: u.email || '',
        form16: docByUser.get(u._id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [usersState.data, docsState.data]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function handlePublishRow(row: RowData) {
    if (!row.form16) return;
    setRowBusyId(row.form16._id);
    try {
      await publishForm16(row.form16._id);
      toast.success(`Published Form-16 for ${row.name}.`);
      refresh();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Publish failed.',
      );
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleUnpublishRow(row: RowData) {
    if (!row.form16) return;
    setRowBusyId(row.form16._id);
    try {
      await unpublishForm16(row.form16._id);
      toast.success(`Unpublished Form-16 for ${row.name}.`);
      refresh();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Unpublish failed.',
      );
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    setRowBusyId(deleteCandidate._id);
    try {
      await deleteForm16(deleteCandidate._id);
      toast.success(`Deleted ${deleteCandidate.employeeName}'s Form-16.`);
      refresh();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Delete failed.',
      );
    } finally {
      setRowBusyId(null);
      setDeleteCandidate(null);
    }
  }

  const columns: GridColDef<RowData>[] = useMemo<GridColDef<RowData>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Employee',
        flex: 1.4,
        minWidth: 200,
        // Multi-line cell (name + email). Keep left so the two lines
        // align cleanly with the column header.
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ row }) => (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.name}</Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: tokens.colors.lightTextSecondary,
                lineHeight: 1.2,
              }}
            >
              {row.email}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 150,
        // Short content (chip, date, icon row) reads cleanly when the
        // header and cell share the same centred anchor. Without this,
        // small content sits at the cell's left edge while the header
        // sits at its own left edge — the eye reads them as misaligned.
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => {
          const doc = row.form16;
          const chip = !doc ? (
            <Chip
              size="small"
              label="Not uploaded"
              variant="outlined"
              sx={{ color: tokens.colors.lightTextSecondary }}
            />
          ) : doc.published ? (
            <Chip
              size="small"
              color="success"
              icon={<IconCheck size={12} />}
              label="Published"
            />
          ) : (
            <Chip
              size="small"
              color="warning"
              icon={<IconAlertCircle size={12} />}
              label="Draft"
            />
          );
          return (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {chip}
            </Box>
          );
        },
      },
      {
        field: 'uploaded',
        headerName: 'Uploaded',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          // Block-level Typography fills the cell and its text aligns
          // left by default — even when the column has align:'center'.
          // Wrap in a flex Box that fills the cell so the date sits
          // dead-centre both horizontally and vertically.
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {row.form16 ? (
              <Tooltip title={row.form16.originalFilename || ''}>
                <Typography sx={{ fontSize: 12 }}>
                  {moment(row.form16.uploadedAt).format('DD MMM YYYY')}
                </Typography>
              </Tooltip>
            ) : (
              <span>—</span>
            )}
          </Box>
        ),
      },
      {
        field: 'published',
        headerName: 'Published on',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {row.form16?.publishedAt ? (
              <Typography sx={{ fontSize: 12 }}>
                {moment(row.form16.publishedAt).format('DD MMM YYYY')}
              </Typography>
            ) : (
              <span>—</span>
            )}
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 260,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => {
          const doc = row.form16;
          const busy = doc && rowBusyId === doc._id;
          return (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {doc && (
                <Tooltip title="Open PDF">
                  <IconButton
                    size="small"
                    component="a"
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconEye size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {doc && (
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    component="a"
                    href={doc.fileUrl}
                    download={doc.originalFilename}
                  >
                    <IconDownload size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {doc && !doc.published && (
                <Tooltip title="Publish">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handlePublishRow(row)}
                      disabled={busy}
                    >
                      {busy ? <CircularProgress size={14} /> : <IconRocket size={16} />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {doc && doc.published && (
                <Tooltip title="Unpublish">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleUnpublishRow(row)}
                      disabled={busy}
                    >
                      {busy ? <CircularProgress size={14} /> : <IconEyeOff size={16} />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {doc && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => setDeleteCandidate(doc)}
                    sx={{ color: '#EF4444' }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
    ],
    [rowBusyId],
  );

  return (
    <Box>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Financial year</InputLabel>
            <Select
              value={fyStart}
              label="Financial year"
              onChange={(e) => setFyStart(Number(e.target.value))}
            >
              {FY_OPTIONS.map((fy) => (
                <MenuItem key={fy} value={fy}>
                  FY {getFYLabel(fy)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh} disabled={loading}>
              <IconRefresh size={18} className={loading ? 'sync-icon-loading' : ''} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1.25}>
          <Button
            variant="contained"
            startIcon={<IconUpload size={16} />}
            onClick={() => setDrawerOpen(true)}
            sx={{
              bgcolor: tokens.colors.pink,
              '&:hover': { bgcolor: tokens.colors.pinkDark },
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Upload Form-16
          </Button>
        </Stack>
      </Stack>

      {/* ── Grid ───────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden',
          boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns as GridColDef[]}
          loading={loading}
          autoHeight
          disableColumnSorting={false}
          getRowId={(r) => r.id}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F6F9FC',
              borderBottom: '1px solid',
              borderColor: 'grey.200',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: '#2A3547',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>

      {/* ── Helpers ────────────────────────────────────────────── */}
      <Box sx={{ mt: 1.5 }}>
        <Typography
          sx={{
            fontSize: 11,
            color: tokens.colors.lightTextSecondary,
            fontStyle: 'italic',
          }}
        >
          Tip: drop the entire TRACES ZIP into the Upload drawer — we&rsquo;ll
          extract every PDF and match by PAN automatically.
        </Typography>
      </Box>

      {/* ── Upload drawer ──────────────────────────────────────── */}
      <UploadForm16Drawer
        open={drawerOpen}
        defaultFYStart={fyStart}
        onClose={() => setDrawerOpen(false)}
        onUploaded={refresh}
      />

      {/* ── Confirm: delete row ────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteCandidate}
        title="Delete this Form-16?"
        description={
          deleteCandidate
            ? `${deleteCandidate.employeeName}'s Form-16 for FY ${getFYLabel(
                deleteCandidate.fiscalYearStart,
              )} will be removed and the underlying PDF deleted from storage. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}

// Unused alpha import — silences a future lint if the panel grows; the
// import lives here so contributors can easily reach for it.
void alpha;
