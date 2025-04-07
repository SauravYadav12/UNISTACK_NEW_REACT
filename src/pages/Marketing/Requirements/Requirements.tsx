import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useState } from 'react';
import RequirementsForm from './RequirementsForm';
import { requirementsList } from '../../../services/requirementApi';
import { useSearchParams } from 'react-router-dom';
import { reqirementStatusColors } from './requirementsValues';
import { archiveRequirementsList } from '../../../services/archivesApi';
import { usersList } from '../../../services/authApi';
import { usePagination } from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { consultantsList } from '../../../services/consultantApi';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { jUser } from '../../../Interfaces/iUser';
import { Sync } from '@mui/icons-material';
export default function Requirements() {
  const { isModuleAllowed } = useAuth();
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [viewData, setViewData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  const [archive, setArchive] = useState(false);
  const accountsState = useFetchData<jUser[]>(getAccountList, []);
  const { data: accounts } = accountsState;
  const consultantsState = useFetchData(getConsultantsList, []);
  const { data: consultants } = consultantsState;
  const isViewDataDuplicate =
    Boolean(viewData.isDuplicate) && Boolean(viewData.duplicateWith?.trim());

  const isArchiveRequirementModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Requirements)
  );

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
    {
      field: 'reqStatus',
      headerName: 'Req Status',
      width: 120,
      renderCell: (params: any) => (
        <span
          style={{
            color: (reqirementStatusColors as any)[params.row.reqStatus],
          }}
        >
          {params.row.reqStatus}
        </span>
      ),
    },
    { field: 'nextStep', headerName: 'Next Step', width: 120 },
    { field: 'vendorCompany', headerName: 'Vendor Company', width: 150 },
    { field: 'vendorPersonName', headerName: 'Vendor Person', width: 150 },
    { field: 'vendorPhone', headerName: 'Vendor Phone', width: 130 },
    { field: 'jobTitle', headerName: 'Requirement Title', width: 200 },
    { field: 'reqEnteredBy', headerName: 'Created by', width: 130 },
  ];
  const {
    gridData,
    paginationModel,
    error,
    loading,
    setPaginationModel,
    setGridData,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: archive ? getArchiveRequirements : getRequirements,
      queryParams: searchParams.toString(),
    },
    [archive]
  );

  async function getRequirements(query?: string) {
    const res = await requirementsList(query);
    setArchive(false);
    return res;
  }

  async function getArchiveRequirements(query?: string) {
    const res = await archiveRequirementsList(query);
    setArchive(true);
    return res;
  }

  const onChangeArchiveButton = (status: boolean) => {
    setArchive(status);
    setGridData(undefined);
  };

  const handleViewDetails = (row: any) => {
    const data = gridData?.results?.filter((r: any) => r.reqID === row.reqID);
    if (!data) return;
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

  const handleCopy = () => {
    setMode('add');
    setIsEditing(true);
    setFormTitle('Add New Requirement');
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  async function getAccountList() {
    const { data } = await usersList();
    const { users } = data;
    return users;
  }

  async function getConsultantsList() {
    const { data } = await consultantsList(
      `consultantStatus=Active&limit=5000`
    );
    return data.data?.results || [];
  }

  const header = (
    <>
      <h3>Requirements</h3>
      <span>
        {!archive && (
          <Button
            variant="contained"
            style={{ borderRadius: '10px' }}
            onClick={handleAddNew}
            size="small"
          >
            Add New
          </Button>
        )}
        <IconButton onClick={reload} disabled={loading} sx={{ ml: 1 }}>
          <SyncIcon
            className={loading ? 'sync-icon-loading' : ''}
            color="primary"
          />
        </IconButton>
      </span>
    </>
  );

  function MyForm() {
    const formLoading = accountsState.loading || consultantsState.loading;
    const formError = accountsState.error || consultantsState.error;

    const reload = () => {
      accountsState.loadData();
      consultantsState.loadData;
    };

    if (formLoading)
      return (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      );

    if (formError) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={reload}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }

    return (
      <RequirementsForm
        setResults={setResults}
        hideButtons={archive}
        accounts={accounts}
        consultants={consultants}
        viewData={viewData}
        mode={mode}
        setDrawerOpen={setDrawerOpen}
        isEditing={isEditing}
        onEdit={handleEdit}
        onCopy={handleCopy}
      />
    );
  }

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
        archiveState={
          isArchiveRequirementModuleAllowed
            ? [archive, onChangeArchiveButton, { disabled: loading }]
            : undefined
        }
        header={header}
        rows={gridData?.results || []}
        columns={columns}
        loading={loading}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
        subTitle={
          isViewDataDuplicate ? (
            <>
              Copied from :{' '}
              <Link target="_blank" href={'?reqID=' + viewData.duplicateWith}>
                {viewData.duplicateWith}
              </Link>
            </>
          ) : null
        }
      >
        <MyForm />
      </CustomDrawer>
    </>
  );
}
