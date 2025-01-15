import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useEffect, useState } from 'react';
import moment from 'moment';
import TestAndVendorForm from './TestAndVendorForm';
import { interviewsList } from '../../../services/vendorInterviewApi';
import CustomSearch from './CustomSearch';

type Record = {
  id: number;
  name: string;
  company: string;
  title: string;
};

export default function TestAndVendorInterviews() {
  // const [openForm, setOpenForm] = useState(false);
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
    const res = await interviewsList();
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
    { field: 'testID', headerName: 'Test ID', width: 100 },
    { field: 'interviewStatus', headerName: 'Test Status', width: 120 },
    { field: 'interviewDate', headerName: 'Test Entered Date', width: 120 },
    { field: 'interviewDuration', headerName: 'Test Duration', width: 100 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'primeVendorCompany', headerName: 'Prime Company', width: 120 },
    { field: 'vendorCompany', headerName: 'Vendor Company', width: 120 },
    { field: 'createdBy', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) => {
        return moment(params).format('YYYY-MM-DD hh:mm A');
      },
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = rows.filter((r: any) => r.testID === row.testID);
    console.log('data--', data[0]);
    setViewData(data[0]);
    setFormTitle(`Vendor Interview ID ${row.testID}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
    // alert(`View details for Req ID: ${row.testID}`);
  };

  const handleOpenForm = (record: Record) => {
    console.log('record--', record);
    setSelectedRecord(record);
    setFormTitle('Add New Vendor Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setIsEditing(true);
  };

  const handleCloseForm = () => {
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
              width: '850px',
              maxWidth: '80%',
            },
          }}
        >
          <DialogTitle>Get Interview Details</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Select the Record ID for creating an Vendor interview
            </DialogContentText>
            <CustomSearch
              onClick={handleOpenForm}
              setDrawerOpen={setDrawerOpen}
            />
          </DialogContent>
        </Dialog>
        <h3>Test and Vendor Interviews</h3>
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
        <TestAndVendorForm
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
