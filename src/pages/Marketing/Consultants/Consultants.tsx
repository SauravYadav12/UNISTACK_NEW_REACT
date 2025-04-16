import { Button, IconButton } from '@mui/material';
import moment from 'moment';
import { useState } from 'react';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';
import { consultantsList } from '../../../services/consultantApi';
import { dateFormate2 } from '../../../components/constants';
import { usePagination } from '../../../hooks/paginationHook';

import SyncIcon from '@mui/icons-material/Sync';
import { syncDataById } from '../../../utils/syncDataById';

export default function Consultants() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewData, setViewData] = useState<any>();
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');

  const {
    gridData,
    paginationModel,
    error,
    loading,
    setPaginationModel,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: consultantsList,
    },
    []
  );

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
      valueGetter: (params: any) => moment(params).format(dateFormate2),
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = gridData?.results?.find(
      (r: any) => r.consultantId === row.consultantId
    );
    if (!data) return;
    setViewData(data);
    setFormTitle(`Consultant ID :- ${row.consultantId}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
    syncDataById(data, {
      queryFunction: consultantsList,
      setResults,
      viewDataState: [viewData, setViewData],
    });
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
      <span>
        <Button
          variant="contained"
          style={{ borderRadius: '10px' }}
          size="small"
          onClick={handleAddNew}
        >
          Add New
        </Button>
        <IconButton onClick={reload} disabled={loading} sx={{ ml: 1 }}>
          <SyncIcon
            className={loading ? 'sync-icon-loading' : ''}
            color="primary"
          />
        </IconButton>
      </span>
    </>
  );

  return (
    <>
      <CustomDataGrid
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        error={error}
        retry={reload}
        loading={loading}
        rows={gridData?.results || []}
        columns={columns}
        header={header}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        <ConsultantForm
          setResults={setResults}
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
