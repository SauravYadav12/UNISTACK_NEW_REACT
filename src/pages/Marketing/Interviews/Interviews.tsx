import { Button } from "@mui/material";
import moment from "moment";
import CustomDataGrid from "../../../components/datagrid/DataGrid";
import { useState } from "react";
import InterviewForm from "./InterviewForm";
import CustomDrawer from "../../../components/drawer/CustomDrawer";

export default function Interviews() {

  const [openForm, setOpenForm] = useState(false);

  const rows = [
    {
      id: 1,
      intID: 'INT123',
      consultant: 'John Doe',
      intDate: '2024-10-15',
      intTimeEST: '10:00 AM',
      intResult: 'Passed',
      clientName: 'ABC Corp',
      subjectLine: 'Interview Schedule',
      intStatus: 'In Progress',
      jobTitle: 'Software Engineer',
      vendorCompany: 'XYZ Solutions',
      interviewee: 'Jane Smith',
      createdBy: 'HR Team',
      createdAt: '2024-10-01T14:30:00',
    },
    {
      id: 2,
      intID: 'INT124',
      consultant: 'Emily Davis',
      intDate: '2024-10-16',
      intTimeEST: '11:00 AM',
      intResult: 'Failed',
      clientName: 'Tech Innovators',
      subjectLine: 'Technical Interview',
      intStatus: 'Completed',
      jobTitle: 'Frontend Developer',
      vendorCompany: 'Beta Systems',
      interviewee: 'Michael Johnson',
      createdBy: 'HR Team',
      createdAt: '2024-10-02T09:45:00',
    },
    {
      id: 3,
      intID: 'INT125',
      consultant: 'Sophia Brown',
      intDate: '2024-10-17',
      intTimeEST: '02:00 PM',
      intResult: 'Passed',
      clientName: 'Global Solutions',
      subjectLine: 'Final Round',
      intStatus: 'Scheduled',
      jobTitle: 'Data Scientist',
      vendorCompany: 'Innovatech',
      interviewee: 'Liam Wilson',
      createdBy: 'HR Team',
      createdAt: '2024-10-03T12:00:00',
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
    { field: 'intID', headerName: 'Int ID', width: 100 },
    { field: 'intStatus', headerName: 'Int Status', width: 120 },
    { field: 'consultant', headerName: 'Consultant', width: 120 },
    { field: 'intDate', headerName: 'Int date', width: 100 },
    { field: 'intTimeEST', headerName: 'Int Time (EST)', width: 150 },
    { field: 'intResult', headerName: 'Int Result', width: 150 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'jobTitle', headerName: 'Job Title', width: 180 },
    { field: 'interviewee', headerName: 'Interviewee', width: 150 },
    { field: 'createdBy', headerName: 'Created by', width: 130 },
    {field: 'createdAt',headerName: 'Created At',width: 180,
      valueFormatter: (params:any) => moment(params.value).format('YYYY-MM-DD hh:mm A'),
    },
  ];

  const handleViewDetails = (row:any) => {
    alert(`View details for Req ID: ${row.intID}`);
  };

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };


  return (
    <>
    <div>
      <Button variant="contained" style={{ marginRight: 25, float: 'right'}} size="small"
      onClick={handleOpenForm}
      >Add New</Button>
      <h3>Interviews</h3>
    </div>
      <CustomDataGrid rows={rows} columns={columns} onViewDetails={handleViewDetails}/>
      <CustomDrawer
      open={openForm}
      onClose={handleCloseForm}
      title="Add New Interview"
      >
        <InterviewForm handleCloseForm={handleCloseForm}/>
      </CustomDrawer>
    </>
  )
  ;
}