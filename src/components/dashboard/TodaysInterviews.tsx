import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { dateFormate, timeFormate } from '../constants';
import { toast } from 'react-toastify';
import { interviewsList } from '../../services/interviewApi';
import { interviewStatusColors } from '../../pages/Marketing/TestAndVendorInterviews/testAndViValues';
import moment from 'moment';
import InterviewForm from '../../pages/Marketing/Interviews/InterviewForm';
import CustomDrawer from '../drawer/CustomDrawer';
import DashboardCard from './ChartCardWrapper';
const TodaysInterviews = () => {
  const [rows, setRows] = useState<any[]>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewData, setViewData] = useState<any>();
  const toDay = dayjs(new Date()).format(dateFormate);
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
    { field: 'intId', headerName: 'Int ID' },
    {
      field: 'interviewStatus',
      headerName: 'Int Status',
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
    // {
    //   field: 'interviewDate',
    //   headerName: 'Int date',
    //   renderCell: (row: any) => {
    //     return moment(row.interviewDate).format(dateFormate);
    //   },
    // },
    {
      field: 'interviewTime',
      headerName: 'Int Time',
      renderCell: (row: any) => {
        return (
          moment(row.interviewTime, timeFormate).format(timeFormate) +
          ' ' +
          (row.timeZone || '')
        );
      },
    },
    // { field: 'subjectLine', headerName: 'Subject Line' },
    { field: 'clientName', headerName: 'Client Name' },
    { field: 'jobTitle', headerName: 'Job Title' },
    { field: 'marketingPerson', headerName: 'Created by' },
    {
      field: 'createdAt',
      headerName: 'Created At',
      renderCell: (row: any) => {
        return moment(row.createdAt).format(dateFormate + ' ' + timeFormate);
      },
    },
  ];

  const getInterviews = async () => {
    try {
      const { data } = await interviewsList('interviewDate=' + toDay);
      setRows(data.data?.results || []);
    } catch (error) {
      toast.error('Failed to load');
    }
  };
  useEffect(() => {
    getInterviews();
  }, []);

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
            {toDay}
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
              {rows?.length ? (
                <>
                  {rows.map((row) => (
                    <TableRow
                      key={row._id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {columns.map((c, i) => {
                        const val =
                          (c.renderCell ? c.renderCell(row) : row[c.field]) ||
                          'NA';
                        return (
                          <TableCell
                            key={i}
                            align={
                              i + 1 === columns.length ? 'right' : 'center'
                            }
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
                  ))}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ textAlign: 'center', padding: '10px 0px' }}
                  >
                    Not found
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>
      {!!viewData && (
        <CustomDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={'Interview ID : ' + viewData.intId}
          closeOnOutSideClick
        >
          <InterviewForm
            handleCloseForm={() => setDrawerOpen(false)}
            viewData={viewData}
            setDrawerOpen={setDrawerOpen}
            mode={'view'}
            isEditing={false}
            hideButtons
          />
        </CustomDrawer>
      )}
    </>
  );
};

export default TodaysInterviews;
