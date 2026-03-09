import { Button, IconButton } from '@mui/material';
import { useState } from 'react';
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
import { dateFormate2 } from '../../../components/constants';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import SalesLeadAssignedToSelect from '../../../components/salesLead/SalesLeadAssignedToSelect';
import { usersList } from '../../../services/authApi';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { syncDataById } from '../../../utils/syncDataById';
import {
  GridFilterModel,
  GridCallbackDetails,
  GridColDef,
} from '@mui/x-data-grid';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import { FormMode } from '../Requirements/Requirements';
const SalesLeads = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState<FormMode>('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState<iSalesLead | undefined>(undefined);
  const accountsState = useFetchData(getAccountList, []);
  const { data: accounts } = accountsState;
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
      queryFunction: getSalesLeads,
    },
    []
  );

  const columns: GridColDef<iSalesLead>[] = [
    {
      field: 'view',
      headerName: 'View',
      width: 150,
      renderCell: (params) => (
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
      filterable: false,
      sortable: false,
    },
    {
      field: 'firstName',
      headerName: 'Name',
      width: 150,
      valueGetter: (v: string, row: iSalesLead) =>
        `${row.firstName} ${row.lastName}`,
    },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      valueGetter: (v) => v || 'NA',
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 200,

      type: 'actions',
      renderCell: (params) => (
        <SalesLeadAssignedToSelect
          selectOptions={accounts || []}
          row={params.row}
          setRows={setResults}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,

      type: 'actions',
      renderCell: (params) => (
        <SalesLeadStatusSelect row={params.row} setRows={setResults} />
      ),
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 150,
      valueGetter: (params) =>
        `${Country.getCountryByCode(params)?.name} (${params})`,
    },
    { field: 'city', headerName: 'City', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => moment(params).format(dateFormate2),
      filterOperators: filterOperatorsForDateField,
    },
  ];
  const handleViewDetails = (row: iSalesLead) => {
    const data = gridData?.results?.find((r) => r._id === row._id);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Sales Lead : ${row.firstName + ' ' + row.lastName}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
    syncDataById(data, {
      queryFunction: getSalesLeads,
      setResults,
      setViewData,
    });
  };

  const handleEdit = (row: iSalesLead) => {
    setResults((pre) => {
      pre = pre?.map((r) => {
        if (r._id === row._id) return row;
        return r;
      });
      return [...pre||[]];
    });
  };

  const filterRows = (id: string) => {
    setResults((pre) => {
      pre = pre?.filter((r) => r._id !== id);
      return [...pre||[]];
    });
  };

  async function getAccountList() {
    const { data } = await usersList();
    const { users } = data;
    return users.filter((u) => u.active) || [];
  }

  function onReload() {
    reload();
    accountsState.loadData();
  }

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

  const dataGridHeader = (
    <>
      <h3>Sales Leads</h3>
      <IconButton onClick={onReload} disabled={loading}>
        <SyncIcon
          className={loading ? 'sync-icon-loading' : ''}
          color="primary"
        />
      </IconButton>
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
        error={error || accountsState.error}
        retry={onReload}
        header={dataGridHeader}
        loading={loading || accountsState.loading}
        columns={columns}
        rows={gridData?.results || []}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={formTitle}
        closeOnOutSideClick
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
