import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  GridCallbackDetails,
  GridColDef,
  GridFilterModel,
} from '@mui/x-data-grid';
import {
  IconFolders,
  IconPlus,
  IconRefresh,
  IconBuilding,
  IconContract,
  IconPointFilled,
  IconEye,
  IconSettings,
  IconTrash,
  IconAlertTriangle,
} from '@tabler/icons-react';
import moment from 'moment';

import CustomDataGrid from '../../../components/datagrid/DataGrid';
import { tokens } from '../../../theme/theme';
import { dateFormate2 } from '../../../components/constants';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import {
  getProject,
  hardDeleteProject,
  projectsList,
  type HardDeleteProjectSummary,
} from '../../../services/projectApi';
import { organizationsList } from '../../../services/organizationApi';
import { IProject, ProjectStatus } from '../../../Interfaces/project';
import { IOrganization } from '../../../Interfaces/organization';
import PersonPill from '../../../components/ui/PersonPill';
import AddProjectDialog from './AddProjectDialog';
import ProjectDrawer from './ProjectDrawer';
import OrganizationTabs from './OrganizationTabs';
import OrganizationFormDialog from './OrganizationFormDialog';
import InvoiceEmailSettingsDrawer from './InvoiceEmailSettingsDrawer';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../../Interfaces/iUser';

const MotionBox = motion.create(Box);

// Each project status gets a distinct chip color pulled from the brand palette.
const STATUS_COLORS: Record<ProjectStatus, string> = {
  Active: '#10B981',
  'On Hold': '#F59E0B',
  Ended: '#0A3555',
  Terminated: '#EF4444',
};

function StatusChip({ status }: { status?: string }) {
  const s = (status as ProjectStatus) || 'Active';
  const color = STATUS_COLORS[s] || '#5A6A85';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.375,
        borderRadius: '6px',
        bgcolor: alpha(color, 0.1),
        color,
        height: 26,
      }}
    >
      <IconPointFilled size={10} />
      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
        {s}
      </Typography>
    </Box>
  );
}

function firstRateLabel(rate?: unknown[]): string {
  if (!Array.isArray(rate) || rate.length === 0) return '—';
  const r = rate[0] as { value?: string | number; currency?: string } | string;
  if (typeof r === 'string') return r;
  if (r && typeof r === 'object') {
    const v = r.value != null ? String(r.value) : '';
    const cur = r.currency || '';
    return [cur, v].filter(Boolean).join(' ') || '—';
  }
  return '—';
}

function firstArrayLabel(val?: unknown[]): string {
  if (!Array.isArray(val) || val.length === 0) return '—';
  const r = val[0] as { value?: string | number } | string;
  if (typeof r === 'string') return r;
  if (r && typeof r === 'object' && r.value != null) return String(r.value);
  return '—';
}

// A zero ObjectId — valid format, guaranteed never to match any real doc. We
// pass this as the org filter on the first render so the project list fetch
// returns an empty page instead of "all projects", which used to flash the
// full dataset before the real org resolved.
const NO_MATCH_OBJECT_ID = '000000000000000000000000';

export default function Projects() {
  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<IProject | undefined>();
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);

  // Role gate: PC can browse orgs but not add/edit. Server also enforces
  // this via the route guard — the UI just hides the affordances.
  const { iUser } = useAuth();
  const canManageOrgs =
    iUser?.role?.includes(UserRole['super-admin']) ||
    iUser?.role?.includes(UserRole.admin) ||
    false;
  // Hard-delete is destructive + cascades to timesheets / invoices /
  // storage — super-admin only. Matches the server route guard.
  const isSuperAdmin = !!iUser?.role?.includes(UserRole['super-admin']);
  const [deleteTarget, setDeleteTarget] = useState<IProject | undefined>();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [lastDeleteSummary, setLastDeleteSummary] = useState<
    HardDeleteProjectSummary | undefined
  >();

  // Organization state
  const [orgs, setOrgs] = useState<IOrganization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgsLoaded, setOrgsLoaded] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [orgDialogInitial, setOrgDialogInitial] = useState<
    IOrganization | undefined
  >(undefined);
  const [orgCounts, setOrgCounts] = useState<Record<string, number>>({});

  // Deep-link support: `/projects?project=<id>&tab=timesheets&period=YYYY-MM`
  // sent by emails (e.g. the timesheet-approval Review button) auto-opens
  // the drawer on the right tab + month.
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialDrawerTab, setInitialDrawerTab] = useState<
    'timesheets' | 'invoices' | 'overview' | undefined
  >();
  const [initialPeriodMonth, setInitialPeriodMonth] = useState<string | undefined>();

  const loadOrgs = useCallback(async () => {
    try {
      const res = await organizationsList(`active=true&limit=200`);
      const list = res.data?.data?.results || [];
      setOrgs(list);
      setActiveOrgId((prev) => {
        if (prev && list.some((o) => o._id === prev)) return prev;
        return list[0]?._id ?? null;
      });
    } finally {
      setOrgsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  // One-shot deep-link resolver. Pulls ?project, ?tab, ?period from the URL
  // (sent by email CTAs), fetches the project, points the org tab at its
  // organization, and opens the drawer on the requested tab. Clears the
  // params after consumption so reloads don't re-fire.
  useEffect(() => {
    const pid = searchParams.get('project');
    if (!pid) return;
    const tab = searchParams.get('tab') as
      | 'timesheets'
      | 'invoices'
      | 'overview'
      | null;
    const period = searchParams.get('period') || undefined;

    let cancelled = false;
    (async () => {
      try {
        const res = await getProject(pid);
        const p = res.data?.data;
        if (!p || cancelled) return;
        if (p.organizationRef) setActiveOrgId(p.organizationRef);
        setInitialDrawerTab(tab || 'timesheets');
        setInitialPeriodMonth(period);
        setSelected(p);
        setDrawerOpen(true);
      } catch {
        toast.error('Could not open the linked project');
      } finally {
        // Clear the params regardless so refresh doesn't loop. Kept inside
        // the async so the read above is stable.
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete('project');
          next.delete('tab');
          next.delete('period');
          setSearchParams(next, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For org-tab counts, pull a lightweight project list once and group by org.
  const loadOrgCounts = useCallback(async () => {
    const res = await projectsList(`limit=2000`);
    const list = (res.data?.data?.results || []) as IProject[];
    const counts: Record<string, number> = {};
    for (const p of list) {
      const id = (p.organizationRef as string) || '__none__';
      counts[id] = (counts[id] || 0) + 1;
    }
    setOrgCounts(counts);
  }, []);

  useEffect(() => {
    loadOrgCounts();
  }, [loadOrgCounts]);

  const {
    gridData,
    paginationModel,
    error,
    loading,
    setSearchModel,
    setPaginationModel,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: projectsList,
      // Until an org resolves, filter by a sentinel ObjectId that matches
      // nothing — prevents the initial unfiltered "all projects" flash.
      queryParams: `organizationRef=${activeOrgId || NO_MATCH_OBJECT_ID}`,
    },
    [activeOrgId]
  );

  const results: IProject[] = (gridData?.results as IProject[]) || [];

  const stats = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      Active: 0,
      'On Hold': 0,
      Ended: 0,
      Terminated: 0,
    };
    for (const p of results) {
      const s = (p.status as ProjectStatus) || 'Active';
      if (s in counts) counts[s]++;
    }
    return counts;
  }, [results]);

  const handleOpen = (row: IProject) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const handleChangeFilterModel = (
    model: GridFilterModel,
    _: GridCallbackDetails<'filter'>
  ) => {
    const iModel =
      model.items[0]?.value || model.quickFilterValues?.length
        ? model
        : initialSearchModel;
    setSearchModel(iModel);
  };

  const handleProjectUpdated = (updated: IProject) => {
    setSelected(updated);
    setResults((prev) =>
      prev.map((p) => ((p as IProject)._id === updated._id ? updated : p))
    );
  };

  const handleProjectCreated = (created: IProject) => {
    setResults((prev) => [created, ...prev]);
    setAddOpen(false);
    setSelected(created);
    setDrawerOpen(true);
    // Bump the org counts for the active org so the tab chip updates.
    if (activeOrgId) {
      setOrgCounts((c) => ({ ...c, [activeOrgId]: (c[activeOrgId] || 0) + 1 }));
    }
  };

  const handleOrgSaved = (org: IOrganization) => {
    setOrgs((prev) => {
      const existing = prev.find((o) => o._id === org._id);
      if (existing) return prev.map((o) => (o._id === org._id ? org : o));
      return [...prev, org];
    });
    setActiveOrgId(org._id);
    setOrgDialogOpen(false);
    setOrgDialogInitial(undefined);
  };

  const activeOrg = orgs.find((o) => o._id === activeOrgId) || null;

  const columns: GridColDef<IProject>[] = [
    {
      field: 'view',
      headerName: '',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="contained"
          startIcon={<IconEye size={14} />}
          onClick={() => handleOpen(row)}
          sx={{
            background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            minWidth: 'auto',
            '&:hover': {
              background: 'linear-gradient(135deg, #0A3555 0%, #032840 100%)',
              boxShadow: `0 4px 12px ${alpha('#032840', 0.25)}`,
            },
          }}
        >
          View
        </Button>
      ),
    },
    {
      field: 'projectId',
      headerName: 'Project ID',
      width: 120,
      renderCell: ({ row }) => (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            color: tokens.colors.pinkDark,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
          onClick={() => handleOpen(row)}
        >
          {row.projectId}
        </Typography>
      ),
    },
    {
      field: 'reqID',
      headerName: 'Req ID',
      width: 110,
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ color: '#0A3555', fontWeight: 600 }}>
          {row.reqID}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ row }) => <StatusChip status={row.status} />,
    },
    {
      field: 'clientCompany',
      headerName: 'Client',
      width: 180,
      renderCell: ({ row }) =>
        row.clientCompany ? (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(tokens.colors.blue, 0.1),
                color: tokens.colors.blueDark,
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555', minWidth: 0 }}
            >
              {row.clientCompany}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'vendorCompany',
      headerName: 'Vendor',
      width: 160,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.82rem' }}>
          {row.vendorCompany || '—'}
        </Typography>
      ),
    },
    {
      field: 'primeVendorCompany',
      headerName: 'Prime Vendor',
      width: 160,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.82rem' }}>
          {row.primeVendorCompany || '—'}
        </Typography>
      ),
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 600, color: tokens.colors.lightText }}
        >
          {firstRateLabel(row.rate)}
        </Typography>
      ),
    },
    {
      field: 'taxType',
      headerName: 'Tax Term',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.82rem' }}>
          {firstArrayLabel(row.taxType)}
        </Typography>
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.82rem' }}>
          {firstArrayLabel(row.duration)}
        </Typography>
      ),
    },
    {
      field: 'consultant',
      headerName: 'Consultant',
      width: 180,
      renderCell: ({ row }) => <PersonPill name={row.consultant || '—'} />,
    },
    {
      field: 'contracts',
      headerName: 'Contracts',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const n = row.contracts?.length || 0;
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconContract size={14} color={tokens.colors.pink} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tokens.colors.pinkDark }}>
              {n}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'startDate',
      headerName: 'Start',
      width: 120,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.8rem' }}>
          {row.startDate ? moment(row.startDate).format(dateFormate2) : '—'}
        </Typography>
      ),
    },
    {
      field: 'endDate',
      headerName: 'End',
      width: 120,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.8rem' }}>
          {row.endDate ? moment(row.endDate).format(dateFormate2) : '—'}
        </Typography>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            field: '_actions',
            headerName: '',
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: ({ row }: { row: IProject }) => (
              <Tooltip title="Delete permanently (super-admin)" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmText('');
                    setLastDeleteSummary(undefined);
                    setDeleteTarget(row);
                  }}
                  sx={{
                    color: '#DC2626',
                    '&:hover': { bgcolor: alpha('#DC2626', 0.08) },
                  }}
                >
                  <IconTrash size={16} />
                </IconButton>
              </Tooltip>
            ),
          } as GridColDef<IProject>,
        ]
      : []),
  ];

  const dataGridHeader = (
    <Box sx={{ width: '100%' }}>
      <OrganizationTabs
        orgs={orgs}
        activeId={activeOrgId}
        counts={orgCounts}
        canManage={canManageOrgs}
        onChange={setActiveOrgId}
        onAdd={() => {
          setOrgDialogInitial(undefined);
          setOrgDialogOpen(true);
        }}
        onEdit={(org) => {
          setOrgDialogInitial(org);
          setOrgDialogOpen(true);
        }}
      />
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
        }}
      >
        {/* Glow orbs — blue + yellow so Projects has its own silhouette,
            distinct from Interviews' pink/blue and Salary's pink/yellow. */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.28)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -70,
            left: '20%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
                color: '#032840',
                boxShadow: tokens.shadows.blueGlow,
              }}
            >
              <IconFolders size={24} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                PROJECTS · CONTRACTS · TRACKING
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.15 }}>
                Project{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  command
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}>
                {gridData?.totalDocuments ?? 0} tracked · add from a requirement to freeze its terms
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Stack direction="row" spacing={0.75}>
              {(['Active', 'On Hold', 'Ended', 'Terminated'] as ProjectStatus[]).map(
                (s) => (
                  <Box
                    key={s}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: alpha(STATUS_COLORS[s], 0.18),
                      border: `1px solid ${alpha(STATUS_COLORS[s], 0.35)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <IconPointFilled size={10} color={STATUS_COLORS[s]} />
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#fff',
                      }}
                    >
                      {stats[s]}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        color: alpha('#fff', 0.7),
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s}
                    </Typography>
                  </Box>
                )
              )}
            </Stack>

            <Button
              variant="contained"
              startIcon={<IconPlus size={16} />}
              onClick={() => setAddOpen(true)}
              disabled={!activeOrg}
              size="medium"
              sx={{
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.5,
                py: 0.9,
                boxShadow: `0 6px 16px ${alpha(tokens.colors.pink, 0.35)}`,
                '&:hover': {
                  background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                  boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.45)}`,
                },
                '&.Mui-disabled': {
                  background: alpha('#fff', 0.2),
                  color: alpha('#fff', 0.4),
                },
              }}
            >
              Add project
            </Button>
            <Tooltip title="Refresh">
              <IconButton
                onClick={reload}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconRefresh
                  size={18}
                  className={loading ? 'sync-icon-loading' : ''}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Invoice email templates">
              <IconButton
                onClick={() => setEmailSettingsOpen(true)}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconSettings size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>
    </Box>
  );

  return (
    <>
      <CustomDataGrid
        header={dataGridHeader}
        rows={results as unknown as Record<string, string | number | boolean | undefined>[] & { _id: string }[]}
        columns={columns}
        loading={loading || !orgsLoaded}
        error={error}
        retry={reload}
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={handleChangeFilterModel}
      />

      <AddProjectDialog
        open={addOpen}
        organization={activeOrg}
        onClose={() => setAddOpen(false)}
        onCreated={handleProjectCreated}
      />

      <OrganizationFormDialog
        open={orgDialogOpen}
        initial={orgDialogInitial}
        onClose={() => {
          setOrgDialogOpen(false);
          setOrgDialogInitial(undefined);
        }}
        onSaved={handleOrgSaved}
      />

      <ProjectDrawer
        open={drawerOpen}
        project={selected}
        initialTab={initialDrawerTab}
        initialPeriodMonth={initialPeriodMonth}
        onClose={() => {
          setDrawerOpen(false);
          // Clear deep-link hints after the drawer closes so the next manual
          // open doesn't snap back to the email-linked tab.
          setInitialDrawerTab(undefined);
          setInitialPeriodMonth(undefined);
        }}
        onUpdated={handleProjectUpdated}
      />

      <InvoiceEmailSettingsDrawer
        open={emailSettingsOpen}
        onClose={() => setEmailSettingsOpen(false)}
      />

      {/* ── Super-admin: permanent delete confirmation ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => (deleting ? undefined : setDeleteTarget(undefined))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#B91C1C',
          }}
        >
          <IconAlertTriangle size={20} />
          Delete project permanently
        </DialogTitle>
        <DialogContent>
          {lastDeleteSummary ? (
            <Alert severity="success" sx={{ mb: 1 }}>
              Deleted. Removed{' '}
              <strong>{lastDeleteSummary.counts.timesheets}</strong> timesheets,{' '}
              <strong>{lastDeleteSummary.counts.approvals}</strong> approvals,{' '}
              <strong>{lastDeleteSummary.counts.invoices}</strong> invoices,{' '}
              <strong>{lastDeleteSummary.counts.notifications}</strong>{' '}
              notifications, and{' '}
              <strong>{lastDeleteSummary.counts.s3Deleted}</strong> stored files
              {lastDeleteSummary.counts.s3Failed
                ? ` (${lastDeleteSummary.counts.s3Failed} file deletion${lastDeleteSummary.counts.s3Failed === 1 ? '' : 's'} failed — object storage may have transient errors, DB is clean).`
                : '.'}
            </Alert>
          ) : (
            <>
              <Alert severity="warning" icon={<IconAlertTriangle size={18} />} sx={{ mb: 2 }}>
                This is irreversible. Every associated Timesheet, Timesheet
                Approval, Invoice, notification, and every uploaded file
                (contracts, documentation, timesheet screenshots, invoice PDFs)
                will be permanently removed.
              </Alert>
              <Typography sx={{ fontSize: 14, mb: 1.5 }}>
                To confirm, type the project ID{' '}
                <Box component="span" sx={{ fontWeight: 800, color: '#B91C1C' }}>
                  {deleteTarget?.projectId}
                </Box>{' '}
                below.
              </Typography>
              <TextField
                fullWidth
                size="small"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget?.projectId}
                disabled={deleting}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {lastDeleteSummary ? (
            <Button
              variant="contained"
              onClick={() => {
                setDeleteTarget(undefined);
                setLastDeleteSummary(undefined);
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setDeleteTarget(undefined)}
                disabled={deleting}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={
                  deleting ||
                  !deleteTarget ||
                  deleteConfirmText.trim() !== deleteTarget.projectId
                }
                startIcon={
                  deleting ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <IconTrash size={16} />
                  )
                }
                onClick={async () => {
                  if (!deleteTarget) return;
                  setDeleting(true);
                  try {
                    const res = await hardDeleteProject(String(deleteTarget._id));
                    const summary = res.data?.data;
                    setLastDeleteSummary(summary);
                    toast.success(`Deleted ${deleteTarget.projectId}`);
                    // Close the drawer if it happened to be showing the
                    // just-deleted project, and refresh the grid.
                    if (selected?._id === deleteTarget._id) setSelected(undefined);
                    reload();
                  } catch (err) {
                    const msg =
                      (err as { response?: { data?: { error?: string } } })
                        ?.response?.data?.error || 'Could not delete project';
                    toast.error(msg);
                  } finally {
                    setDeleting(false);
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Delete permanently
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
