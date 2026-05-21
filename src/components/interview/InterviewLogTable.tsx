import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Sync } from '@mui/icons-material';
import { useFetchData } from '../../hooks/fetchDataHook';
import { getInterviewLogs } from '../../services/interviewApi';
import CustomDrawer from '../drawer/CustomDrawer';
import InterviewLogs from './InterviewLogs';

/**
 * Mirror of `RequirementLogTable` for interview activity. Supports two
 * query modes:
 *   - `interviewObjectId` → logs for a single interview doc (used inside
 *     the InterviewDrawer / InterviewForm view mode).
 *   - `reqID` → aggregate logs across every interview attached to a parent
 *     requirement + its child assignments (used from the requirement
 *     drawer when we want a unified per-parent interview-history view).
 */
interface iProps {
  interviewObjectId?: string;
  reqID?: string;
}

const InterviewLogTable = ({ interviewObjectId, reqID }: iProps) => {
  const {
    data: rows,
    error,
    loading,
    loadData: reload,
  } = useFetchData(async () => {
    const query = reqID
      ? `reqID=${encodeURIComponent(reqID)}`
      : `interviewRef=${interviewObjectId || ''}`;
    const { data } = await getInterviewLogs(query);
    return data.data || [];
  }, [reqID, interviewObjectId]);

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
          <InterviewLogs logs={rows || []} />
        </>
      </CustomDrawer>
    </>
  );
};

export default InterviewLogTable;
