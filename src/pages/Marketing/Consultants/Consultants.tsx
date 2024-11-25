import { Button } from '@mui/material';
import moment from 'moment';
import { useState } from 'react';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';

export default function Consultants() {
  const [openForm, setOpenForm] = useState(false);

  const rows = [
    {
      _id: 'ID001',
      status: 'Active',
      name: 'John Doe',
      psuedoName: 'J.D.',
      visaStatus: 'H1B',
      degree: 'Master of Science',
      passingYear: '2020',
      university: 'MIT',
      createdBy: 'Admin',
      createdAt: '2024-10-01T14:30:00',
    },
    {
      _id: 'ID002',
      status: 'Inactive',
      name: 'Emily Smith',
      psuedoName: 'E.S.',
      visaStatus: 'Green Card',
      degree: 'Bachelor of Technology',
      passingYear: '2019',
      university: 'Stanford University',
      createdBy: 'HR Manager',
      createdAt: '2024-10-02T09:45:00',
    },
    {
      _id: 'ID003',
      status: 'Active',
      name: 'Michael Johnson',
      psuedoName: 'M.J.',
      visaStatus: 'OPT',
      degree: 'Doctor of Philosophy',
      passingYear: '2021',
      university: 'Harvard University',
      createdBy: 'Admin',
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
    { field: '_id', headerName: 'ID', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'psuedoName', headerName: 'Psuedo Name', width: 120 },
    { field: 'visaStatus', headerName: 'Visa Status', width: 150 },
    { field: 'degree', headerName: 'Degree', width: 150 },
    { field: 'passingYear', headerName: 'Passing year', width: 150 },
    { field: 'university', headerName: 'University', width: 120 },
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
    alert(`View details for Req ID: ${row.id}`);
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
        <h3>Consultants</h3>
      </div>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={openForm}
        onClose={handleCloseForm}
        title="Add New Consultant"
      >
        <ConsultantForm handleCloseForm={handleCloseForm} />
      </CustomDrawer>
    </>
  );
}
