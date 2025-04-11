import { Sync } from '@mui/icons-material';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useFetchData } from '../../hooks/fetchDataHook';
import RequirementsForm from '../../pages/Marketing/Requirements/RequirementsForm';
import { requirementsList } from '../../services/requirementApi';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementMeta from './RequirementMeta';

interface iProps {
  reqID: string;
  open: boolean;
  onClose: () => void;
}
const RequirementDrawer = ({ reqID, open, onClose }: iProps) => {
  const {
    data: viewData,
    loading,
    error,
    loadData,
  } = useFetchData(findReq, [reqID, open]);

  const [duplicateReqDrawer, setDuplicateReqDrawer] = useState<string>();
  const isViewDataDuplicate =
    Boolean(viewData?.isDuplicate) && Boolean(viewData?.duplicateWith?.trim());

  async function findReq() {
    if (!open) return;
    const { data } = await requirementsList(`reqID=${reqID}`);
    if (!data.data?.results?.length) return;
    return data.data?.results[0];
  }
  const ReqDrawerBody = () => {
    if (loading)
      return (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      );

    if (error) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }
    if (!viewData) return;
    return <RequirementsForm hideButtons viewData={viewData} />;
  };

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={'Requrement ID: ' + reqID}
      closeOnOutSideClick
      subTitle={
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
