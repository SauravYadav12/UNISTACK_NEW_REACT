import {
  Stack,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useFetchData } from '../../hooks/fetchDataHook';
import {
  interviewsList,
  interviewsByParent,
} from '../../services/interviewApi';
import { Sync } from '@mui/icons-material';
import InterviewDrawer from '../interview/InterviewDrawer';
import RequirementDrawer from './RequirementDrawer';
import { archiveInterviewsList } from '../../services/archivesApi';
import { IInterview, IRequirement } from '../../Interfaces/types';

interface iProps {
  requirement?: IRequirement;
  hideInterviews?: boolean;
  archive?: boolean;
  onOpenDuplicateReq: () => void;
}
const RequirementMeta = ({
  requirement,
  hideInterviews,
  archive,
  onOpenDuplicateReq,
}: iProps) => {
  const {
    data: createdInterviews,
    loading,
    error,
    loadData,
    setData,
  } = useFetchData<IInterview[]>(findCreatedInterviews, [requirement]);
  const [intDrawer, setIntDrawer] = useState<IInterview>();
  const [parentDrawerOpen, setParentDrawerOpen] = useState(false);

  const isDuplicate =
    Boolean(requirement?.isDuplicate) &&
    Boolean(requirement?.duplicateWith?.trim());

  const hideMyInterviews =
    hideInterviews ||
    (!createdInterviews?.length &&
      ['New Working', 'Cancelled'].includes(requirement?.reqStatus||''));

  async function findCreatedInterviews() {
    if (!requirement?.reqID) return [] as IInterview[];

    // Archives go through the legacy exact-match path; children's archived
    // interviews are queried separately by the ops pipeline.
    if (archive) {
      const int = await archiveInterviewsList(`reqID=${requirement.reqID}`);
      return (int.data.data?.results || []) as IInterview[];
    }

    // Child record → just its own interviews. For a parent OR a legacy
    // standalone, call by-parent which returns both the row's own interviews
    // AND any children's interviews in one shot.
    if (requirement.parentReqID) {
      const int = await interviewsList(`reqID=${requirement.reqID}`);
      return (int.data.data?.results || []) as IInterview[];
    }

    const { data } = await interviewsByParent(requirement.reqID);
    return (data.data?.results || []) as IInterview[];
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

    if (!createdInterviews?.length) return null;

    const renderButton = (int: IInterview) => (
      <Button
        key={int._id || int.intId}
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

    // Group by marketer when more than one is involved so the parent drawer
    // shows each marketer's pipeline separately. Child records / legacy
    // standalones naturally collapse to a single marketer → render flat.
    const groups = new Map<string, IInterview[]>();
    for (const int of createdInterviews) {
      const key = int.marketingPerson || 'Unassigned';
      const arr = groups.get(key) || [];
      arr.push(int);
      groups.set(key, arr);
    }

    if (groups.size <= 1) {
      return <>{createdInterviews.map(renderButton)}</>;
    }

    return (
      <Stack gap={0.5} sx={{ width: '100%' }}>
        {[...groups.entries()].map(([marketer, ints]) => (
          <Stack
            key={marketer}
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.68rem',
                minWidth: '120px',
              }}
            >
              {marketer}
            </Typography>
            {ints.map(renderButton)}
          </Stack>
        ))}
      </Stack>
    );
  }

  return (
    <>
      <Stack gap={'4px'}>
        {requirement?.parentReqID && (
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
              Parent :
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
              onClick={() => setParentDrawerOpen(true)}
            >
              {requirement.parentReqID}
            </Button>
          </Stack>
        )}
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
              {requirement?.duplicateWith}
            </Button>
          </Stack>
        )}
        {!hideMyInterviews && (
          <Stack
            direction={'row'}
            alignItems={'center'}
            flexWrap={'wrap'}
            gap={1}
            minHeight={'25px'}
          >
            {!!createdInterviews?.length && (
              <Typography
                variant="body1"
                color="textSecondary"
                fontWeight={600}
                fontSize={'18px'}
                minWidth={'175px'}
              >
                <>Created Interview{createdInterviews.length > 1 && 's'}:</>
              </Typography>
            )}
            <MyInterviews />
          </Stack>
        )}
      </Stack>

      <InterviewDrawer
        archive={archive}
        open={Boolean(intDrawer)}
        onClose={() => setIntDrawer(undefined)}
        interview={intDrawer}
        setData={(cb) => {
          const results = typeof cb === 'function' ? cb(createdInterviews || []) as IInterview[] : cb;
          setData(results);
          const int = results?.find((i) => i._id === intDrawer?._id);
          setIntDrawer(int);
        }}
      />

      {requirement?.parentReqID && (
        <RequirementDrawer
          archive={archive}
          reqID={requirement.parentReqID}
          open={parentDrawerOpen}
          onClose={() => setParentDrawerOpen(false)}
        />
      )}
    </>
  );
};

export default RequirementMeta;

