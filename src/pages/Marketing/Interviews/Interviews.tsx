import { Button } from '@mui/material';
import moment from 'moment';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import { useEffect, useState } from 'react';
import InterviewForm from './InterviewForm';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { interviewsList } from './interviewApi';

export default function Interviews() {
  const [openForm, setOpenForm] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getInterviews();
  }, []);

  const getInterviews = async () => {
    const res = await interviewsList();
    console.log(res);
    setRows(res.data.data);
  };

  const columns = [
    {
      field: 'view',
      headerName: 'View',
      width: 100,
      renderCell: (params: any) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleViewDetails(params.row)}
        >
          View
        </Button>
      ),
    },
    { field: 'intId', headerName: 'Int ID', width: 100 },
    { field: 'interviewStatus', headerName: 'Int Status', width: 120 },
    { field: 'consultant', headerName: 'Consultant', width: 120 },
    { field: 'interviewDate', headerName: 'Int date', width: 100 },
    { field: 'interviewTime', headerName: 'Int Time (EST)', width: 150 },
    { field: 'intResult', headerName: 'Int Result', width: 150 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'jobTitle', headerName: 'Job Title', width: 180 },
    { field: 'interviewee', headerName: 'Interviewee', width: 150 },
    { field: 'createdBy', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) =>
        moment(params.value).format('YYYY-MM-DD hh:mm A'),
    },
  ];

  const handleViewDetails = (row: any) => {
    alert(`View details for Req ID: ${row.intId}`);
  };

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  return (
    <>
      <div>
        <Button
          variant="contained"
          style={{ marginRight: 25, float: 'right' }}
          size="small"
          onClick={handleOpenForm}
        >
          Add New
        </Button>
        <h3>Interviews</h3>
      </div>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={openForm}
        onClose={handleCloseForm}
        title="Add New Interview"
      >
        <InterviewForm handleCloseForm={handleCloseForm} />
      </CustomDrawer>
    </>
  );
}
