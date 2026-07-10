import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  useMediaQuery,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Button,
  alpha,
  Avatar,
  Stack,
} from '@mui/material';
import moment from 'moment';
import { dateFormate2 } from '../constants';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getLeave, getLeaves } from '../../services/leavesApi';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Sync } from '@mui/icons-material';
import CustomDrawer from '../drawer/CustomDrawer';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { iLeave, LeaveStatus, LeaveType } from '../../Interfaces/leaves';
import ViewLeaveDetails from './ViewLeaveDetails';
import { tokens } from '../../theme/theme';
import {
  IconCircleCheck,
  IconCircleX,
  IconHourglass,
  IconInbox,
  IconBeach,
  IconStethoscope,
  IconPlaneDeparture,
  IconSparkles,
  IconEye,
} from '@tabler/icons-react';

interface iProps {
  defaultOpenLeaveId?: string;
  tableContainerHeight?: number | string;
  forAdmin?: boolean;
  status?: LeaveStatus;
  onClose?: () => void;
}

const STATUS_META: Record<
  LeaveStatus,
  { color: string; bg: string; icon: JSX.Element; label: string }
> = {
  [LeaveStatus.Pending]: {
    color: tokens.colors.warning,
    bg: alpha(tokens.colors.warning, 0.1),
    icon: <IconHourglass size={12} />,
    label: 'Pending',
  },
  [LeaveStatus.Approved]: {
    color: tokens.colors.success,
    bg: alpha(tokens.colors.success, 0.1),
    icon: <IconCircleCheck size={12} />,
    label: 'Approved',
  },
  [LeaveStatus.Rejected]: {
    color: tokens.colors.error,
    bg: alpha(tokens.colors.error, 0.1),
    icon: <IconCircleX size={12} />,
    label: 'Rejected',
  },
  [LeaveStatus.Revoked]: {
    color: '#475569',
    bg: alpha('#64748B', 0.14),
    icon: <IconCircleX size={12} />,
    label: 'Revoked',
  },
};

const TYPE_META: Record<LeaveType, { color: string; icon: JSX.Element }> = {
  [LeaveType.CasualLeave]: { color: tokens.colors.pink, icon: <IconBeach size={14} /> },
  [LeaveType.SickLeave]: { color: tokens.colors.error, icon: <IconStethoscope size={14} /> },
  [LeaveType.AnnualLeave]: { color: tokens.colors.blue, icon: <IconPlaneDeparture size={14} /> },
  [LeaveType.Other]: { color: tokens.colors.warning, icon: <IconSparkles size={14} /> },
};

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LeaveHistoryTable({
  tableContainerHeight = 480,
  forAdmin = false,
  status,
  defaultOpenLeaveId,
  onClose,
}: iProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { iUser } = useAuth();
  const [mode, setMode] = useState<FormMode>('view');
  const [viewData, setViewData] = useState<iLeave>();
  const rowsPerPageOptions = [10, 25, 50];
  const [pagination, setPagination] = useState({
    page: 0,
    limit: rowsPerPageOptions[0],
  });
  const { page, limit } = pagination;
  const {
    data: leaveHistory,
    error,
    loading,
    loadData,
    setData,
  } = useFetchData(async () => {
    if (!iUser) return;
    const queryParams = new URLSearchParams();

    if (!forAdmin) {
      queryParams.append('userRef', iUser._id);
    }
    if (status) {
      queryParams.append('status', status);
    }
    queryParams.append('page', (page + 1).toString());
    queryParams.append('limit', limit.toString());

    const { data } = await getLeaves(queryParams.toString());
    return data.data;
  }, [forAdmin, iUser, pagination, status]);

  useEffect(() => {
    if (defaultOpenLeaveId) {
      getLeave(defaultOpenLeaveId).then((leave) => {
        if (leave) setViewData(leave);
      });
    }
  }, [defaultOpenLeaveId]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  const columns = [
    { title: 'Action', width: 90 },
    { hide: !forAdmin, title: 'Employee' },
    { title: 'Dates' },
    { title: 'Type' },
    { title: 'Status' },
    { hide: isMobile, title: 'Reason' },
    { title: 'Applied' },
  ];

  const handleDrawerClose = () => {
    setViewData(undefined);
    setMode('view');
    onClose?.();
  };

  function MyBody() {
    const visibleColsCount = columns.filter((c) => !c.hide).length;
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={visibleColsCount}>
            <Box className="loader" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={26} />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={visibleColsCount}>
            <Box textAlign="center" py={4}>
              <Typography color="error" mb={1}>
                {error}
              </Typography>
              <IconButton onClick={loadData}>
                <Sync color="primary" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      );
    }
    if (!leaveHistory?.results?.length) {
      return (
        <TableRow>
          <TableCell colSpan={visibleColsCount}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: alpha(tokens.colors.pink, 0.08),
                  color: tokens.colors.pink,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <IconInbox size={26} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>
                No leave records
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Your requests will show up here once submitted.
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }
    return leaveHistory?.results?.map((leave) => {
      const statusMeta = STATUS_META[leave.status];
      const typeMeta = leave.type ? TYPE_META[leave.type as keyof typeof TYPE_META] : undefined;
      const days =
        moment(leave.endDate).diff(moment(leave.startDate), 'days') +
        1 -
        (leave.isHalfDay ? 0.5 : 0);
      const isRange = leave.startDate !== leave.endDate;

      return (
        <TableRow
          key={leave._id}
          sx={{
            '&:last-child td, &:last-child th': { border: 0 },
            transition: 'background 0.2s ease',
            '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.03) },
          }}
        >
          <TableCell>
            <Button
              size="small"
              variant="contained"
              startIcon={<IconEye size={14} />}
              onClick={() => setViewData(leave)}
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
          </TableCell>

          {forAdmin && (
            <TableCell>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: tokens.gradients.pinkBlue,
                    color: '#fff',
                  }}
                >
                  {getInitials(leave.name)}
                </Avatar>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#0A3555' }}>
                  {leave.name}
                </Typography>
              </Stack>
            </TableCell>
          )}

          <TableCell>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {isRange
                  ? `${moment(leave.startDate).format(dateFormate2)} – ${moment(leave.endDate).format(dateFormate2)}`
                  : moment(leave.startDate).format(dateFormate2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {days} {days === 1 ? 'day' : 'days'}
                {leave.isHalfDay && ' (half)'}
              </Typography>
            </Box>
          </TableCell>

          <TableCell>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.625,
                px: 1,
                py: 0.375,
                borderRadius: '6px',
                bgcolor: alpha(typeMeta?.color || '#888', 0.1),
                color: typeMeta?.color || '#888',
                height: 26,
              }}
            >
              {typeMeta?.icon}
              <Typography variant="caption" fontWeight={600}>
                {leave.type}
              </Typography>
            </Box>
          </TableCell>

          <TableCell>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.375,
                borderRadius: '6px',
                bgcolor: statusMeta.bg,
                color: statusMeta.color,
                height: 26,
              }}
            >
              {statusMeta.icon}
              <Typography variant="caption" fontWeight={700}>
                {statusMeta.label}
              </Typography>
            </Box>
          </TableCell>

          {!isMobile && (
            <TableCell sx={{ maxWidth: 240 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                }}
                title={leave.reason}
              >
                {leave.reason || '—'}
              </Typography>
            </TableCell>
          )}

          <TableCell>
            <Typography variant="caption" color="text.secondary">
              {moment(leave.createdAt || leave.startDate).format(dateFormate2)}
            </Typography>
          </TableCell>
        </TableRow>
      );
    });
  }

  function DrawerSubtitle(viewData: iLeave) {
    const { startDate, endDate } = viewData;
    return (
      <>
        {startDate === endDate ? (
          moment(startDate).format(dateFormate2)
        ) : (
          <>
            {moment(startDate).format(dateFormate2) +
              ' to ' +
              moment(endDate).format(dateFormate2)}
          </>
        )}
      </>
    );
  }

  return (
    <div>
      <CustomDrawer
        open={Boolean(viewData)}
        onClose={handleDrawerClose}
        title={viewData?.name + ' . ' + viewData?.type}
        closeOnOutSideClick={mode === 'view'}
        subTitle={viewData && DrawerSubtitle(viewData)}
      >
        {viewData && (
          <ViewLeaveDetails
            leave={viewData}
            onUpdate={(leave) => {
              setData((pre) => {
                if (!pre) return pre;
                pre.results = pre.results?.map((l) =>
                  l._id === leave._id ? leave : l
                );
                return { ...pre };
              });
              setViewData(leave);
            }}
          />
        )}
      </CustomDrawer>
      <TableContainer sx={{ height: tableContainerHeight, scrollbarWidth: 'thin' }}>
        <Table
          sx={{ minWidth: 650 }}
          stickyHeader
          aria-label="leave history table"
        >
          <TableHead>
            <TableRow>
              {columns.map((c, i) => {
                if (c.hide) return null;
                return (
                  <TableCell
                    key={i}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'text.secondary',
                      bgcolor: alpha(tokens.colors.brand, 0.03),
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      width: c.width,
                    }}
                  >
                    {c.title}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            <MyBody />
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(tokens.colors.brand, 0.015),
        }}
      >
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={leaveHistory?.totalDocuments || 0}
          rowsPerPage={limit}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Box>
    </div>
  );
}

export default LeaveHistoryTable;
