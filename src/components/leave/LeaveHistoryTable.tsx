import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import LeaveForm from './LeaveForm';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { iLeave } from '../../Interfaces/leaves';

interface iProps {
  tableContainerHeight?: number | string;
  forAdmin?: boolean;
}

function LeaveHistoryTable({
  tableContainerHeight = 480,
  forAdmin = false,
}: iProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { iUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('view');
  const [viewData, setViewData] = useState<iLeave>();
  const {
    data: leaveHistory,
    error,
    loading,
    loadData,
  } = useFetchData(async () => {
    if (!iUser) return;
    const { data } = await getLeaves(forAdmin ? '' : `userRef=${iUser._id}`);
    return data.data?.results || [];
  }, [forAdmin, iUser]);

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
    if (!leaveHistory?.length) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: 'center', padding: '10px 0px' }}>
            Not found
          </td>
        </tr>
      );
    }
    return leaveHistory?.map((leave) => (
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
          <LeaveForm
            viewData={viewData}
            {...(forAdmin && {
              isEditing: mode === 'edit',
              onDelete: () => {},
              onEdit: (s) => {
                setMode(s ? 'edit' : 'view');
              },
              onDrawerClose: handleDrawerClose,
            })}
            hideButtons={!forAdmin}
          />
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
    </div>
  );
}

export default LeaveHistoryTable;
