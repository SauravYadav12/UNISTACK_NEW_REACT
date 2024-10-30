import {Button} from "@mui/material";
import CustomDataGrid from "../../../components/datagrid/DataGrid";
import moment from 'moment';
import CustomDrawer from "../../../components/drawer/CustomDrawer";
import { useState } from "react";
import RequirementsForm from "./RequirementsForm";


export default function Requirements() {

  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = [
    {
      id: 1,
      reqId: '1234',
      assignedTo: 'John Doe',
      appliedFor: 'Software Engineer',
      clientName: 'ABC Corp',
      reqStatus: 'Open',
      nextStep: 'Interview',
      vendorCompany: 'Vendor X',
      vendorPerson: 'Alice Smith',
      vendorPhone: '555-1234',
      requirementTitle: 'Backend Developer',
      createdBy: 'Jane Doe',
      createdAt: '2023-09-22T12:00:00Z',
    },
    {
      id: 2,
      reqId: '2134',
      assignedTo: 'John Doe',
      appliedFor: 'Software Engineer',
      clientName: 'ABC Corp',
      reqStatus: 'Open',
      nextStep: 'Interview',
      vendorCompany: 'Vendor X',
      vendorPerson: 'Alice Smith',
      vendorPhone: '555-1234',
      requirementTitle: 'Backend Developer',
      createdBy: 'Jane Doe',
      createdAt: '2023-09-22T12:00:00Z',
    },
    {
      id: 3,
      reqId: '2234',
      assignedTo: 'John Doe',
      appliedFor: 'Software Engineer',
      clientName: 'ABC Corp',
      reqStatus: 'Open',
      nextStep: 'Interview',
      vendorCompany: 'Vendor X',
      vendorPerson: 'Alice Smith',
      vendorPhone: '555-1234',
      requirementTitle: 'Backend Developer',
      createdBy: 'Jane Doe',
      createdAt: '2023-09-22T12:00:00Z',
    },
    {
      id: 4,
      reqId: '2334',
      assignedTo: 'John Doe',
      appliedFor: 'Software Engineer',
      clientName: 'ABC Corp',
      reqStatus: 'Open',
      nextStep: 'Interview',
      vendorCompany: 'Vendor X',
      vendorPerson: 'Alice Smith',
      vendorPhone: '555-1234',
      requirementTitle: 'Backend Developer',
      createdBy: 'Jane Doe',
      createdAt: '2023-09-22T12:00:00Z',
    },
    {
      id: 5,
      reqId: '12244334',
      assignedTo: 'John Doe',
      appliedFor: 'Software Engineer',
      clientName: 'ABC Corp',
      reqStatus: 'Open',
      nextStep: 'Interview',
      vendorCompany: 'Vendor X',
      vendorPerson: 'Alice Smith',
      vendorPhone: '555-1234',
      requirementTitle: 'Backend Developer',
      createdBy: 'Jane Doe',
      createdAt: '2023-09-22T12:00:00Z',
    },
  ];

  const columns = [
        {
          field: 'view',
          headerName: 'View',
          width: 100,
          renderCell: (params:any) => (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => handleViewDetails(params.row)}
            >
              View
            </Button>
          ),
        },
        { field: 'reqId', headerName: 'Req ID', width: 100 },
        { field: 'assignedTo', headerName: 'Assigned to', width: 150 },
        { field: 'appliedFor', headerName: 'Applied For', width: 150 },
        { field: 'clientName', headerName: 'Client Name', width: 150 },
        { field: 'reqStatus', headerName: 'Req Status', width: 120 },
        { field: 'nextStep', headerName: 'Next Step', width: 120 },
        { field: 'vendorCompany', headerName: 'Vendor Company', width: 150 },
        { field: 'vendorPerson', headerName: 'Vendor Person', width: 150 },
        { field: 'vendorPhone', headerName: 'Vendor Phone', width: 130 },
        { field: 'requirementTitle', headerName: 'Requirement Title', width: 200 },
        { field: 'createdBy', headerName: 'Created by', width: 130 },
        {field: 'createdAt',headerName: 'Created At',width: 180,
          valueFormatter: (params:any) => moment(params.value).format('YYYY-MM-DD HH:mm'),
        },
      ];

  const handleViewDetails = (row:any) => {
    alert(`View details for Req ID: ${row.reqId}`);
  };

  const handleAddNew = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
  <>
    <div>
     <Button variant="contained" style={{ marginRight: 25, float: 'right'}} onClick={handleAddNew} size="small">Add New</Button>
     <h3>Requirements</h3>
    </div>
    <CustomDataGrid rows={rows} columns={columns} onViewDetails={handleViewDetails} />
    <CustomDrawer 
        open={drawerOpen}
        onClose={handleDrawerClose}
        title="Add New Requirement"
        >
          <RequirementsForm />
        </CustomDrawer>
  </>
  )
}