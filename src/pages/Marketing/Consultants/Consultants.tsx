import { Button } from '@mui/material';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';
import { consultantsList } from '../../../services/consultantApi';
import { toast } from 'react-toastify';
import { dateFormate, timeFormate } from '../../../components/constants';

export default function Consultants() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rows, setRows] = useState<any[]>();
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');

  useEffect(() => {
    getConsultants();
  }, [drawerOpen]);

  const getConsultants = async () => {
    try {
      const { data } = await consultantsList();
      setRows(data.data || []);
    } catch (error) {
      toast.error('Failed to load');
      console.error('Error while fetching API response', error);
    }
  };
  const statusColor = (s: any) => {
    if (s === 'Active') {
      return 'green';
    }
    return 'red';
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
    {
      field: 'consultantStatus',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <span style={{ color: statusColor(params.row.consultantStatus) }}>
          {params.row.consultantStatus}
        </span>
      ),
    },
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
        moment(params).format(dateFormate+' '+timeFormate),
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = rows?.filter((r: any) => r.consultantId === row.consultantId);
    if (!data) return;
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

  const header = (
    <>
      <h3>Consultants</h3>
      <Button
        variant="contained"
        style={{ borderRadius: '10px' }}
        size="small"
        onClick={handleAddNew}
      >
        Add New
      </Button>
    </>
  );

  return (
    <>
      <CustomDataGrid
        loading={!rows}
        rows={rows || []}
        columns={columns}
        header={header}
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
