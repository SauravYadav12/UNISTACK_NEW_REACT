import { useState } from 'react';
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
} from '@mui/material';
import moment from 'moment';
import { dateFormate2 } from '../constants';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getLeaves } from '../../services/leavesApi';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Sync } from '@mui/icons-material';
import CustomDrawer from '../drawer/CustomDrawer';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { iLeave, LeaveStatus } from '../../Interfaces/leaves';
import ViewLeaveDetails from './ViewLeaveDetails';

interface iProps {
  tableContainerHeight?: number | string;
  forAdmin?: boolean;
  status?: LeaveStatus;
}

function LeaveHistoryTable({
  tableContainerHeight = 480,
  forAdmin = false,
  status,
}: iProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { iUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const handleChangePage = (event: unknown, newPage: number) => {
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
    { title: 'View' },
    { hide: !forAdmin, title: 'Name' },
    { title: 'Dates' },
    { title: 'Leave Type' },
    { title: 'Status' },
    { hide: isMobile, title: 'Reason' },
    { title: 'Appiled At' },
  ];

  const handleDrawerClose = () => {
    setViewData(undefined);
    setDrawerOpen(false);
    setMode('view');
  };

  function MyBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <Box className="loader" sx={{ py: 10 }}>
              <CircularProgress size={25} />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <Box textAlign={'center'}>
              <Typography color="error">{error}</Typography>
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
        <tr>
          <td colSpan={6} style={{ textAlign: 'center', padding: '10px 0px' }}>
            Not found
          </td>
        </tr>
      );
    }
    return leaveHistory?.results?.map((leave) => (
      <TableRow
        key={leave._id}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      >
        <TableCell>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ borderRadius: '10px' }}
            onClick={() => {
              setViewData(leave);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
        </TableCell>
        {forAdmin && (
          <TableCell component="th" scope="row">
            {leave.name}
          </TableCell>
        )}
        <TableCell>
          {leave.startDate !== leave.endDate ? (
            <>
              {moment(leave.startDate).format(dateFormate2)} To{' '}
              {moment(leave.endDate).format(dateFormate2)}
            </>
          ) : (
            moment(leave.endDate).format(dateFormate2)
          )}
        </TableCell>
        <TableCell>{leave.type}</TableCell>
        <TableCell>{leave.status}</TableCell>
        {!isMobile && (
          <TableCell>
            <>
              {leave.reason?.slice(0, 25)}
              {leave.reason?.length > 25 && '...'}
            </>
          </TableCell>
        )}
        <TableCell>{moment(leave.startDate).format(dateFormate2)}</TableCell>
      </TableRow>
    ));
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
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={viewData?.name + ' . ' + viewData?.type}
        closeOnOutSideClick={mode === 'view'}
        subTitle={viewData && DrawerSubtitle(viewData)}
      >
        {viewData && (
          <>
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
          </>
        )}
      </CustomDrawer>
      <TableContainer
        sx={{ height: tableContainerHeight, scrollbarWidth: 'thin' }}
      >
        <Table
          sx={{ minWidth: 650 }}
          stickyHeader
          aria-label="leave history table"
        >
          <TableHead>
            <TableRow>
              {columns.map((c, i) => {
                if (c.hide) return;
                return (
                  <TableCell
                    key={i}
                    sx={{ fontWeight: 'bolder', color: '#4c4d4e' }}
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
    </div>
  );
}

export default LeaveHistoryTable;
