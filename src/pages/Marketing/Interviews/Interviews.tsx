import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import moment from 'moment';
import CustomDataGrid from '../../../components/datagrid/DataGrid';
import { useEffect, useState } from 'react';
import InterviewForm from './InterviewForm';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { interviewsList } from '../../../services/interviewApi';
import CustomSearch from './CustomSearch';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interviewStatusColors } from '../TestAndVendorInterviews/testAndViValues';
import { dateFormate, timeFormate } from '../../../components/constants';
import { archiveInterviewsList } from '../../../services/archivesApi';

type Record = {
  id: number;
  name: string;
  company: string;
  title: string;
};
interface Iprops {
  label: string;
  query: string;
  archiveState: [boolean, (s: boolean) => void];
}
export default function Interviews(props: Iprops) {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>();
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [archive, setArchive] = props.archiveState;

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
    { field: 'intId', headerName: 'Int ID', width: 100 },
    {
      field: 'interviewStatus',
      headerName: 'Int Status',
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
    { field: 'consultant', headerName: 'Consultant', width: 120 },
    {
      field: 'interviewDate',
      headerName: 'Int date',
      width: 100,
      valueFormatter: (params: any) => {
        return moment(params).format(dateFormate);
      },
    },
    {
      field: 'interviewTime',
      headerName: 'Int Time',
      width: 150,
      valueFormatter: (params: any, r: any) => {
        return (
          moment(params, timeFormate).format(timeFormate) +
          ' ' +
          (r.timeZone || '')
        );
      },
    },
    { field: 'intResult', headerName: 'Int Result', width: 150 },
    { field: 'subjectLine', headerName: 'Subject Line', width: 150 },
    { field: 'clientName', headerName: 'Client Name', width: 120 },
    { field: 'jobTitle', headerName: 'Job Title', width: 180 },
    { field: 'candidateName', headerName: 'Interviewee', width: 150 },
    { field: 'marketingPerson', headerName: 'Created by', width: 130 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params: any) => {
        return moment(params).format(dateFormate + ' ' + timeFormate);
      },
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = rows?.filter((r: any) => r.intId === row.intId);
    if (!data) return;
    setViewData(data[0]);
    setFormTitle(`Interview ID ${row.intId}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const handleOpenForm = (record: Record) => {
    console.log('record--', record);
    setSelectedRecord(record);
    setFormTitle('Add New Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
  };
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleEdit = (editMode: any) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };

  const createInterview = async (record: any) => {
    try {
      setDrawerOpen(true);
      handleOpenForm(record);
    } catch (error) {
      console.log('Error creating interview', error);
      toast.error('Error creating interview');
    }
  };

  const getInterviews = async () => {
    try {
      setError('')
      const { data } = await interviewsList(props.query);
      setRows(data.data || []);
      setArchive(false);
    } catch (error) {
      setError('Failed to load');
    }
  };
  const getArchiveInterviews = async () => {
    try {
      setError('')
      const { data } = await archiveInterviewsList(props.query);
      setRows(data.data || []);
      setArchive(true);
    } catch (error) {
      setError('Failed to load');
    }
  };
  async function getIntOnChangeArchiveButton() {
    if (archive) {
      getArchiveInterviews();
    } else {
      getInterviews();
    }
  }
  useEffect(() => {
    if (!archive) {
      getInterviews();
    }
  }, [drawerOpen, props.query]);

  useEffect(() => {
    getIntOnChangeArchiveButton();
  }, [props.query, archive]);

  useEffect(() => {
    const req = searchParams.get('createInterviewByReq');
    if (req) {
      createInterview(JSON.parse(req));
    }
  }, [searchParams]);

  const dataGridHeader = (
    <>
      <h3>{props.label}</h3>

      <Button
        variant="contained"
        size="small"
        onClick={handleClickOpen}
        style={{ borderRadius: '10px' }}
      >
        Add New
      </Button>
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
            Select the Record ID for creating an interview
          </DialogContentText>
          <CustomSearch
            onClick={handleOpenForm}
            setDrawerOpen={setDrawerOpen}
          />
        </DialogContent>
      </Dialog>
      <CustomDataGrid
        error={error}
        retry={getIntOnChangeArchiveButton}
        archiveState={[
          archive,
          (s) => {
            setArchive(s);
            setRows(undefined);
          },
          {
            disabled: !rows && !error,
          },
        ]}
        header={dataGridHeader}
        rows={rows || []}
        columns={columns}
        loading={!rows && !error}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
      >
        <InterviewForm
          hideButtons={archive}
          handleCloseForm={handleCloseForm}
          selectedRecord={selectedRecord}
          viewData={viewData}
          setDrawerOpen={setDrawerOpen}
          mode={mode}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
}
