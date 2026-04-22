import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Sync } from '@mui/icons-material';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getRequirementLogs } from '../../services/requirementApi';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementLogs from './RequirementLogs';
interface iProps {
  /** Fallback: exact doc-id filter — used for child / legacy records. */
  requirementObjectId?: string;
  /**
   * When present, the server rolls up logs for the parent doc + every
   * child assignment beneath it so the parent drawer shows one unified
   * history. Takes precedence over `requirementObjectId`.
   */
  parentReqID?: string;
}
const RequirementLogTable = ({
  requirementObjectId,
  parentReqID,
}: iProps) => {
  const {
    data: rows,
    error,
    loading,
    loadData: reload,
    setData,
  } = useFetchData(async () => {
    const query = parentReqID
      ? `parentReqID=${encodeURIComponent(parentReqID)}`
      : `requirementRef=${requirementObjectId || ''}`;
    const { data } = await getRequirementLogs(query);
    return data.data || [];
  }, [parentReqID, requirementObjectId]);

  const [view, setView] = useState<boolean>(false);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          py: 10,
        }}
      >
        <CircularProgress size={25} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          p: 2,
        }}
      >
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
        <IconButton onClick={reload}>
          <Sync color="primary" />
        </IconButton>
      </Box>
    );
  }

  return (
    <>
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        m={2}
        gap={1}
      >
        <Typography variant="body2" color="text.secondary">
          View the full update history?
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          sx={{ p: '2px 5px', fontSize: 'x-small' }}
          onClick={() => setView(true)}
        >
          View logs
        </Button>
      </Box>

      <CustomDrawer
        open={view}
        onClose={() => setView(false)}
        title={`Logs`}
        closeOnOutSideClick
      >
        <>
          <RequirementLogs logs={rows || []} />
        </>
      </CustomDrawer>
    </>
  );
};

export default RequirementLogTable;
