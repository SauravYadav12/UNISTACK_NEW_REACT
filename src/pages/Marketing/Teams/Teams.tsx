import { Button, IconButton } from '@mui/material';
import CustomDataGrid, {
  GridFilterOption,
  iGridColumn,
} from '../../../components/datagrid/DataGrid';
import moment from 'moment';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import TeamsForm from './TeamsForm';
import { useState } from 'react';
import { teamsList } from '../../../services/teamsApi';
import { dateFormate2 } from '../../../components/constants';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { syncDataById } from '../../../utils/syncDataById';
import { GridFilterModel, GridCallbackDetails } from '@mui/x-data-grid';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';

export default function Teams() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState<any>({});

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
      queryFunction: teamsList,
    },
    []
  );

  const columns: readonly iGridColumn[] = [
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
      filterable: false,
      sortable: false,
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
      valueGetter: (params: any) => moment(params).format(dateFormate2),
      filterOperators: filterOperatorsForDateField,
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
    const data = gridData?.results?.find((r: any) => r.teamId === row.teamId);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Team ID :- ${row.teamId}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
    syncDataById(data, {
      queryFunction: teamsList,
      setResults,
      setViewData,
    });
  };
  const handleCloseForm = () => {
    setDrawerOpen(false);
    setViewData({});
  };
  const handleEdit = (editMode: any) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };

  const handleChangeFilterModel = (
    model: GridFilterModel,
    details: GridCallbackDetails<'filter'>,
    options: GridFilterOption
  ) => {
    const iModel =
      options.serverSideSearch && model.items.length && model.items[0].value
        ? model
        : initialSearchModel;
    setSearchModel(iModel);
  };

  const header = (
    <>
      <h3>Teams</h3>
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
        header={header}
        columns={columns}
        rows={gridData?.results || []}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        <TeamsForm
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
