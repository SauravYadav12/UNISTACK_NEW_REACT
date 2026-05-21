import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  alpha,
  Tooltip,
} from '@mui/material';
import moment from 'moment';
import { motion } from 'framer-motion';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import { useEffect, useMemo, useState } from 'react';
import InterviewForm from './InterviewForm';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { interviewsList } from '../../../services/interviewApi';
import SearchRequirement from './SearchRequirement';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interviewStatusColors } from './interviewValues';
import { dateFormate2, timeFormate } from '../../../components/constants';
import { archiveInterviewsList } from '../../../services/archivesApi';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { FormMode } from '../Requirements/Requirements';
import { syncDataById } from '../../../utils/syncDataById';
import { requirementsList } from '../../../services/requirementApi';
import { createInterviewQueryParam } from './interviewValues';
import {
  GridFilterModel,
  GridCallbackDetails,
  GridColDef,
} from '@mui/x-data-grid';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { teamsList } from '../../../services/teamsApi';
import { Sync } from '@mui/icons-material';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import {
  IInterview,
  InterviewStatus,
  IRequirement,
} from '../../../Interfaces/types';
import { tokens } from '../../../theme/theme';
import { interviewTabs } from '../../../components/interview/InterviewTabs';
import InterviewPipelineSnapshot from '../../../components/interview/InterviewPipelineSnapshot';
import TodayTimeline from '../../../components/interview/TodayTimeline';
import PersonPill, { getInitials } from '../../../components/ui/PersonPill';
import {
  IconMicrophone,
  IconEye,
  IconCircleCheck,
  IconFlag,
  IconClock,
  IconRefresh,
  IconX,
  IconBuilding,
  IconBriefcase,
} from '@tabler/icons-react';

const MotionBox = motion.create(Box);

// ── Status chip icon map (matches Leaves/Requirements style) ──
const STATUS_ICON: Record<string, JSX.Element> = {
  'Interview Confirm': <IconCircleCheck size={12} />,
  'Interview Completed': <IconFlag size={12} />,
  'Interview Tentative': <IconClock size={12} />,
  'Interview Re-Scheduled': <IconRefresh size={12} />,
  'Interview Cancelled': <IconX size={12} />,
};

// ── Result chip colors ──
const RESULT_COLORS: Record<string, string> = {
  Offer: '#10B981',
  Positive: '#37B7EA',
  Negative: '#EF4444',
  'No Feedback yet': '#94A3B8',
};

/** Drawer placeholder for the first open animation frame */
function DrawerSkeleton() {
  return (
    <Box sx={{ p: 1.5 }}>
      <Stack spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: '#F6F9FC',
                borderBottom: '1px solid',
                borderColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: alpha(tokens.colors.brand, 0.12),
                }}
              />
              <Box
                sx={{
                  height: 14,
                  width: 140,
                  borderRadius: 1,
                  bgcolor: alpha(tokens.colors.brand, 0.08),
                }}
              />
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Box
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
              >
                {[0, 1, 2, 3].map((j) => (
                  <Box
                    key={j}
                    sx={{
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(tokens.colors.brand, 0.06),
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

interface Iprops {
  label: string;
  query: string;
  archiveState: [boolean, (s: boolean) => void];
  activeTabIndex?: number;
  onTabChange?: (index: number) => void;
}

export default function Interviews(props: Iprops) {
  const { isModuleAllowed } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDialog, setOpenDialog] = useState(false);
  const [requirement, setRequirement] = useState<IRequirement>();
  const [viewData, setViewData] = useState<IInterview>();
  const [mode, setMode] = useState<FormMode>('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  const [archive, setArchive] = props.archiveState;

  // Deep-link support: when the user clicks an interview notification, the
  // bell pushes `/interviews?openIntId=INT-XXX`. We fetch that one interview
  // and open it in the existing drawer, then strip the URL param so the
  // close-and-reopen flow works on subsequent clicks.
  useEffect(() => {
    const openIntId = searchParams.get('openIntId');
    if (!openIntId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await interviewsList(
          `intId=${encodeURIComponent(openIntId)}`,
        );
        const found = res.data?.data?.results?.[0] as IInterview | undefined;
        if (cancelled || !found) return;
        setViewData(found);
        setFormTitle(`Interview ID: ${found.intId}`);
        setMode('view');
        setDrawerOpen(true);
      } catch {
        // Silently ignore — the user can still navigate manually.
      } finally {
        if (!cancelled) {
          setSearchParams(
            (prev) => {
              prev.delete('openIntId');
              return prev;
            },
            { replace: true },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  const teamState = useFetchData(async () => {
    const { data } = await teamsList(`limit=5000`);
    return data.data?.results || [];
  });

  const formStateLoading = teamState.loading;
  const formStateError = teamState.error;

  const isArchiveInterviewModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Interviews)
  );

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
      queryFunction: archive ? getArchiveInterviews : getInterviews,
      queryParams: props.query,
    },
    [archive, props.query]
  );

  // Derive active status from current tab index
  const activeStatus: InterviewStatus | '' = useMemo(() => {
    if (props.activeTabIndex === undefined) return '';
    const tab = interviewTabs[props.activeTabIndex];
    return (tab?.status as InterviewStatus) || '';
  }, [props.activeTabIndex]);

  const handleStatusFilterChange = (status: InterviewStatus | '') => {
    if (!props.onTabChange) return;
    if (status === '') {
      props.onTabChange(0);
      return;
    }
    const idx = interviewTabs.findIndex((t) => t.status === status);
    if (idx >= 0) props.onTabChange(idx);
  };

  // Defer heavy form mount until drawer is sliding in
  useEffect(() => {
    if (!drawerOpen) {
      setFormReady(false);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFormReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [drawerOpen]);

  const columns: GridColDef<IInterview>[] = [
    {
      field: 'view',
      headerName: '',
      width: 90,
      renderCell: (params) => {
        if (
          (params.row as unknown as { dateSeparator?: boolean }).dateSeparator
        )
          return null;
        return (
          <Button
            size="small"
            variant="contained"
            startIcon={<IconEye size={14} />}
            onClick={() => handleViewDetails(params.row)}
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
        );
      },
      sortable: false,
      filterable: false,
    },
    {
      field: 'intId',
      headerName: 'ID',
      width: 110,
      renderCell: ({ row }) => {
        const sep = row as unknown as {
          dateSeparator?: boolean;
          sectionLabel?: string;
          sectionCount?: number;
        };
        if (sep.dateSeparator) {
          return (
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: tokens.colors.blueDark,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {sep.sectionLabel}
              {typeof sep.sectionCount === 'number'
                ? ` · ${sep.sectionCount}`
                : ''}
            </Typography>
          );
        }
        return (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: '#0A3555',
              cursor: 'pointer',
              '&:hover': { color: '#032840', textDecoration: 'underline' },
            }}
            onClick={() => handleViewDetails(row)}
          >
            {row.intId}
          </Typography>
        );
      },
    },
    {
      field: 'interviewStatus',
      headerName: 'Status',
      width: 180,
      renderCell: ({ row: { interviewStatus }, row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const color = interviewStatus
          ? interviewStatusColors[interviewStatus as InterviewStatus] ||
            '#9E9E9E'
          : '#9E9E9E';
        const icon = interviewStatus ? STATUS_ICON[interviewStatus] : null;
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
            {icon}
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.72rem' }}
            >
              {(interviewStatus || 'N/A').replace('Interview ', '')}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'interviewType',
      headerName: 'Type',
      width: 150,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const value = row.interviewType;
        if (!value)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.375,
              borderRadius: '6px',
              bgcolor: alpha(tokens.colors.blue, 0.1),
              color: tokens.colors.blueDark,
              height: 26,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.72rem' }}
            >
              {value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'consultant',
      headerName: 'Consultant',
      width: 180,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        return <PersonPill name={row.consultant} />;
      },
    },
    {
      field: 'interviewDate',
      headerName: 'Date',
      width: 130,
      valueGetter: (params, row) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return '';
        return params ? moment(params).format(dateFormate2) : '';
      },
      filterOperators: filterOperatorsForDateField,
    },
    {
      field: 'interviewTime',
      headerName: 'Time',
      width: 160,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const t = row.interviewTime
          ? moment(row.interviewTime, timeFormate).format(timeFormate)
          : '';
        if (!t)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(tokens.colors.pink, 0.1),
                color: tokens.colors.pinkDark,
              }}
            >
              <IconClock size={12} />
            </Box>
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0A3555',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t}
            </Typography>
            {row.timeZone && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.7rem' }}
              >
                {row.timeZone}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'intResult',
      headerName: 'Result',
      width: 150,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const result = row.intResult || '';
        if (!result)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        const color = RESULT_COLORS[result] || '#5A6A85';
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.375,
              borderRadius: '6px',
              bgcolor: alpha(color, 0.1),
              color,
              height: 26,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.72rem' }}
            >
              {result}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'subjectLine',
      headerName: 'Subject',
      width: 160,
      valueGetter: (params, row) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return '';
        return params ?? '';
      },
    },
    {
      field: 'clientName',
      headerName: 'Client',
      width: 160,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const name = row.clientName;
        if (!name)
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
                bgcolor: alpha(tokens.colors.blue, 0.1),
                color: tokens.colors.blueDark,
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#0A3555',
                minWidth: 0,
              }}
            >
              {name}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 200,
      valueGetter: (params, row) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return '';
        return params ?? '';
      },
    },
    {
      field: 'candidateName',
      headerName: 'Interviewee',
      width: 180,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        return <PersonPill name={row.candidateName} />;
      },
    },
    {
      field: 'marketingPerson',
      headerName: 'Created By',
      width: 160,
      renderCell: ({ row }) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return null;
        const name = row.marketingPerson;
        if (!name)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.875}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: alpha(tokens.colors.brand, 0.1),
                color: tokens.colors.brand,
              }}
            >
              {getInitials(name)}
            </Box>
            <Typography
              noWrap
              sx={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'text.primary',
                minWidth: 0,
              }}
            >
              {name}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
      valueGetter: (val: string, row) => {
        if ((row as unknown as { dateSeparator?: boolean }).dateSeparator)
          return '';
        return val ? moment(val).format(dateFormate2) : '';
      },
      filterOperators: filterOperatorsForDateField,
    },
  ];

  // "All" tab = index 0 on the live interview set. On that view, we want to
  // split rows into two visual sections: future interviews (upcoming) and the
  // rest (past). Uses the `dateSeparator` row pattern that CustomDataGrid
  // already styles.
  const isAllTab = props.activeTabIndex === 0 && !archive;
  const displayRows = useMemo(() => {
    const results = gridData?.results || [];
    if (!isAllTab || results.length === 0) return results;

    const now = moment();
    const timestamp = (i: IInterview) => {
      const d = i.interviewDate ? moment(i.interviewDate) : null;
      if (!d || !d.isValid()) return 0;
      if (i.interviewTime) {
        const t = moment(i.interviewTime, timeFormate);
        if (t.isValid()) {
          d.hours(t.hours()).minutes(t.minutes()).seconds(0);
        }
      }
      return d.valueOf();
    };
    const nowMs = now.valueOf();
    const upcoming: IInterview[] = [];
    const past: IInterview[] = [];
    for (const r of results) {
      if (timestamp(r) >= nowMs) upcoming.push(r);
      else past.push(r);
    }
    upcoming.sort((a, b) => timestamp(a) - timestamp(b));
    past.sort((a, b) => timestamp(b) - timestamp(a));

    const out: IInterview[] = [];
    if (upcoming.length) {
      out.push({
        _id: '__sep-upcoming',
        dateSeparator: true,
        sectionLabel: 'Upcoming',
        sectionCount: upcoming.length,
      } as unknown as IInterview);
      out.push(...upcoming);
    }
    if (past.length) {
      out.push({
        _id: '__sep-past',
        dateSeparator: true,
        sectionLabel: 'Past',
        sectionCount: past.length,
      } as unknown as IInterview);
      out.push(...past);
    }
    return out;
  }, [gridData?.results, isAllTab]);

  const handleViewDetails = (row: IInterview) => {
    const data = gridData?.results?.find((r) => r.intId === row.intId);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Interview ID: ${row.intId}`);
    setMode('view');
    setDrawerOpen(true);
    !archive &&
      syncDataById(data, {
        queryFunction: interviewsList,
        setViewData,
        setResults,
      });
  };

  /** Open an interview from the timeline dot (takes an IInterview directly) */
  const handleOpenTimelineInterview = (i: IInterview) => {
    setViewData(i);
    setFormTitle(`Interview ID: ${i.intId}`);
    setMode('view');
    setDrawerOpen(true);
  };

  const handleOpenForm = (record: IRequirement) => {
    setRequirement(record);
    setFormTitle('Add New Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setViewData(undefined);
  };

  const clearReqFromParams = () => {
    setSearchParams((pre) => {
      pre.delete(createInterviewQueryParam);
      return pre;
    });
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    clearReqFromParams();
    setRequirement(undefined);
    setViewData(undefined);
    setSnapshotRefreshKey((k) => k + 1);
  };

  const handleClickOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);
  const handleEdit = (editMode: boolean) => setMode(editMode ? 'edit' : 'view');

  async function getInterviews(query?: string, signal?: AbortSignal) {
    const res = await interviewsList(query, signal);
    setArchive(false);
    return res;
  }
  async function getArchiveInterviews(query?: string, signal?: AbortSignal) {
    const res = await archiveInterviewsList(query, signal);
    setArchive(true);
    return res;
  }

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

  const createInterview = async (reqID: string) => {
    try {
      setDrawerOpen(true);
      const res = await requirementsList(`reqID=${reqID}`);
      const data = res.data.data?.results;
      if (!data?.length) {
        toast.error('No requirement found for this ID');
        return;
      }
      handleOpenForm(data[0]);
    } catch (error) {
      console.log('Error creating interview', error);
      toast.error('Error creating interview');
    }
  };

  useEffect(() => {
    const reqID = searchParams.get(createInterviewQueryParam);
    if (reqID?.length) createInterview(reqID);
  }, [searchParams]);

  const handleRefreshAll = () => {
    setGridData(undefined);
    reload();
    setSnapshotRefreshKey((k) => k + 1);
  };

  const dataGridHeader = (
    <Box sx={{ width: '100%' }}>
      {/* ── Hero banner ── */}
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
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '25%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
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
            background: tokens.gradients.brand,
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
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconMicrophone size={24} />
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
                {archive ? 'ARCHIVED INTERVIEWS' : 'INTERVIEW RADAR'} ·{' '}
                {(activeStatus || 'ALL')
                  .toString()
                  .replace('Interview ', '')
                  .toUpperCase()}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: '#fff', lineHeight: 1.15 }}
              >
                Interview{' '}
                <Box
                  component="span"
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  command
                </Box>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}
              >
                {gridData?.totalDocuments ?? 0} shown · live timeline below,
                filter by stage
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            {!archive && (
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
                onClick={handleClickOpen}
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
                    background:
                      'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.45)}`,
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
                <SyncIcon
                  className={loading ? 'sync-icon-loading' : ''}
                  sx={{ fontSize: 18 }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>

      {/* ── Today's timeline — unique radar element ── */}
      {!archive && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          sx={{ mb: 2 }}
        >
          <TodayTimeline
            onOpenInterview={handleOpenTimelineInterview}
            refreshKey={snapshotRefreshKey}
          />
        </MotionBox>
      )}

      {/* ── Pipeline snapshot ── */}
      {!archive && props.onTabChange && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          sx={{ mb: 2 }}
        >
          <InterviewPipelineSnapshot
            activeStatus={activeStatus}
            onStatusChange={handleStatusFilterChange}
            archive={archive}
            refreshKey={snapshotRefreshKey}
          />
        </MotionBox>
      )}
    </Box>
  );

  return (
    <>
      <Dialog
        open={openDialog}
        onClose={handleClose}
        sx={{
          '& .MuiDialog-paper': {
            width: '850px',
            maxWidth: '80%',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
              }}
            >
              <IconBriefcase size={16} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Get Interview Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select the Record ID for creating an interview
          </DialogContentText>
          <SearchRequirement onSelect={handleOpenForm} />
        </DialogContent>
      </Dialog>

      <CustomDataGrid
        header={dataGridHeader}
        rows={displayRows}
        columns={columns}
        loading={loading}
        error={error}
        retry={reload}
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={handleChangeFilterModel}
        archiveState={
          isArchiveInterviewModuleAllowed
            ? [
                archive,
                (s) => {
                  setArchive(s);
                  setGridData(undefined);
                },
              ]
            : undefined
        }
      />

      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        {!formReady ? (
          <DrawerSkeleton />
        ) : formStateLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 10,
              height: '300px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : formStateError ? (
          <Box textAlign="center">
            <Typography color="error">{formStateError}</Typography>
            <IconButton onClick={() => teamState.loadData()}>
              <Sync color="primary" />
            </IconButton>
          </Box>
        ) : (
          <InterviewForm
            archive={archive}
            teamsList={teamState.data || []}
            onCreate={clearReqFromParams}
            setResults={setResults}
            hideButtons={archive}
            showLogs
            requirement={requirement}
            viewData={viewData}
            onDrawerClose={handleCloseForm}
            mode={mode}
            isEditing={mode !== 'view'}
            onEdit={handleEdit}
          />
        )}
      </CustomDrawer>
    </>
  );
}
