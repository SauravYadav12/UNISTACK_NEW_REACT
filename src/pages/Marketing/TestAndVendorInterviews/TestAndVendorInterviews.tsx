import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CustomDataGrid, {
  GridFilterOption,
  iGridColumn,
} from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import SyncIcon from '@mui/icons-material/Sync';
import { useState } from 'react';
import moment from 'moment';
import TestAndVendorForm from './TestAndVendorForm';
import { vendorInterviewsList } from '../../../services/vendorInterviewApi';
import { interviewStatusColors } from './testAndViValues';
import { dateFormate2 } from '../../../components/constants';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import { syncDataById } from '../../../utils/syncDataById';
import { FormMode } from '../Requirements/Requirements';
import SearchRequirement from '../Interviews/SearchRequirement';
import { GridFilterModel, GridCallbackDetails } from '@mui/x-data-grid';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { teamsList } from '../../../services/teamsApi';
import { Sync } from '@mui/icons-material';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';

export default function TestAndVendorInterviews() {
  const [openDialog, setOpenDialog] = useState(false);
  const [requirement, setRequirement] = useState<any>();
  const [viewData, setViewData] = useState<any>({});
  const [mode, setMode] = useState<FormMode>('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const teamState = useFetchData(async () => {
    const { data } = await teamsList(`limit=5000`);
    return data.data?.results || [];
  });

  const formStateLoading = teamState.loading;
  const formStateError = teamState.error;

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
      queryFunction: vendorInterviewsList,
    },
    []
  );

  const columns: readonly iGridColumn[] = [
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
      filterable: false,
      sortable: false,
    },
    { field: 'testID', headerName: 'Test ID', width: 100 },
    {
      field: 'interviewStatus',
      headerName: 'Test Status',
      width: 180,
      renderCell: (params: any) => (
        <span
          style={{
            color: (interviewStatusColors as any)[params.row.interviewStatus],
          }}
        >
          {params.row.interviewStatus}
        </span>
      ),
    },
    {
      field: 'interviewDate',
      headerName: 'Test Entered Date',
      width: 120,
      valueGetter: (params: any) => {
        return moment(params).format(dateFormate2);
      },
      filterOperators: filterOperatorsForDateField,
    },
    { field: 'interviewDuration', headerName: 'Test Duration', width: 100 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'primeVendorCompany', headerName: 'Prime Company', width: 120 },
    { field: 'vendorCompany', headerName: 'Vendor Company', width: 120 },
    { field: 'createdBy', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params: any) => {
        return moment(params).format(dateFormate2);
      },
      filterOperators: filterOperatorsForDateField,
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = gridData?.results?.find((r: any) => r.testID === row.testID);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Vendor Interview ID ${row.testID}`);
    setMode('view');
    setDrawerOpen(true);
    syncDataById(data, {
      queryFunction: vendorInterviewsList,
      setResults,
      setViewData,
    });
  };

  const handleOpenForm = (record: any) => {
    setRequirement(record);
    setFormTitle('Add New Vendor Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setViewData({});
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    setViewData({});
  };
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleEdit = (editMode: any) => {
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
      <h3>Test and Vendor Interviews</h3>
      <span>
        <Button
          variant="contained"
          style={{ borderRadius: '10px' }}
          size="small"
          onClick={handleClickOpen}
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
      <Dialog
        open={openDialog}
        onClose={handleClose}
        sx={{
          '& .MuiDialog-paper': {
            width: '850px',
            maxWidth: '80%',
          },
        }}
      >
        <DialogTitle>Get Interview Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the Record ID for creating an Vendor interview
          </DialogContentText>
          <SearchRequirement onSelect={handleOpenForm} />
        </DialogContent>
      </Dialog>

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
        rows={gridData?.results || []}
        columns={columns}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        {formStateLoading ? (
          <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
            <CircularProgress />
          </Box>
        ) : formStateError ? (
          <Box textAlign={'center'}>
            <Typography color="error">{formStateError}</Typography>
            <IconButton
              onClick={() => {
                teamState.loadData();
              }}
            >
              <Sync color="primary" />
            </IconButton>
          </Box>
        ) : (
          <TestAndVendorForm
            teamsList={teamState.data || []}
            setResults={setResults}
            requirement={requirement}
            viewData={viewData}
            onDrawerClose={handleCloseForm}
            mode={mode}
            isEditing={mode !== 'view'}
            onEdit={handleEdit}
          />
        )}
      </CustomDrawer>
    </>
  );
}
