import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import CustomDataGrid, {
  iGridColumn,
} from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { useEffect, useState } from 'react';
import RequirementsForm from './RequirementsForm';
import {
  requirementCounts,
  requirementsList,
} from '../../../services/requirementApi';
import { reqirementStatusColors } from './requirementsValues';
import { archiveRequirementsList } from '../../../services/archivesApi';
import { usersList } from '../../../services/authApi';
import { GridCallbackDetails, GridFilterModel } from '@mui/x-data-grid';
import {
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import SyncIcon from '@mui/icons-material/Sync';
import { consultantsList } from '../../../services/consultantApi';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { iUser } from '../../../Interfaces/iUser';
import { Sync } from '@mui/icons-material';
import moment from 'moment';
import { dateFormate2 } from '../../../components/constants';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import RequirementMeta from '../../../components/requirement/RequirementMeta';
import { syncDataById } from '../../../utils/syncDataById';
import { useSearchParams } from 'react-router-dom';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import { separateByDates } from '../../../utils/dataGrid.util';

export default function Requirements() {
  const { isModuleAllowed, iUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [viewData, setViewData] = useState<any>({});
  const [reqToCopy, setReqToCopy] = useState<any>();
  const [mode, setMode] = useState<FormMode>('view');
  const [duplicateReqDrawer, setDuplicateReqDrawer] = useState<string>();
  const [archive, setArchive] = useState(false);
  const accountsState = useFetchData<iUser[]>(getAccountList, []);
  const { data: accounts } = accountsState;
  const consultantsState = useFetchData(getConsultantsList, []);
  const { data: consultants } = consultantsState;
  const formStateLoading = accountsState.loading || consultantsState.loading;
  const formStateError = accountsState.error || consultantsState.error;
  const isArchiveRequirementModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Requirements)
  );

  const columns: readonly iGridColumn[] = [
    {
      field: 'view',
      headerName: 'View',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.dateSeparator) {
          const { count, fromDate } = params.row;
          return (
            <Box display={'flex'} alignItems={'center'} height={'25px'}>
              <Typography
                sx={{
                  textAlign: 'center',
                  fontSize: 'small',
                  fontWeight: 'bold',
                }}
              >
                {moment(fromDate).format(dateFormate2)} - {count <= 9 && '0'}
                {count}
              </Typography>
            </Box>
          );
        }

        return (
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ borderRadius: '10px' }}
            onClick={() => handleViewDetails(params.row)}
          >
            View
          </Button>
        );
      },
      filterable: false,
      sortable: false,
    },
    { field: 'reqID', headerName: 'ID', width: 180 },
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
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (val: string) => {
        return val ? moment(val).format(dateFormate2) : '';
      },
      filterOperators: filterOperatorsForDateField,
    },
  ];
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
      queryFunction: archive ? getArchiveRequirements : getRequirements,
      queryParams: searchParams.toString(),
    },
    [archive]
  );

  useEffect(() => {
    reload();
  }, [searchParams]);

  async function getRequirements(query?: string, signal?: AbortSignal) {
    const res = await requirementsList(query, signal);
    let result = separateByDates(res.data.data?.results || []);
    const formate = (d: string) => moment(d).format('YYYY-MM-DD');
    const dates = result
      .filter((r) => !!r.dateSeparator)
      .map((d) => d.fromDate)
      .map((d) => formate(d));

    const counts = await requirementCounts(dates, signal);

    result = result.map((r) => {
      if (r.dateSeparator) {
        const countObj = counts.data?.find(
          (c) => c.date === formate(r.fromDate)
        );
        return {
          ...r,
          count: countObj ? countObj.count : 0,
        };
      }
      return r;
    });
    if (res.data.data) {
      res.data.data.results = result;
    }

    setArchive(false);
    return res;
  }

  async function getArchiveRequirements(query?: string, signal?: AbortSignal) {
    const res = await archiveRequirementsList(query, signal);
    setArchive(true);
    return res;
  }

  const onChangeArchiveButton = (status: boolean) => {
    setArchive(status);
    setGridData(undefined);
  };

  const handleViewDetails = (row: any) => {
    const data = gridData?.results?.find((r: any) => r.reqID === row.reqID);
    if (!data) return;
    setViewData(data);
    setFormTitle(`Requirement ID: ${row.reqID}`);
    setMode('view');
    setDrawerOpen(true);
    !archive &&
      syncDataById(data, {
        queryFunction: requirementsList,
        setViewData,
        setResults,
      });
  };

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };

  const handleAddNew = () => {
    setFormTitle('Add New Requirement');
    setViewData({});
    setMode('add');
    setDrawerOpen(true);
  };

  const handleCopy = () => {
    if (!viewData) return;
    setMode('add');
    setFormTitle('Add New Requirement');

    const copy = {
      ...viewData,
      reqEnteredBy: `${iUser?.firstName} ${iUser?.lastName}`,
      reqEnteredByRef: `${iUser?.id}`,
      isDuplicate: true,
      duplicateWith: viewData.reqID,
      rate: '',
      taxType: '',
      remote: '',
      duration: '',
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    setReqToCopy({ ...copy });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setReqToCopy(undefined);
    setDuplicateReqDrawer(undefined);
    setViewData({});
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

  const handleChangeFilterModel = (
    model: GridFilterModel,
    _: GridCallbackDetails<'filter'>
  ) => {
    const iModel =
      model.items[0]?.value || model.quickFilterValues?.length
        ? model
        : initialSearchModel;
    setSearchModel(iModel);
  };

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

  const MyForm = (
    <>
      {formStateLoading ? (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      ) : formStateError ? (
        <Box textAlign={'center'}>
          <Typography color="error">{formStateError}</Typography>
          <IconButton
            onClick={() => {
              accountsState.loadData();
              consultantsState.loadData();
            }}
          >
            <Sync color="primary" />
          </IconButton>
        </Box>
      ) : (
        <RequirementsForm
          showLogs
          setResults={setResults}
          hideButtons={archive}
          accounts={accounts || []}
          consultants={consultants || []}
          viewData={viewData}
          mode={mode}
          onDrawerClose={handleDrawerClose}
          isEditing={mode !== 'view'}
          onEdit={handleEdit}
          onCopy={handleCopy}
          reqToCopy={reqToCopy}
        />
      )}
    </>
  );

  return (
    <>
      <CustomDataGrid
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={handleChangeFilterModel}
        archiveState={
          isArchiveRequirementModuleAllowed
            ? [archive, onChangeArchiveButton]
            : undefined
        }
        error={error}
        retry={reload}
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
          <RequirementMeta
            hideInterviews={mode !== 'view'}
            requirement={viewData}
            archive={archive}
            onOpenDuplicateReq={() =>
              setDuplicateReqDrawer(viewData.duplicateWith)
            }
          />
        }
      >
        {MyForm}
      </CustomDrawer>

      {viewData?.duplicateWith && (
        <RequirementDrawer
          archive={archive}
          open={Boolean(duplicateReqDrawer)}
          reqID={viewData.duplicateWith}
          onClose={() => setDuplicateReqDrawer(undefined)}
        />
      )}
    </>
  );
}

export type FormMode = 'view' | 'edit' | 'add';
