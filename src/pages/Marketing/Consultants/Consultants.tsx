import { Button, IconButton } from '@mui/material';
import moment from 'moment';
import { useState } from 'react';
import CustomDataGrid, {
} from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';
import { consultantsList } from '../../../services/consultantApi';
import { dateFormate2 } from '../../../components/constants';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';

import SyncIcon from '@mui/icons-material/Sync';
import { syncDataById } from '../../../utils/syncDataById';
import { FormMode } from '../Requirements/Requirements';
import { GridFilterModel, GridCallbackDetails, GridColDef } from '@mui/x-data-grid';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import { IConsultant } from '../../../Interfaces/types';

export default function Consultants() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewData, setViewData] = useState<IConsultant>();
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState<FormMode>('view');

  const {
    gridData,
    paginationModel,
    error,
    loading,
    setSearchModel,
    setPaginationModel,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: consultantsList,
    },
    []
  );

  const statusColor = (s: string) => {
    if (s === 'Active') {
      return 'green';
    }
    return 'red';
  };
  const columns: GridColDef<IConsultant>[] = [
    {
      field: 'view',
      headerName: 'View',
      width: 100,
      renderCell: (params) => (
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
      filterable: false,
      sortable: false,
    },
    { field: 'consultantId', headerName: 'ID', width: 100 },
    {
      field: 'consultantStatus',
      headerName: 'Status',
      width: 120,
      renderCell: ({ row }) => (
        <span style={{ color: statusColor(row.consultantStatus||'') }}>
          {row.consultantStatus}
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
      valueGetter: (params,row) => moment(row.createdAt).format(dateFormate2),
      filterOperators: filterOperatorsForDateField,
    },
  ];

  const handleViewDetails = (row: IConsultant) => {
    const data = gridData?.results?.find(
      (r) => r.consultantId === row.consultantId
    );
    if (!data) return;
    setViewData(data);
    setFormTitle(`Consultant ID :- ${row.consultantId}`);
    setMode('view');
    setDrawerOpen(true);
    syncDataById(data, {
      queryFunction: consultantsList,
      setResults,
      setViewData,
    });
  };

  const handleAddNew = () => {
    setFormTitle('Add New Consultant');
    setViewData(undefined);
    setMode('add');
    setDrawerOpen(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    setViewData(undefined);
  };

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };

  const handleChangeFilterModel = (
    model: GridFilterModel,
    details: GridCallbackDetails<'filter'>
  ) => {
    const iModel =
      model.items[0]?.value || model.quickFilterValues?.length
        ? model
        : initialSearchModel;
    setSearchModel(iModel);
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
        onFilterModelChange={handleChangeFilterModel}
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
          onDrawerClose={handleCloseForm}
          isEditing={mode !== 'view'}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
}
