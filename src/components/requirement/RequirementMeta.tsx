import {
  Stack,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useFetchData } from '../../hooks/fetchDataHook';
import { interviewsList } from '../../services/interviewApi';
import { Sync } from '@mui/icons-material';
import InterviewDrawer from '../interview/InterviewDrawer';

interface iProps {
  requirement: any;
  hideInterviews?: boolean;
  onOpenDuplicateReq: () => void;
}
const RequirementMeta = ({
  requirement,
  hideInterviews,
  onOpenDuplicateReq,
}: iProps) => {
  const {
    data: createdInterviews,
    loading,
    error,
    loadData,
  } = useFetchData<any[]>(findCreatedInterviews, [requirement]);
  const [intDrawer, setIntDrawer] = useState<any>();
  const isDuplicate =
    Boolean(requirement.isDuplicate) &&
    Boolean(requirement.duplicateWith?.trim());

  async function findCreatedInterviews() {
    const { data } = await interviewsList(`reqID=${requirement.reqID}`);
    return data.data?.results || [];
  }

  function MyInterviews() {
    if (loading) {
      return <CircularProgress size={15} />;
    }
    if (error) {
      return (
        <Stack
          direction={'row'}
          gap={2}
          textAlign={'center'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography color="error">{error}</Typography>
          <IconButton size="small" onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Stack>
      );
    }

    if (!createdInterviews?.length)
      return (
        <Typography variant="body1" color="textSecondary">
          NA
        </Typography>
      );

    return createdInterviews.map((int, i) => {
      return (
        <Button
          key={i}
          size="small"
          variant="contained"
          color="primary"
          sx={{
            py: 0,
            minWidth: 'fit-content',
            height: '20px',
          }}
          onClick={() => setIntDrawer(int)}
        >
          {int.intId}
        </Button>
      );
    });
  }

  return (
    <>
      <Stack gap={'4px'}>
        {isDuplicate && (
          <Stack
            direction={'row'}
            alignItems={'center'}
            flexWrap={'wrap'}
            gap={1}
          >
            <Typography
              variant="body1"
              color="textSecondary"
              fontWeight={600}
              fontSize={'18px'}
              minWidth={'175px'}
            >
              Copied from :
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="primary"
              sx={{
                py: 0,
                minWidth: 'fit-content',
                height: '20px',
              }}
              onClick={onOpenDuplicateReq}
            >
              {requirement.duplicateWith}
            </Button>
          </Stack>
        )}
        {!hideInterviews && (
          <Stack
            direction={'row'}
            alignItems={'center'}
            flexWrap={'wrap'}
            gap={1}
          >
            <Typography
              variant="body1"
              color="textSecondary"
              fontWeight={600}
              fontSize={'18px'}
              minWidth={'175px'}
            >
              Created Interview{(createdInterviews?.length || 0) > 1 ? 's' : ''}{' '}
              :
            </Typography>
            <MyInterviews />
          </Stack>
        )}
      </Stack>

      <InterviewDrawer
        open={Boolean(intDrawer)}
        onClose={() => setIntDrawer(undefined)}
        interview={intDrawer}
      />
    </>
  );
};

export default RequirementMeta;
