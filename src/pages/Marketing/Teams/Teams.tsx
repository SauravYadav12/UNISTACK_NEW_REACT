import { Button, IconButton } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
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
import {
  GridFilterModel,
  GridCallbackDetails,
  GridColDef,
} from '@mui/x-data-grid';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import { ITeam } from '../../../Interfaces/types';
import { FormMode } from '../Requirements/Requirements';

export default function Teams() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState<FormMode>('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState<ITeam>();

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

  const columns: GridColDef<ITeam>[] = [
    {
      field: 'view',
      headerName: 'View',
      width: 150,
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
    { field: 'teamId', headerName: 'Team ID', width: 150 },
    { field: 'teamName', headerName: 'Name', width: 150 },
    { field: 'teckStack', headerName: 'Teck Stack', width: 150 },
    { field: 'developerName', headerName: 'Developer Name', width: 150 },
    { field: 'createdBy', headerName: 'Created by', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => moment(params).format(dateFormate2),
      filterOperators: filterOperatorsForDateField,
    },
  ];

  const handleAddNew = () => {
    setFormTitle('Add New Teams');
    setViewData(undefined);
    setMode('add');
    setIsEditing(true);
    setDrawerOpen(true);
  };
  const handleViewDetails = (row: ITeam) => {
    const data = gridData?.results?.find((r) => r.teamId === row.teamId);
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
    setViewData(undefined);
  };
  const handleEdit = (editMode: boolean) => {
    setIsEditing(editMode);
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
