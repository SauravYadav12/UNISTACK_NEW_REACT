import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GridCallbackDetails,
  GridColDef,
  GridFilterModel,
} from '@mui/x-data-grid';
import { Sync } from '@mui/icons-material';
import SyncIcon from '@mui/icons-material/Sync';
import {
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCheck,
  IconCopy,
  IconEye,
  IconRefresh,
  IconTrash,
  IconUsersPlus,
} from '@tabler/icons-react';

import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import RequirementMeta from '../../../components/requirement/RequirementMeta';
import AssignRequirementDrawer from '../../../components/requirement/AssignRequirementDrawer';
import PipelineSnapshot from '../../../components/requirement/PipelineSnapshot';
import PersonPill from '../../../components/ui/PersonPill';
import { dateFormate2 } from '../../../components/constants';

import RequirementsForm from './RequirementsForm';
import {
  reqirementStatusColors,
  requirementFormInitialValues,
} from './requirementsValues';

import {
  listChildAssignments,
  requirementCounts,
  requirementsList,
} from '../../../services/requirementApi';
import { archiveRequirementsList } from '../../../services/archivesApi';
import { usersList } from '../../../services/authApi';
import { consultantsList } from '../../../services/consultantApi';

import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import { useFetchData } from '../../../hooks/fetchDataHook';

import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { syncDataById } from '../../../utils/syncDataById';
import { separateByDates } from '../../../utils/dataGrid.util';
import { useRequirementAiChat } from '../../../context/RequirementAiChatContext';

import { iUser, UserRole } from '../../../Interfaces/iUser';
import { IRequirement, RequirementStatus } from '../../../Interfaces/types';

const MotionBox = motion.create(Box);

// ── Shape used for grid rows (mirrors IRequirement, plus display flags) ──
type Row = IRequirement & {
  dateSeparator?: boolean;
  count?: number;
  fromDate?: string;
  isChildRow?: boolean;
};

export default function Requirements() {
  const { isModuleAllowed, iUser } = useAuth();
  const { pendingAiPrefill, clearPendingAiPrefill } = useRequirementAiChat();
  const [searchParams, setSearchParams] = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [viewData, setViewData] = useState<IRequirement>();
  const [reqToCopy, setReqToCopy] = useState<Partial<IRequirement>>();
  const [mode, setMode] = useState<FormMode>('view');
  const [duplicateReqDrawer, setDuplicateReqDrawer] = useState<string>();
  const [archive, setArchive] = useState(false);
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  const [childReqDrawer, setChildReqDrawer] = useState<string>();

  // ── Parent/child expansion state ──
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set()
  );
  const [childrenMap, setChildrenMap] = useState<
    Map<string, IRequirement[]>
  >(new Map());
  const [loadingChildrenFor, setLoadingChildrenFor] = useState<Set<string>>(
    new Set()
  );

  // ── Assign drawer state ──
  const [assignFor, setAssignFor] = useState<IRequirement | null>(null);

  const accountsState = useFetchData<iUser[]>(getAccountList, []);
  const { data: accounts } = accountsState;
  const consultantsState = useFetchData(getConsultantsList, []);
  const { data: consultants } = consultantsState;
  const formStateLoading = accountsState.loading || consultantsState.loading;
  const formStateError = accountsState.error || consultantsState.error;

  const isArchiveRequirementModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Requirements)
  );

  const userRoles = iUser?.role || [];
  const isParentEditor =
    userRoles.includes(UserRole['super-admin']) ||
    userRoles.includes(UserRole.admin) ||
    userRoles.includes(UserRole.support);

  // ── Pipeline snapshot active status from URL search param ──
  const activeReqStatus = searchParams.get('reqStatus') || '';

  const handlePipelineStatusChange = (status: string) => {
    setSearchParams(
      (prev) => {
        if (!status) prev.delete('reqStatus');
        else prev.set('reqStatus', status);
        return prev;
      },
      { replace: true }
    );
  };

  // ── Child expand helpers ──
  const toggleExpandParent = async (row: IRequirement) => {
    const reqID = row.reqID;
    if (!reqID) return;

    const isExpanded = expandedParents.has(reqID);
    // Collapse — just drop from the set.
    if (isExpanded) {
      setExpandedParents((prev) => {
        const next = new Set(prev);
        next.delete(reqID);
        return next;
      });
      return;
    }

    // Expand — fetch if we haven't loaded before.
    if (!childrenMap.has(reqID)) {
      setLoadingChildrenFor((prev) => new Set(prev).add(reqID));
      try {
        const res = await listChildAssignments(reqID);
        const results =
          (res.data.data?.results as IRequirement[] | undefined) || [];
        setChildrenMap((prev) => {
          const next = new Map(prev);
          next.set(reqID, results);
          return next;
        });
      } catch (e) {
        console.error('Failed to load child assignments for', reqID, e);
        setChildrenMap((prev) => {
          const next = new Map(prev);
          next.set(reqID, []);
          return next;
        });
      } finally {
        setLoadingChildrenFor((prev) => {
          const next = new Set(prev);
          next.delete(reqID);
          return next;
        });
      }
    }
    setExpandedParents((prev) => new Set(prev).add(reqID));
  };

  // ── Grid pagination ──
  const {
    gridData,
    paginationModel,
    error,
    loading,
    setSearchModel,
    setPaginationModel,
    setGridData,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: archive ? getArchiveRequirements : getRequirements,
      queryParams: searchParams.toString(),
    },
    [archive]
  );

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // ── pendingAiPrefill: open drawer in Add mode with merged values ──
  useEffect(() => {
    if (!pendingAiPrefill) return;

    const merged: Partial<IRequirement> = {
      ...requirementFormInitialValues,
      ...pendingAiPrefill,
      reqEnteredBy: `${iUser?.firstName ?? ''} ${iUser?.lastName ?? ''}`.trim(),
      reqEnteredByRef: `${iUser?.id ?? ''}`,
    };

    delete (merged as Partial<IRequirement & { _id?: string }>)._id;
    delete merged.reqID;
    delete merged.createdAt;
    delete merged.updatedAt;

    setViewData(undefined);
    setFormTitle('Add New Requirement');
    setMode('add');
    setReqToCopy(merged);
    setDrawerOpen(true);
    clearPendingAiPrefill();
  }, [pendingAiPrefill, iUser, clearPendingAiPrefill]);

  // ── Data fetching (same as legacy, with counts for date separators) ──
  async function fetchRequirementsData(
    isArchive: boolean,
    query?: string,
    signal?: AbortSignal
  ) {
    const apiFunction = isArchive ? archiveRequirementsList : requirementsList;
    const res = await apiFunction(query, signal);

    let result = separateByDates(res.data.data?.results || []);
    const formate = (d: string) => moment(d).format('YYYY-MM-DD');
    const dates = result
      .filter((r) => !!r.dateSeparator)
      .map((d) => d.fromDate)
      .map((d) => formate(d));

    const counts = await requirementCounts(dates, query, isArchive, signal);

    result = result.map((r) => {
      if (r.dateSeparator) {
        const countObj = counts.data?.find(
          (c) => c.date === formate(r.fromDate)
        );
        return { ...r, count: countObj ? countObj.count : 0 };
      }
      return r;
    });

    if (res.data.data) {
      res.data.data.results = result;
    }

    setArchive(isArchive);
    return res;
  }

  async function getRequirements(query?: string, signal?: AbortSignal) {
    return fetchRequirementsData(false, query, signal);
  }

  async function getArchiveRequirements(query?: string, signal?: AbortSignal) {
    return fetchRequirementsData(true, query, signal);
  }

  async function getAccountList() {
    const { data } = await usersList('active=true');
    const { users } = data;
    return users;
  }

  async function getConsultantsList() {
    const { data } = await consultantsList(
      `consultantStatus=Active&limit=5000`
    );
    return data.data?.results || [];
  }

  const onChangeArchiveButton = (status: boolean) => {
    setArchive(status);
    setGridData(undefined);
    // Reset expansion state — the children under archive vs live are disjoint.
    setExpandedParents(new Set());
    setChildrenMap(new Map());
  };

  const handleViewDetails = (row: IRequirement) => {
    const data =
      gridData?.results?.find((r) => r.reqID === row.reqID) ||
      // fall back to a child in one of the cached maps
      Array.from(childrenMap.values())
        .flat()
        .find((c) => c.reqID === row.reqID);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Requirement ID: ${row.reqID}`);
    setMode('view');
    setDrawerOpen(true);
    if (!archive) {
      syncDataById(data, {
        queryFunction: requirementsList,
        setViewData,
        setResults,
      });
    }
  };

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };

  const handleAddNew = () => {
    setFormTitle('Add New Requirement');
    setViewData(undefined);
    setMode('add');
    setDrawerOpen(true);
  };

  const handleCopy = () => {
    if (!viewData) return;
    setMode('add');
    setFormTitle('Add New Requirement');

    const copy: Partial<IRequirement & { __v?: string }> = {
      ...viewData,
      reqEnteredBy: `${iUser?.firstName} ${iUser?.lastName}`,
      reqEnteredByRef: `${iUser?.id}`,
      isDuplicate: 'true',
      duplicateWith: viewData.reqID,
      rate: [],
      taxType: [],
      remote: [],
      duration: [],
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    delete copy.parentReqID;
    delete copy.childSuffix;
    setReqToCopy({ ...copy });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setReqToCopy(undefined);
    setDuplicateReqDrawer(undefined);
    setViewData(undefined);
    setSnapshotRefreshKey((k) => k + 1);
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

  const handleRefreshAll = () => {
    setGridData(undefined);
    reload();
    setSnapshotRefreshKey((k) => k + 1);
    // Clear cached children so next expand is fresh.
    setChildrenMap(new Map());
    setExpandedParents(new Set());
  };

  // ── Row synthesis: splice cached children in right after their expanded parent ──
  const displayRows = useMemo<Row[]>(() => {
    const src = (gridData?.results as Row[] | undefined) || [];
    const out: Row[] = [];
    for (const r of src) {
      out.push(r);
      if (r.dateSeparator) continue;
      if (r.parentReqID) continue; // child rows can surface in filtered lists — don't re-splice
      if (!r.reqID) continue;
      if (!expandedParents.has(r.reqID)) continue;
      const kids = childrenMap.get(r.reqID) || [];
      const sortedKids = [...kids].sort((a, b) =>
        (a.childSuffix || '').localeCompare(b.childSuffix || '')
      );
      for (const kid of sortedKids) {
        out.push({ ...kid, isChildRow: true });
      }
    }
    return out;
  }, [gridData?.results, expandedParents, childrenMap]);

  // ── Columns ──
  const columns: GridColDef<Row>[] = [
    {
      field: 'expand',
      headerName: '',
      width: 50,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (row.isChildRow) return null;
        if (row.parentReqID) return null; // child surfaced by filter — no chevron
        const isLoading = loadingChildrenFor.has(row.reqID || '');
        const isOpen = expandedParents.has(row.reqID || '');
        const cached = childrenMap.get(row.reqID || '');
        const count = cached?.length ?? 0;
        return (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandParent(row);
              }}
              sx={{
                color: tokensAwareIconColor(isOpen),
                '&:hover': { bgcolor: 'rgba(55, 183, 234, 0.08)' },
              }}
            >
              {isLoading ? (
                <CircularProgress size={14} />
              ) : isOpen ? (
                <IconChevronDown size={18} />
              ) : (
                <IconChevronRight size={18} />
              )}
            </IconButton>
            {count > 0 && !isOpen && (
              <Chip
                label={`+${count}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(236, 69, 153, 0.12)',
                  color: '#DB2777',
                }}
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: 'view',
      headerName: '',
      width: 90,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.dateSeparator) {
          const { count = 0, fromDate } = row;
          return (
            <Box display="flex" alignItems="center" height="25px">
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#1A9FD4',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {fromDate ? moment(fromDate).format(dateFormate2) : ''} ·{' '}
                {count <= 9 ? `0${count}` : count}
              </Typography>
            </Box>
          );
        }
        return (
          <Button
            size="small"
            variant="contained"
            startIcon={<IconEye size={14} />}
            onClick={() => handleViewDetails(row)}
            sx={{
              background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
              color: '#fff',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              borderRadius: '8px',
              '&:hover': {
                background: 'linear-gradient(135deg, #0A3555 0%, #032840 100%)',
                boxShadow: `0 4px 12px ${alpha('#032840', 0.25)}`,
              },
            }}
          >
            View
          </Button>
        );
      },
    },
    {
      field: 'reqID',
      headerName: 'ID',
      width: 150,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const isChild = !!row.isChildRow;
        const suffix = row.childSuffix ? `-${row.childSuffix}` : '';
        if (isChild) {
          return (
            <Box
              sx={{ display: 'inline-flex', alignItems: 'center', pl: '28px' }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#94A3B8',
                  mr: 0.5,
                }}
              >
                └─
              </Typography>
              <Typography
                component="span"
                variant="body2"
                fontWeight={700}
                onClick={() => handleViewDetails(row)}
                sx={{
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  color: '#0A3555',
                  '&:hover': {
                    color: '#032840',
                    textDecoration: 'underline',
                  },
                }}
              >
                {row.parentReqID || row.reqID?.replace(suffix, '') || ''}
                <Box
                  component="span"
                  sx={{
                    color: '#DB2777',
                    background: 'rgba(236, 69, 153, 0.12)',
                    px: 0.5,
                    borderRadius: 0.75,
                    ml: 0.25,
                  }}
                >
                  {suffix || row.reqID}
                </Box>
              </Typography>
            </Box>
          );
        }
        return (
          <Typography
            variant="body2"
            fontWeight={700}
            onClick={() => handleViewDetails(row)}
            sx={{
              cursor: 'pointer',
              fontFamily: 'ui-monospace, Menlo, monospace',
              color: '#0A3555',
              '&:hover': { color: '#032840', textDecoration: 'underline' },
            }}
          >
            {row.reqID}
          </Typography>
        );
      },
    },
    {
      field: 'reqStatus',
      headerName: 'Status',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const cachedKids = childrenMap.get(row.reqID || '');
        const hasChildren = !!cachedKids && cachedKids.length > 0;
        // Parent-with-children: no status (rollup belongs to children).
        if (!row.isChildRow && !row.parentReqID && hasChildren) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        const statusKey = (row.reqStatus || '') as RequirementStatus;
        const color = reqirementStatusColors[statusKey] || '#94A3B8';
        if (!row.reqStatus) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.375,
              borderRadius: '6px',
              bgcolor: alpha(color, 0.12),
              color,
              border: `1px solid ${alpha(color, 0.25)}`,
              height: 26,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.72rem' }}
            >
              {row.reqStatus}
            </Typography>
          </Box>
        );
      },
    },
    // Assigned-to + Applied-for sit next to Status so a child row's three
    // key workpoints (state, owner, consultant) line up as a scannable
    // left-anchored block before the wider job/client columns.
    // Parents-with-children render em-dashes here for the same reason they
    // render em-dash in Status — those fields roll up to the children.
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const cachedKids = childrenMap.get(row.reqID || '');
        const hasChildren = !!cachedKids && cachedKids.length > 0;
        if (!row.isChildRow && !row.parentReqID && hasChildren) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return <PersonPill name={row.assignedTo} />;
      },
    },
    {
      field: 'appliedFor',
      headerName: 'Applied For',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const cachedKids = childrenMap.get(row.reqID || '');
        const hasChildren = !!cachedKids && cachedKids.length > 0;
        if (!row.isChildRow && !row.parentReqID && hasChildren) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return <PersonPill name={row.appliedFor} />;
      },
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 220,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.jobTitle)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Typography
            noWrap
            sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2A3547' }}
          >
            {row.jobTitle}
          </Typography>
        );
      },
    },
    {
      field: 'clientCompany',
      headerName: 'Client',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.clientCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(55, 183, 234, 0.08)',
                color: '#1A9FD4',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.clientCompany}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'primeVendorCompany',
      headerName: 'Prime Vendor',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.primeVendorCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(236, 69, 153, 0.08)',
                color: '#DB2777',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.primeVendorCompany}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'vendorCompany',
      headerName: 'Vendor',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.vendorCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(252, 228, 65, 0.18)',
                color: '#A07F00',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.vendorCompany}
            </Typography>
          </Stack>
        );
      },
    },
    // NOTE: the old `assignedTo` column that used to live here was moved
    // to right after Status (see above) — kept an em-dash parent behaviour
    // intact, just repositioned. A new `appliedFor` column was added
    // beside it so the child-row scan-line now reads: ID · Status ·
    // Owner · Consultant · Job · Company.
    {
      field: 'reqEnteredBy',
      headerName: 'Created By',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        return <PersonPill name={row.reqEnteredBy} />;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 140,
      valueGetter: (val: string, row) => {
        if ((row as Row).dateSeparator) return '';
        return val ? moment(val).format(dateFormate2) : '';
      },
      filterOperators: filterOperatorsForDateField,
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const canAssign =
          isParentEditor && !archive && !row.isChildRow && !row.parentReqID;
        return (
          <Stack direction="row" spacing={0.25} alignItems="center">
            {!archive && (
              <Tooltip title="Copy this requirement">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewData(row);
                    handleCopyRow(row);
                  }}
                  sx={{
                    color: '#5A6A85',
                    '&:hover': {
                      bgcolor: 'rgba(55, 183, 234, 0.08)',
                      color: '#1A9FD4',
                    },
                  }}
                >
                  <IconCopy size={16} />
                </IconButton>
              </Tooltip>
            )}
            {canAssign && (
              <Tooltip title="Assign marketers">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignFor(row);
                  }}
                  sx={{
                    color: '#DB2777',
                    '&:hover': { bgcolor: 'rgba(236, 69, 153, 0.08)' },
                  }}
                >
                  <IconUsersPlus size={16} />
                </IconButton>
              </Tooltip>
            )}
            {!archive &&
              userRoles.includes(UserRole['super-admin']) &&
              !row.isChildRow && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(row);
                      // let the form handle the actual delete confirmation.
                    }}
                    sx={{
                      color: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                    }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Tooltip>
              )}
          </Stack>
        );
      },
    },
  ];

  // Copy directly from a row without first opening view mode.
  const handleCopyRow = (row: IRequirement) => {
    setMode('add');
    setFormTitle('Add New Requirement');

    const copy: Partial<IRequirement & { __v?: string }> = {
      ...row,
      reqEnteredBy: `${iUser?.firstName} ${iUser?.lastName}`,
      reqEnteredByRef: `${iUser?.id}`,
      isDuplicate: 'true',
      duplicateWith: row.reqID,
      rate: [],
      taxType: [],
      remote: [],
      duration: [],
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    delete copy.parentReqID;
    delete copy.childSuffix;
    setReqToCopy({ ...copy });
    setDrawerOpen(true);
  };

  // ── Hero banner ──
  const dataGridHeader = (
    <Box sx={{ width: '100%' }}>
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #032840 0%, #0A3555 100%)',
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
        }}
      >
        {/* Pink radial orb top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              '#EC4599',
              0.3
            )} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        {/* Blue radial orb bottom-left */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '25%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              '#37B7EA',
              0.22
            )} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        {/* Brand gradient top stripe */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              'linear-gradient(135deg, #EC4599 0%, #37B7EA 50%, #FCE441 100%)',
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
                background: 'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                color: '#fff',
                boxShadow:
                  '0 0 20px rgba(236, 69, 153, 0.3), 0 0 40px rgba(55, 183, 234, 0.15)',
              }}
            >
              <IconBriefcase size={24} />
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
                MARKETING RADAR ·{' '}
                {archive ? 'ARCHIVE' : (activeReqStatus || 'LIVE').toUpperCase()}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: '#fff', lineHeight: 1.15 }}
              >
                Requirement{' '}
                <Box
                  component="span"
                  sx={{
                    background:
                      'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  pipeline
                </Box>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}
              >
                {gridData?.totalDocuments ?? 0} shown · multi-assign marketers,
                track per-child status
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            {!archive && (
              <Button
                variant="contained"
                startIcon={<IconClipboardCheck size={18} />}
                onClick={handleAddNew}
                size="medium"
                sx={{
                  background:
                    'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 0.9,
                  boxShadow: `0 6px 16px ${alpha('#EC4599', 0.35)}`,
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    boxShadow: `0 8px 20px ${alpha('#EC4599', 0.45)}`,
                  },
                }}
              >
                Add new
              </Button>
            )}
            <Tooltip title="Refresh all">
              <IconButton
                onClick={handleRefreshAll}
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
                <IconRefresh size={18} className={loading ? 'sync-icon-loading' : ''} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>

      {/* Pipeline snapshot row */}
      {!archive && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          sx={{ mb: 2 }}
        >
          <PipelineSnapshot
            activeStatus={activeReqStatus}
            onStatusChange={handlePipelineStatusChange}
            archive={archive}
            refreshKey={snapshotRefreshKey}
          />
        </MotionBox>
      )}
    </Box>
  );

  // ── Form body (deferred behind loading / error) ──
  const MyForm = (
    <>
      {formStateLoading ? (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      ) : formStateError ? (
        <Box textAlign="center">
          <Typography color="error">{formStateError}</Typography>
          <IconButton
            onClick={() => {
              accountsState.loadData();
              consultantsState.loadData();
            }}
          >
            <Sync color="primary" />
          </IconButton>
        </Box>
      ) : (
        <RequirementsForm
          showLogs
          setResults={setResults}
          hideButtons={archive}
          accounts={accounts || []}
          consultants={consultants || []}
          viewData={viewData}
          mode={mode}
          onDrawerClose={handleDrawerClose}
          isEditing={mode !== 'view'}
          onEdit={handleEdit}
          onCopy={handleCopy}
          reqToCopy={reqToCopy}
          onOpenChild={(reqID) => setChildReqDrawer(reqID)}
        />
      )}
    </>
  );

  return (
    <>
      <CustomDataGrid
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={handleChangeFilterModel}
        archiveState={
          isArchiveRequirementModuleAllowed
            ? [archive, onChangeArchiveButton]
            : undefined
        }
        error={error}
        retry={reload}
        header={dataGridHeader}
        rows={displayRows as unknown as any[]}
        columns={columns as unknown as GridColDef[]}
        loading={loading}
      />

      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
        subTitle={
          <RequirementMeta
            hideInterviews={mode !== 'view'}
            requirement={viewData}
            archive={archive}
            onOpenDuplicateReq={() =>
              setDuplicateReqDrawer(viewData?.duplicateWith)
            }
          />
        }
      >
        {MyForm}
      </CustomDrawer>

      {viewData?.duplicateWith && (
        <RequirementDrawer
          archive={archive}
          open={Boolean(duplicateReqDrawer)}
          reqID={viewData?.duplicateWith}
          onClose={() => setDuplicateReqDrawer(undefined)}
        />
      )}

      {childReqDrawer && (
        <RequirementDrawer
          archive={archive}
          open={Boolean(childReqDrawer)}
          reqID={childReqDrawer}
          onClose={() => setChildReqDrawer(undefined)}
        />
      )}

      <AssignRequirementDrawer
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        parent={assignFor || undefined}
        accounts={accounts || []}
        onMutate={() => {
          reload();
          if (assignFor?.reqID) {
            const reqID = assignFor.reqID;
            setChildrenMap((prev) => {
              const next = new Map(prev);
              next.delete(reqID);
              return next;
            });
          }
          setSnapshotRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}

// Small helper used by the expand chevron; keeps the colour logic off the JSX.
function tokensAwareIconColor(active: boolean) {
  return active ? '#DB2777' : '#5A6A85';
}

export type FormMode = 'view' | 'edit' | 'add';
