import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import moment from 'moment';
import React, { useState } from 'react';
import { timeFormate, dateFormate2 } from '../constants';
import { RequirementLog } from '../../Interfaces/requirement';
import { Sync } from '@mui/icons-material';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getRequirementLogs } from '../../services/requirementApi';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementsForm from '../../pages/Marketing/Requirements/RequirementsForm';
interface iProps {
  requirementObjectId: string;
}
const RequirementLogTable = ({ requirementObjectId }: iProps) => {
  const {
    data: rows,
    error,
    loading,
    loadData: reload,
    setData,
  } = useFetchData(async () => {
    const { data } = await getRequirementLogs(
      `requirementRef=${requirementObjectId}`
    );
    return data.data || [];
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewData, setViewData] = useState<RequirementLog>();
  const columns: {
    field: keyof RequirementLog;
    headerName: string;
    renderCell?: (a: RequirementLog) => any;
  }[] = [
    {
      field: 'view' as any,
      headerName: 'View',
      renderCell: (row) => (
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
      field: 'userName',
      headerName: 'Operation By',
    },
    {
      field: 'operation',
      headerName: 'Operation',
    },
    {
      field: 'createdAt',
      headerName: 'Time',
      renderCell: (row) => {
        return moment(row.createdAt).format(timeFormate);
      },
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      renderCell: (row) => {
        return moment(row.createdAt).format(dateFormate2);
      },
    },
  ];
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
  const subTitle = (
    <>
      {`${viewData?.userName} . ${viewData?.operation} . ${moment(
        viewData?.createdAt
      ).format(dateFormate2 + ' ' + timeFormate)}`}
    </>
  );
  return (
    <>
      <Box height={'fit-content'} my={4}>
        <ChartCardWrapper
          title={`Logs - ${(!rows || rows?.length < 10) && '0'}${
            rows?.length || 0
          }`}
          p='2px 20px'
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
        </ChartCardWrapper>
      </Box>

      <CustomDrawer
        open={!!viewData && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`${viewData?.newData.reqID}`}
        closeOnOutSideClick
        subTitle={subTitle}
      >
        <>
          {viewData && (
            <RequirementsForm
              viewData={viewData.newData}
              hideButtons
              hideFooter
            />
          )}
        </>
      </CustomDrawer>
    </>
  );
};

export default RequirementLogTable;
