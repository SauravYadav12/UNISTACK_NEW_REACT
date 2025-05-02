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
import SearchRequirement from './SearchRequirement';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interviewStatusColors } from '../TestAndVendorInterviews/testAndViValues';
import { dateFormate2, timeFormate } from '../../../components/constants';
import { archiveInterviewsList } from '../../../services/archivesApi';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { FormMode } from '../Requirements/Requirements';
import { syncDataById } from '../../../utils/syncDataById';
import { requirementsList } from '../../../services/requirementApi';
import { createInterviewQueryParam } from './interviewValues';

interface Iprops {
  label: string;
  query: string;
  archiveState: [boolean, (s: boolean) => void];
}
export default function Interviews(props: Iprops) {
  const { isModuleAllowed } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDialog, setOpenDialog] = useState(false);
  const [requirement, setRequirement] = useState<any>();
  const [viewData, setViewData] = useState<any>({});
  const [mode, setMode] = useState<FormMode>('view');
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
    setSearchModel,
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
      width: 130,
      valueGetter: (params: any) => {
        return moment(params).format(dateFormate2);
      },
    },
    {
      field: 'interviewTime',
      headerName: 'Int Time',
      width: 150,
      valueGetter: (params: any, r: any) => {
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
      valueGetter: (val: string) => {
        return moment(val).format(dateFormate2);
      },
    },
  ];

  const handleViewDetails = (row: any) => {
    const data = gridData?.results?.find((r: any) => r.intId === row.intId);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Interview ID ${row.intId}`);
    setMode('view');
    setDrawerOpen(true);
    !archive &&
      syncDataById(data, {
        queryFunction: interviewsList,
        setViewData,
        setResults,
      });
  };

  const handleOpenForm = (record: any) => {
    setRequirement(record);
    setFormTitle('Add New Interview');
    setDrawerOpen(true);
    setOpenDialog(false);
    setMode('add');
    setViewData({});
  };
  const clearReqFromParams = () => {
    setSearchParams((pre) => {
      pre.delete(createInterviewQueryParam);
      return pre;
    });
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    clearReqFromParams();
    setRequirement(undefined);
    setViewData({});
  };
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };

  async function getInterviews(query?: string, signal?: AbortSignal) {
    const res = await interviewsList(query, signal);
    setArchive(false);
    return res;
  }
  async function getArchiveInterviews(query?: string, signal?: AbortSignal) {
    const res = await archiveInterviewsList(query, signal);
    setArchive(true);
    return res;
  }

  const createInterview = async (reqID: string) => {
    try {
      setDrawerOpen(true);
      const res = await requirementsList(`reqID=${reqID}`);
      const data = res.data.data?.results;
      if (!data?.length) {
        toast.error('No requirement found for this ID');
        return;
      }
      const requirement = data[0];
      handleOpenForm(requirement);
    } catch (error) {
      console.log('Error creating interview', error);
      toast.error('Error creating interview');
    }
  };
  useEffect(() => {
    const reqID = searchParams.get(createInterviewQueryParam);
    if (reqID?.length) {
      createInterview(reqID);
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
          <SearchRequirement onSelect={handleOpenForm} />
        </DialogContent>
      </Dialog>
      <CustomDataGrid
        header={dataGridHeader}
        rows={gridData?.results || []}
        columns={columns}
        loading={loading}
        error={error}
        retry={reload}
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={(model, detail, isServerSerachOn) =>
          setSearchModel(
            isServerSerachOn && model.quickFilterValues?.length
              ? model
              : initialSearchModel
          )
        }
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
      />
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        <InterviewForm
          onCreate={clearReqFromParams}
          setResults={setResults}
          hideButtons={archive}
          requirement={requirement}
          viewData={viewData}
          onDrawerClose={handleCloseForm}
          mode={mode}
          isEditing={mode !== 'view'}
          onEdit={handleEdit}
        />
      </CustomDrawer>
    </>
  );
}
