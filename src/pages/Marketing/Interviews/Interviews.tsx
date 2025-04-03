import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
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
import { usePagination } from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
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
  const { isModuleAllowed } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [viewData, setViewData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [archive, setArchive] = props.archiveState;
  const isArchiveInterviewModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Interviews)
  );

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
      queryFunction: archive ? getArchiveInterviews : getInterviews,
      queryParams: props.query,
    },
    [archive, props.query]
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
    const data = gridData?.results?.filter((r: any) => r.intId === row.intId);
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
  const clearReqFromParams = () => {
    setSearchParams((pre) => {
      pre.delete('createInterviewByReq');
      return pre;
    });
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    clearReqFromParams();
  };
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleEdit = (editMode: boolean) => {
    setIsEditing(() => editMode);
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

  async function getInterviews(query?: string) {
    const res = await interviewsList(query);
    setArchive(false);
    return res;
  }
  async function getArchiveInterviews(query?: string) {
    const res = await archiveInterviewsList(query);
    setArchive(true);
    return res;
  }

  useEffect(() => {
    const req = searchParams.get('createInterviewByReq');
    if (req) {
      createInterview(JSON.parse(req));
    }
  }, [searchParams]);

  const dataGridHeader = (
    <>
      <h3>{props.label}</h3>

      <span>
        {!archive && (
          <Button
            variant="contained"
            size="small"
            onClick={handleClickOpen}
            style={{ borderRadius: '10px' }}
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
        retry={reload}
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        archiveState={
          isArchiveInterviewModuleAllowed
            ? [
                archive,
                (s) => {
                  setArchive(s);
                  setGridData(undefined);
                },
                {
                  disabled: loading,
                },
              ]
            : undefined
        }
        header={dataGridHeader}
        rows={gridData?.results || []}
        columns={columns}
        loading={loading}
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
      >
        <InterviewForm
          onCreate={clearReqFromParams}
          setResults={setResults}
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
