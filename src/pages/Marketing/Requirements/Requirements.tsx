import { Button, Link } from '@mui/material';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useEffect, useState } from 'react';
import RequirementsForm from './RequirementsForm';
import { requirementsList } from '../../../services/requirementApi';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reqirementStatusColors } from './requirementsValues';
export default function Requirements() {
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [rows, setRows] = useState<any[]>();
  const [viewData, setViewData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  useEffect(() => {
    getRequirements();
  }, [drawerOpen]);

  const getRequirements = async () => {
    try {
      const { data } = await requirementsList(searchParams.toString());
      setRows(data.data || []);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to load');
    }
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

  const handleViewDetails = (row: any) => {
    const data = rows?.filter((r: any) => r.reqID === row.reqID);
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
  const header = (
    <>
      <h3>Requirements</h3>
      <Button
        variant="contained"
        style={{ borderRadius: '10px' }}
        onClick={handleAddNew}
        size="small"
      >
        Add New
      </Button>
    </>
  );
  return (
    <>
      <CustomDataGrid
        header={header}
        rows={rows || []}
        columns={columns}
        loading={!rows}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
        subTitle={
          viewData.isDuplicate && viewData.duplicateWith ? (
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
