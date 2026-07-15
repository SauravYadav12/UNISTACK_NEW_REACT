import { Sync } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { IconCopy } from '@tabler/icons-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useFetchData } from '../../hooks/fetchDataHook';
import RequirementsForm from '../../pages/Marketing/Requirements/RequirementsForm';
import { requirementsList } from '../../services/requirementApi';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementMeta from './RequirementMeta';
import { iUser } from '../../Interfaces/iUser';
import { IRequirement } from '../../Interfaces/types';
import { usersList } from '../../services/authApi';
import { consultantsList } from '../../services/consultantApi';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { archiveRequirementsList } from '../../services/archivesApi';

interface iProps {
  reqID: string;
  open: boolean;
  title?: string | JSX.Element;
  subTitle?: string | JSX.Element;
  hideButtons?: boolean;
  archive?: boolean;
  onClose: () => void;
  /**
   * Called after a successful save inside this drawer. Lets the caller
   * keep their list / grid / children-cache in sync so the edit shows up
   * live (not just on next page reload). The drawer still updates its
   * own local `viewData` regardless — this just lifts the change up.
   */
  onPatch?: (updated: IRequirement) => void;
}
const RequirementDrawer = ({
  reqID,
  open,
  title,
  subTitle,
  hideButtons,
  archive,
  onClose,
  onPatch,
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
    const { data } = await (archive
      ? archiveRequirementsList
      : requirementsList)(`reqID=${reqID}`);
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
    // Guard rail — if the fetch finished cleanly but returned no row (e.g. a
    // server filter silently dropped the document, as happened when the
    // parent-hiding branch clobbered "Edit on parent" lookups), render a
    // clear empty state with a reload button instead of a silent blank body.
    if (!viewData) {
      return (
        <Box textAlign={'center'} sx={{ py: 6 }}>
          <Typography color="text.secondary">
            Requirement {reqID} couldn&apos;t be loaded.
          </Typography>
          <IconButton onClick={handleReload}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }
    return (
      <RequirementsForm
        showLogs
        disableCopyRequirement
        disableDelete
        // Create-interview stays enabled — marketers opening their own
        // child via "View record" on MarketerAssignmentCard need the same
        // Submitted-status shortcut that's available in the main grid
        // drawer. The button opens InterviewForm inline so the marketer
        // never leaves their current context.
        hideButtons={hideButtons}
        accounts={accounts || []}
        consultants={consultants || []}
        viewData={viewData}
        mode={mode}
        isEditing={mode !== 'view'}
        onEdit={handleEdit}
        onDrawerClose={() => setMode('view')}
        setResults={(cb) => {
          const results = typeof cb === 'function' ? cb([viewData]) : cb;
          setData(results);
          // Lift the saved row up so the caller (the page's grid /
          // childrenMap) can patch in place. Without this, an "Applied
          // For" edit made inside the focused-child drawer would update
          // the drawer's local view but the parent's expanded children
          // list would stay stale until the user refreshed.
          const updated = Array.isArray(results) ? results[0] : undefined;
          if (updated && onPatch) onPatch(updated as IRequirement);
        }}
      />
    );
  };

  // Shareable URL that reopens this drawer for anyone with access —
  // reuses the existing `?openReqID=` deep-link mechanism honoured by
  // Requirements.tsx. `pathname` (not `href`) so we drop any pre-existing
  // query params on the current URL.
  const isParent = !viewData?.parentReqID;
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?openReqID=${encodeURIComponent(reqID)}`
      : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Requirement URL copied to clipboard');
    } catch {
      toast.error('Could not copy — clipboard blocked by the browser');
    }
  };

  const defaultTitle = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography component="span" sx={{ fontWeight: 800 }}>
        Requirement ID: {reqID}
      </Typography>
      {isParent && (
        <Tooltip title="Copy shareable URL" arrow>
          <IconButton
            size="small"
            onClick={handleCopyUrl}
            sx={{ ml: 0.25 }}
            aria-label="Copy requirement URL"
          >
            <IconCopy size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={title || defaultTitle}
      closeOnOutSideClick
      subTitle={
        subTitle || (
          <>
            {!!viewData && (
              <RequirementMeta
                archive={archive}
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
