import { Button } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import moment from 'moment';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import TeamsForm from './TeamsForm';
import { useEffect, useState } from 'react';
import { teamsList } from '../../../services/teamsApi';

export default function Teams() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState({});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getTeams();
  }, [drawerOpen]);

  async function getTeams() {
    try {
      const res = await teamsList();
      console.log('Teams Response', res);
      setRows(res.data.data);
    } catch (error) {
      console.error('Error while fetching API response', error);
    }
  }

  const columns = [
    {
      field: 'view',
      headerName: 'View',
      width: 150,
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
    { field: 'teamId', headerName: 'Team ID', width: 150 },
    { field: 'teamName', headerName: 'Name', width: 150 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'createdBy', headerName: 'Created by', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) =>
        moment(params).format('YYYY-MM-DD hh:mm A'),
    },
  ];

  const handleAddNew = () => {
    setFormTitle('Add New Teams');
    setViewData({});
    setMode('add');
    setIsEditing(true);
    setDrawerOpen(true);
  };
  const handleViewDetails = (row: any) => {
    const data = rows.filter((r: any) => r.teamId === row.teamId);
    console.log('viewRecord', data[0]);
    setViewData(data[0]);
    setFormTitle(`Team ID :- ${row.teamId}`);
    setMode('view');
    setIsEditing(false);
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
        <h3>Teams</h3>
      </div>
      <CustomDataGrid
        columns={columns}
        rows={rows}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
      >
        <TeamsForm
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
