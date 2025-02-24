import { Button, IconButton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { getSalesLeads } from '../../../services/salesLeadsApi';
import { iSalesLead } from '../../../Interfaces/salesLeads';
import SalesLeadForm from './SalesLeadForm';
import SalesLeadStatusSelect from '../../../components/salesLead/SalesLeadStatusSelect';
import SyncIcon from '@mui/icons-material/Sync';
import { Country } from 'country-state-city';
import './salesLead.css';
import { dateFormate, timeFormate } from '../../../components/constants';
const SalesLeads = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');
  const [isEditing, setIsEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viewData, setViewData] = useState({});
  const [rows, setRows] = useState<iSalesLead[]>();
  const [error, setError] = useState<string>('');
  const columns = [
    {
      field: 'view',
      headerName: 'View',
      width: 150,
      renderCell: (params: any) => (
        <Button
          size="small"
          variant="contained"
          color={params.row.comments.length ? 'success' : 'primary'}
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
        moment(params).format(dateFormate + ' ' + timeFormate),
    },
  ];
  const handleViewDetails = (row: iSalesLead) => {
    const data = rows?.filter((r) => r._id === row._id);
    if (!data?.length) return;
    console.log('viewRecord', data);
    setViewData(data[0]);
    setFormTitle(`Sales Lead : ${row.firstName + ' ' + row.lastName}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
  };
  const handleEdit = (row: iSalesLead) => {
    setRows((pre) => {
      if (!pre) return;
      pre = pre.map((r) => {
        if (r._id === row._id) return row;
        return r;
      });
      return [...pre];
    });
  };
  const filterRows = (id: string) => {
    setRows((pre) => {
      if (!pre) return;
      pre = pre.filter((r) => r._id !== id);
      return [...pre];
    });
  };
  async function initSalesLeads() {
    try {
      setError('');
      setSyncing(true);
      const { data } = await getSalesLeads();
      setRows(data.data || []);
      console.log('getting');
    } catch (error) {
      setError('Failed to load');
      console.error('Error while fetching API response', error);
    } finally {
      setSyncing(false);
    }
  }

  const syncSalesLeads = async () => {
    await initSalesLeads();
  };

  useEffect(() => {
    initSalesLeads();
  }, []);

  const dataGridHeader = (
    <>
      <h3>Sales Leads</h3>
      <IconButton onClick={syncSalesLeads} disabled={syncing}>
        <SyncIcon
          className={syncing ? 'sync-icon-loading' : ''}
          color="primary"
        />
      </IconButton>
    </>
  );

  return (
    <>
      <CustomDataGrid
        error={error}
        retry={initSalesLeads}
        header={dataGridHeader}
        loading={syncing&&!error}
        columns={columns}
        rows={rows || []}
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
          onDelete={filterRows}
        />
      </CustomDrawer>
    </>
  );
};

export default SalesLeads;
