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
import moment from 'moment';
import CustomDataGrid, {
  GridFilterOption,
  iGridColumn,
} from '../../../components/datagrid/DataGrid';
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
import { GridFilterModel, GridCallbackDetails } from '@mui/x-data-grid';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { teamsList } from '../../../services/teamsApi';
import { Sync } from '@mui/icons-material';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';

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

  const teamState = useFetchData(async () => {
    const { data } = await teamsList(`limit=5000`);
    return data.data?.results || [];
  });

  const formStateLoading = teamState.loading;
  const formStateError = teamState.error;

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
      sortable: false,
      filterable: false,
    },
    { field: 'intId', headerName: 'ID', width: 100 },
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
      filterOperators: filterOperatorsForDateField,
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
      filterable: false,
      sortable: false,
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
      filterOperators: filterOperatorsForDateField,
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
        onFilterModelChange={handleChangeFilterModel}
        archiveState={
          isArchiveInterviewModuleAllowed
            ? [
                archive,
                (s) => {
                  setArchive(s);
                  setGridData(undefined);
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
          <InterviewForm
            archive={archive}
            teamsList={teamState.data || []}
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
        )}
      </CustomDrawer>
    </>
  );
}
