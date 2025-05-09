import { Sync } from '@mui/icons-material';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useFetchData } from '../../hooks/fetchDataHook';
import RequirementsForm from '../../pages/Marketing/Requirements/RequirementsForm';
import { requirementsList } from '../../services/requirementApi';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementMeta from './RequirementMeta';
import { iUser } from '../../Interfaces/iUser';
import { usersList } from '../../services/authApi';
import { consultantsList } from '../../services/consultantApi';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';

interface iProps {
  reqID: string;
  open: boolean;
  title?: string | JSX.Element;
  subTitle?: string | JSX.Element;
  hideButtons?: boolean;
  onClose: () => void;
}
const RequirementDrawer = ({
  reqID,
  open,
  title,
  subTitle,
  hideButtons,
  onClose,
}: iProps) => {
  const {
    data: viewData,
    loading,
    error,
    loadData,
    setData,
  } = useFetchData(findReq, [reqID, open]);
  const [mode, setMode] = useState<FormMode>('view');

  const accountsState = useFetchData<iUser[]>(getAccountList, []);
  const { data: accounts } = accountsState;
  const consultantsState = useFetchData(getConsultantsList, []);
  const { data: consultants } = consultantsState;

  const [duplicateReqDrawer, setDuplicateReqDrawer] = useState<string>();
  const isViewDataDuplicate =
    Boolean(viewData?.isDuplicate) && Boolean(viewData?.duplicateWith?.trim());

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
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

  async function findReq() {
    if (!open) return;
    const { data } = await requirementsList(`reqID=${reqID}`);
    if (!data.data?.results?.length) return;
    return data.data?.results[0];
  }
  const ReqDrawerBody = () => {
    const iError =
      error ||
      (mode === 'edit' ? accountsState.error || consultantsState.error : '');

    function handleReload() {
      loadData();
      accountsState.loadData();
      consultantsState.loadData();
    }

    if (
      loading ||
      (mode === 'edit' && (accountsState.loading || consultantsState.loading))
    )
      return (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      );

    if (iError) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{iError}</Typography>
          <IconButton onClick={handleReload}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }
    if (!viewData) return;
    return (
      <RequirementsForm
        showLogs
        disableCopyRequirement
        disableCreateInterview
        disableDelete
        hideButtons={hideButtons}
        accounts={accounts || []}
        consultants={consultants || []}
        viewData={viewData}
        mode={mode}
        isEditing={mode !== 'view'}
        onEdit={handleEdit}
        onDrawerClose={() => setMode('view')}
        setResults={(cb) => {
          const [results] = cb([viewData]);
          setData(results);
        }}
      />
    );
  };

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={title || 'Requrement ID: ' + reqID}
      closeOnOutSideClick
      subTitle={
        subTitle || (
          <>
            {!!viewData && (
              <RequirementMeta
                requirement={viewData}
                onOpenDuplicateReq={() =>
                  setDuplicateReqDrawer(viewData.duplicateWith)
                }
              />
            )}
          </>
        )
      }
    >
      <ReqDrawerBody />
      {isViewDataDuplicate && (
        <RequirementDrawer
          reqID={viewData.duplicateWith}
          open={Boolean(duplicateReqDrawer)}
          onClose={() => setDuplicateReqDrawer(undefined)}
        />
      )}
    </CustomDrawer>
  );
};

export default RequirementDrawer;
