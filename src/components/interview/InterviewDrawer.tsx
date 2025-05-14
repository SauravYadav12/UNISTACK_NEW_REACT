import React, { useState } from 'react';
import CustomDrawer from '../drawer/CustomDrawer';
import InterviewForm from '../../pages/Marketing/Interviews/InterviewForm';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { SetResults } from '../../hooks/paginationHook';
import TestAndVendorForm from '../../pages/Marketing/TestAndVendorInterviews/TestAndVendorForm';
import { useFetchData } from '../../hooks/fetchDataHook';
import { teamsList } from '../../services/teamsApi';
import { Sync } from '@mui/icons-material';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
interface iProps {
  open: boolean;
  interview?: any;
  archive?: boolean;
  onClose: () => void;
  setData: SetResults;
}
const InterviewDrawer = ({
  interview,
  open,
  archive,
  setData,
  onClose,
}: iProps) => {
  const [mode, setMode] = useState<FormMode>('view');

  const teamState = useFetchData(async () => {
    const { data } = await teamsList(`limit=5000`);
    return data.data?.results || [];
  });

  const formStateLoading = teamState.loading;
  const formStateError = teamState.error;

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };
  return (
    <>
      <CustomDrawer
        title={
          (interview?.testID ? 'Vendor interview' : 'Interview') +
          ' : ' +
          (interview?.intId || interview?.testID)
        }
        open={open}
        onClose={onClose}
        closeOnOutSideClick
      >
        <>
          {formStateLoading ? (
            <Box
              className="loader"
              sx={{ py: 10, height: '300px', pr: 0, m: 0 }}
            >
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
            <>
              {interview?.intId && (
                <InterviewForm
                  archive={archive}
                  teamsList={teamState.data || []}
                  disableDelete
                  hideButtons={archive}
                  viewData={interview}
                  mode={mode}
                  isEditing={mode !== 'view'}
                  onDrawerClose={() => setMode('view')}
                  onEdit={handleEdit}
                  setResults={setData}
                />
              )}
              {interview?.testID && (
                <TestAndVendorForm
                  teamsList={teamState.data || []}
                  hideButtons={archive}
                  disableDelete
                  viewData={interview}
                  mode={mode}
                  isEditing={mode !== 'view'}
                  onDrawerClose={() => setMode('view')}
                  onEdit={handleEdit}
                  setResults={setData}
                />
              )}
            </>
          )}
        </>
      </CustomDrawer>
    </>
  );
};

export default InterviewDrawer;
