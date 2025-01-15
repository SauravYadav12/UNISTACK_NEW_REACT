import { Button } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import moment from 'moment';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useEffect, useState } from 'react';
import RequirementsForm from './RequirementsForm';
import { requirementsList } from '../../../services/requirementApi';

export default function Requirements() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [rows, setRows] = useState([]);
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');

  useEffect(() => {
    getRequirements();
  }, [drawerOpen]);

  const getRequirements = async () => {
    try {
      const res = await requirementsList();
      console.log('API Response:', res.data);
      setRows(res.data.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
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
    { field: 'reqID', headerName: 'Req ID', width: 180 },
    { field: 'assignedTo', headerName: 'Assigned to', width: 120 },
    { field: 'appliedFor', headerName: 'Applied For', width: 150 },
    { field: 'clientCompany', headerName: 'Client Name', width: 150 },
    { field: 'reqStatus', headerName: 'Req Status', width: 120 },
    { field: 'nextStep', headerName: 'Next Step', width: 120 },
    { field: 'vendorCompany', headerName: 'Vendor Company', width: 150 },
    { field: 'vendorPersonName', headerName: 'Vendor Person', width: 150 },
    { field: 'vendorPhone', headerName: 'Vendor Phone', width: 130 },
    { field: 'jobTitle', headerName: 'Requirement Title', width: 200 },
    { field: 'reqEnteredBy', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) => {
        return moment(params).format('YYYY-MM-DD HH:mm');
      },
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = rows.filter((r: any) => r.reqID === row.reqID);
    // console.log('Data', data[0]);
    setViewData(data[0]);
    setFormTitle(`Requirement ID ${row.reqID}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const handleEdit = (editMode: any) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };

  const handleAddNew = () => {
    setFormTitle('Add New Requirement');
    setViewData({});
    setMode('add');
    setIsEditing(true);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      <div>
        <Button
          variant="contained"
          style={{ marginRight: 25, float: 'right', borderRadius: '10px' }}
          onClick={handleAddNew}
          size="small"
        >
          Add New
        </Button>
        <h3>Requirements</h3>
      </div>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
      >
        <RequirementsForm
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
