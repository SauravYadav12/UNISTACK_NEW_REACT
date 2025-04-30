import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import React, { useState } from 'react';
import { dateFormate, dateFormate2, timeFormate } from '../constants';
import { interviewsList } from '../../services/interviewApi';
import { interviewStatusColors } from '../../pages/Marketing/TestAndVendorInterviews/testAndViValues';
import moment from 'moment';
import DashboardCard from './ChartCardWrapper';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import InterviewDrawer from '../interview/InterviewDrawer';
import { useFetchData } from '../../hooks/fetchDataHook';
import { vendorInterviewsList } from '../../services/vendorInterviewApi';
import { Sync } from '@mui/icons-material';
import { UserRole } from '../../Interfaces/iUser';

const TodaysInterviews = () => {
  const user = useAuth().iUser!;

  const {
    data: rows,
    error,
    loading,
    loadData: reload,
    setData,
  } = useFetchData(getInterviews, [user.shift]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewData, setViewData] = useState<any>();
  const toDay = dateByUserShift(user.shift);
  const columns: {
    field: string;
    headerName: string;
    renderCell?: (a: any) => any;
  }[] = [
    {
      field: 'view',
      headerName: 'View',
      renderCell: (row: any) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          sx={{ borderRadius: '10px' }}
          onClick={() => {
            setViewData(row);
            setDrawerOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
    {
      field: 'intId',
      headerName: 'ID',
      renderCell: (row: any) => row.intId || row.testID,
    },
    {
      field: 'interviewStatus',
      headerName: 'Status',
      renderCell: (row: any) => (
        <span
          style={{
            color: (interviewStatusColors as any)[row.interviewStatus],
          }}
        >
          {(row.interviewStatus as string)?.replace('Interview', '')}
        </span>
      ),
    },
    { field: 'consultant', headerName: 'Consultant' },

    {
      field: 'interviewTime',
      headerName: 'Time',
      renderCell: (row: any) => {
        return (
          moment(row.interviewTime, timeFormate).format(timeFormate) +
          ' ' +
          (row.timeZone || '')
        );
      },
    },
    { field: 'clientName', headerName: 'Client Name' },
    { field: 'jobTitle', headerName: 'Job Title' },
    { field: 'marketingPerson', headerName: 'Created by' },
    {
      field: 'createdAt',
      headerName: 'Created At',
      renderCell: (row: any) => {
        return moment(row.createdAt).format(dateFormate2);
      },
    },
  ];

  async function getInterviews() {
    const date = toDay.format(dateFormate);
    let [int, vendorInt] = await Promise.all([
      interviewsList('interviewDate=' + date),
      vendorInterviewsList('interviewDate=' + date),
    ]);
    const intRes = int.data.data?.results || [];
    const vendorIntRes = vendorInt.data.data?.results || [];
    return [...intRes, ...vendorIntRes];
  }

  function MyBody() {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={4}>
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
          <TableCell colSpan={4}>
            <Box textAlign={'center'}>
              <Typography color="error">{error}</Typography>
              <IconButton onClick={reload}>
                <Sync color="primary" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (!rows?.length)
      return (
        <tr>
          <td
            colSpan={columns.length}
            style={{ textAlign: 'center', padding: '10px 0px' }}
          >
            Not found
          </td>
        </tr>
      );

    return rows.map((row) => (
      <TableRow
        key={row._id}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      >
        {columns.map((c, i) => {
          const val = (c.renderCell ? c.renderCell(row) : row[c.field]) || 'NA';
          return (
            <TableCell
              key={i}
              align={i + 1 === columns.length ? 'right' : 'center'}
              sx={{ fontSize: 'small' }}
            >
              {typeof val === 'string' ? (
                <>
                  {val.slice(0, 25)}
                  {val.length > 25 && '...'}
                </>
              ) : (
                val
              )}
            </TableCell>
          );
        })}
      </TableRow>
    ));
  }

  if (user?.role === UserRole.user) return null;

  return (
    <>
      <DashboardCard
        title={`Today's Interviews - ${rows?.length || 0}`}
        action={
          <Typography
            variant="h6"
            width={'fit-content'}
            sx={{ fontSize: 'medium', color: '#535252' }}
          >
            {toDay.format(dateFormate2)}
          </Typography>
        }
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((c, i) => {
                  return (
                    <TableCell
                      key={i}
                      align={i + 1 === columns.length ? 'right' : 'center'}
                      sx={{ fontWeight: 'bolder', color: '#4c4d4e' }}
                    >
                      {c.headerName}
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
      </DashboardCard>

      <InterviewDrawer
        open={Boolean(drawerOpen && viewData)}
        onClose={() => {
          setDrawerOpen(false);
          setViewData({});
        }}
        interview={viewData}
        setData={(cb) => {
          const results = cb(rows || []);
          setData(results);
          const int = results.find((i: any) => i._id === viewData._id);
          setViewData(int);
        }}
      />
    </>
  );
};

export default TodaysInterviews;
