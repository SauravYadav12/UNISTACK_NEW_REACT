import { Button } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useState } from 'react';
import moment from 'moment';
import TestAndVendorForm from './TestAndVendorForm';

export default function TestAndVendorInterviews() {
  const [openForm, setOpenForm] = useState(false);

  const rows = [
    {
      _id: 1,
      testID: 'TEST123',
      testStatus: 'Completed',
      testEnteredDate: '2024-10-10',
      testDuration: '2 hours',
      subjectLine: 'Technical Test',
      clientName: 'ABC Corp',
      primeCompany: 'Prime Solutions',
      vendorCompany: 'XYZ Vendors',
      createdBy: 'HR Team',
      createdAt: '2024-10-01T14:30:00',
    },
    {
      _id: 2,
      testID: 'TEST124',
      testStatus: 'In Progress',
      testEnteredDate: '2024-10-12',
      testDuration: '1.5 hours',
      subjectLine: 'Aptitude Test',
      clientName: 'Tech Innovators',
      primeCompany: 'Prime Innovators',
      vendorCompany: 'Beta Solutions',
      createdBy: 'HR Team',
      createdAt: '2024-10-02T09:45:00',
    },
    {
      _id: 3,
      testID: 'TEST125',
      testStatus: 'Scheduled',
      testEnteredDate: '2024-10-13',
      testDuration: '3 hours',
      subjectLine: 'Coding Test',
      clientName: 'Global Solutions',
      primeCompany: 'Prime Global',
      vendorCompany: 'Innovatech Vendors',
      createdBy: 'HR Team',
      createdAt: '2024-10-03T12:00:00',
    },
  ];

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
    { field: '_id', headerName: 'Test ID', width: 100 },
    { field: 'testStatus', headerName: 'Test Status', width: 120 },
    { field: 'testEnteredDate', headerName: 'Test Entered Date', width: 120 },
    { field: 'testDuration', headerName: 'Test Duration', width: 100 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'primeCompany', headerName: 'Prime Company', width: 120 },
    { field: 'vendorCompany', headerName: 'Vendor Company', width: 120 },
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
    alert(`View details for Req ID: ${row.testID}`);
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
        <h3>Test And Vendor Interviews</h3>
      </div>
      <CustomDataGrid
        columns={columns}
        rows={rows}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={openForm}
        onClose={handleCloseForm}
        title="Add New Test And Vendor Interviews"
      >
        <TestAndVendorForm handleCloseForm={handleCloseForm} />
      </CustomDrawer>
    </>
  );
}
