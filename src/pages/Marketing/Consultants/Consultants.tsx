import { Button } from '@mui/material';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';
import { consultantsList } from '../../../services/consultantApi';

export default function Consultants() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');

  useEffect(() => {
    getConsultants();
  }, [drawerOpen]);

  const getConsultants = async () => {
    try {
      const res = await consultantsList();
      console.log('Response', res.data.data);
      setRows(res.data.data);
    } catch (error) {
      console.error('Error while fetching API response', error);
    }
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
    { field: 'consultantId', headerName: 'ID', width: 100 },
    { field: 'consultantStatus', headerName: 'Status', width: 120 },
    { field: 'consultantName', headerName: 'Name', width: 120 },
    { field: 'psuedoName', headerName: 'Psuedo Name', width: 120 },
    { field: 'visaStatus', headerName: 'Visa Status', width: 150 },
    { field: 'degree', headerName: 'Degree', width: 150 },
    { field: 'yearPassing', headerName: 'Passing year', width: 150 },
    { field: 'university', headerName: 'University', width: 120 },
    { field: 'createdBy', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) =>
        moment(params).format('YYYY-MM-DD hh:mm A'),
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = rows.filter((r: any) => r.consultantId === row.consultantId);
    // console.log('viewRecord', data[0]);
    setViewData(data[0]);
    setFormTitle(`Consultant ID :- ${row.consultantId}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const handleAddNew = () => {
    setFormTitle('Add New Consultant');
    setViewData({});
    setMode('add');
    setIsEditing(true);
    setDrawerOpen(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
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
          onClick={handleAddNew}
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
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
      >
        <ConsultantForm
          viewData={viewData}
          mode={mode}
          setDrawerOpen={setDrawerOpen}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
}
