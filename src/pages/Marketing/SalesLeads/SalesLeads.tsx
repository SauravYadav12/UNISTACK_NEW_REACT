import { Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { getSalesLeads } from '../../../services/salesLeadsApi';
import { iSalesLead } from '../../../Interfaces/salesLeads';
import SalesLeadForm from './SalesLeadForm';
import SalesLeadStatusSelect from '../../../components/salesLead/SalesLeadStatusSelect';
import { Country } from 'country-state-city';
const SalesLeads = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState({});
  const [rows, setRows] = useState<iSalesLead[]>();
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
    {
      field: 'firstName',
      headerName: 'Name',
      width: 150,
      valueFormatter: (v: string, row: iSalesLead) =>
        `${row.firstName} ${row.lastName}`,
    },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      valueFormatter: (v: any) => v || 'NA',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,

      type: 'actions',
      renderCell: (params: any) => (
        <SalesLeadStatusSelect row={params.row} setRows={setRows} />
      ),
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 150,
      valueFormatter: (params: any) =>
        `${Country.getCountryByCode(params)?.name} (${params})`,
    },
    { field: 'city', headerName: 'City', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) =>
        moment(params).format('YYYY-MM-DD hh:mm A'),
    },
  ];
  const handleViewDetails = (row: iSalesLead) => {
    const data = rows?.filter((r) => r._id === row._id);
    if (!data?.length) return;
    console.log('viewRecord', data);
    setViewData(data[0]);
    setFormTitle(`Sales Lead ID :- ${row._id}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
  };
  const handleEdit = (editMode: any) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };
  async function initSalesLeads() {
    try {
      const { data } = await getSalesLeads();
      console.log('Teams Response', data.data);
      setRows(data.data || []);
      console.log(data.data);
    } catch (error) {
      console.error('Error while fetching API response', error);
    }
  }

  useEffect(() => {
    initSalesLeads();
  }, [drawerOpen]);

  return (
    <>
      <div>
        <h3>Sales Leads</h3>
      </div>
      <CustomDataGrid
        columns={columns}
        rows={rows || []}
        onViewDetails={handleViewDetails}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={formTitle}
      >
        <SalesLeadForm
          viewData={viewData}
          mode={mode}
          setDrawerOpen={setDrawerOpen}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
};

export default SalesLeads;
