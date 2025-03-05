import { Button, IconButton, Link } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useEffect, useState } from 'react';
import RequirementsForm from './RequirementsForm';
import { requirementsList } from '../../../services/requirementApi';
import { useSearchParams } from 'react-router-dom';
import { reqirementStatusColors } from './requirementsValues';
import { archiveRequirementsList } from '../../../services/archivesApi';
import { usersList } from '../../../services/authApi';
import { usePagination } from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { consultantsList } from '../../../services/consultantApi';
export default function Requirements() {
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [viewData, setViewData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  const [archive, setArchive] = useState(false);
  const [accounts, setAccounts] = useState<any[]>();
  const [consultants, setConsultants] = useState<any[]>();

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
    try {
      const { data } = await usersList();
      const { users } = data;
      setAccounts(users.filter((u: any) => u.active) || []);
    } catch (error) {
      console.log(error);
    }
  }
  async function getConsultantsList() {
    try {
      const { data } = await consultantsList(
        `consultantStatus=Active&limit=5000`
      );
      setConsultants(data.data?.results || []);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getAccountList();
    getConsultantsList();
  }, []);

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

  const isViewDataDuplicate =
    Boolean(viewData.isDuplicate) && Boolean(viewData.duplicateWith?.trim());

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
        archiveState={[archive, onChangeArchiveButton, { disabled: loading }]}
        header={header}
        rows={gridData?.results || []}
        columns={columns}
        loading={loading}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
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
      </CustomDrawer>
    </>
  );
}
