import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
} from '@mui/material';
import moment from 'moment';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import { useEffect, useState } from 'react';
import InterviewForm from './InterviewForm';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { interviewsList } from '../../../services/interviewApi';
import CustomSearch from './CustomSearch';

type Record = {
  id: number;
  name: string;
  company: string;
  title: string;
};

export default function Interviews(props: any) {
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');

  useEffect(() => {
    getInterviews();
  }, [drawerOpen]);

  const getInterviews = async () => {
    const query = props.query;
    const res = await interviewsList(query);
    // console.log(res);
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
          sx={{ borderRadius: '10px' }}
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
    const data = rows.filter((r: any) => r.intId === row.intId);
    console.log('data--', data[0]);
    setViewData(data[0]);
    setFormTitle(`Interview ID ${row.intId}`);
    setDrawerOpen(true);
    setMode('view');
    setIsEditing(false);
    // alert(`View details for Req ID: ${row.intId}`);
  };

  const handleOpenForm = (record: Record) => {
    console.log('record--', record);
    setSelectedRecord(record);
    setFormTitle('Add New Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    setDrawerOpen(false);
  };
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleEdit = (editMode: any) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };

  return (
    <>
      <div>
        <Button
          variant="contained"
          style={{ marginRight: 25, float: 'right', borderRadius: '10px' }}
          size="small"
          onClick={handleClickOpen}
        >
          Add New
        </Button>
        <Dialog
          open={openDialog}
          onClose={handleClose}
          sx={{
            '& .MuiDialog-paper': {
              width: '800px',
              maxWidth: '80%',
            },
          }}
        >
          <DialogTitle>Get Interview Details</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Select the Record ID for creating an interview
            </DialogContentText>
            <Box
              noValidate
              component="form"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                m: 'auto',
                width: 'fit-content',
              }}
            >
              <FormControl sx={{ mt: 2, minWidth: 300 }}>
                <CustomSearch
                  onClick={handleOpenForm}
                  setDrawerOpen={setDrawerOpen}
                />
              </FormControl>
            </Box>
          </DialogContent>
        </Dialog>
        <h3>{props.label}</h3>
      </div>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        // title="Add New Interview"
        title={formTitle}
      >
        <InterviewForm
          handleCloseForm={handleCloseForm}
          selectedRecord={selectedRecord}
          viewData={viewData}
          setDrawerOpen={setDrawerOpen}
          mode={mode}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
}
