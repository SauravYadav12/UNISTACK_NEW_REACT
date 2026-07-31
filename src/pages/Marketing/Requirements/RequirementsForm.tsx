import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { toast } from 'react-toastify';
import { AttachFile, Sync } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import {
  IconCopy,
  IconEdit,
  IconFileText,
  IconSparkles,
  IconTrash,
  IconUsersPlus,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
} from '@tabler/icons-react';

import CustomTextField from '../../../components/text_field/CustomTextField';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { SelectedFile } from '../../../components/profile/formFields/DocumentsField';
import RequirementLogTable from '../../../components/requirement/RequirementLogTable';
import AssignRequirementDrawer, {
  MutateInfo as AssignMutateInfo,
} from '../../../components/requirement/AssignRequirementDrawer';
import MarketerAssignmentCard from '../../../components/requirement/MarketerAssignmentCard';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import RequirementAiSuggestions from '../../../components/requirement/RequirementAiSuggestions';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import InterviewForm from '../Interviews/InterviewForm';
import { teamsList as fetchTeamsList } from '../../../services/teamsApi';
import { ITeam } from '../../../Interfaces/types';
import { dateFormate } from '../../../components/constants';

import {
  createRequirement,
  createRequirementLog,
  deleteRequirement,
  listChildAssignments,
  propagateRequirementToChildren,
  updateRequirement,
} from '../../../services/requirementApi';
import PropagateToChildrenDialog from '../../../components/requirement/PropagateToChildrenDialog';
import { uploadFile } from '../../../services/storageApi';

import {
  duration,
  gotRequirementForm,
  PARENT_OWNED_FIELD_SET,
  SHARED_EDITABLE_FIELD_SET,
  reqFields,
  reqStatusOptions,
  requirementFormInitialValues,
  requirementValidationMeta,
  splitDirtyByOwnership,
  taxTypeOptions,
  techStack,
} from './requirementsValues';

import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { SetResults } from '../../../hooks/paginationHook';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';

import {
  convertValuesToEmptyString,
} from '../../../utils/utils';
import {
  isFieldValid,
  urlValidator,
  validateAllFields,
} from '../../../utils/validators';
import { getChangedFields } from '../../../utils/formUtil';

import {
  CreateRequirementLogPayload,
  LogOperation,
} from '../../../Interfaces/requirement';
import { iUser, UserRole } from '../../../Interfaces/iUser';
import { IConsultant, IRequirement } from '../../../Interfaces/types';

import { FormMode } from './Requirements';
import { tokens } from '../../../theme/theme';

// ── Employement type options (legacy let this be a free string, keep options light) ──
const employementTypeOptions = ['Full-Time', 'Contract', 'Part-Time', 'C2H'];

// ── Section card helper (mirrors InterviewForm's visual language) ──
function SectionCard({
  number,
  title,
  right,
  children,
  defaultOpen = true,
  collapsible = false,
  summary,
  forceSummary = false,
}: {
  number: number;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  summary?: React.ReactNode;
  /**
   * When true, always render `summary` instead of the form body — used in
   * view mode for the middle sections so they read as compact cards, then
   * switch back to full form when the user enters edit/add mode.
   * Suppresses the chevron toggle since the body is unreachable.
   */
  forceSummary?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showBody = !forceSummary && open;
  const showSummary = forceSummary || (collapsible && !open && !!summary);
  const showChevron = collapsible && !forceSummary;
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: '#F6F9FC',
          borderBottom: showBody ? '1px solid' : 'none',
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Chip
          label={number}
          size="small"
          sx={{
            bgcolor: '#032840',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 24,
            minWidth: 24,
          }}
        />
        <Typography variant="body1" fontWeight={600} color="#2A3547">
          {title}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {right}
        {showChevron && (
          <IconButton
            size="small"
            onClick={() => setOpen((o) => !o)}
            sx={{ color: '#5A6A85' }}
          >
            {open ? (
              <IconChevronDown size={18} />
            ) : (
              <IconChevronRight size={18} />
            )}
          </IconButton>
        )}
      </Box>
      {showSummary && summary && (
        <Box sx={{ px: 2.5, py: 1.5 }}>{summary}</Box>
      )}
      {showBody && (
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {children}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

interface Props {
  viewData?: IRequirement;
  reqToCopy?: Partial<IRequirement>;
  accounts?: iUser[];
  consultants?: IConsultant[];
  mode?: FormMode;
  hideButtons?: boolean;
  /** Used by a few callers (RequirementDrawer, extended drawers). */
  hideFooter?: boolean;
  /** Existing external callers. Keep these for backwards compat. */
  disableCreateInterview?: boolean;
  disableCopyRequirement?: boolean;
  disableDelete?: boolean;
  isEditing?: boolean;
  showLogs?: boolean;
  onEdit?: (editMode: boolean) => void;
  onCopy?: () => void;
  onDrawerClose?: () => void;
  setResults?: SetResults;
  /** Open a focused drawer for a specific child reqID (from a MarketerAssignmentCard's "View record"). */
  onOpenChild?: (reqID: string) => void;
  /**
   * Page-level callback invoked when the form's inline AssignRequirementDrawer
   * finishes a save / removal. Lets the page update its `childrenMap`,
   * auto-expand the parent, bump the snapshot, and (for self-assign) open
   * the new child drawer — without RequirementsForm having to know about
   * the page's state.
   */
  onAssignMutated?: (info: AssignMutateInfo) => void;
}

export default function RequirementsForm(props: Props) {
  const {
    viewData,
    reqToCopy,
    accounts,
    consultants,
    mode = 'view',
    hideButtons = false,
    hideFooter = false,
    disableCopyRequirement,
    disableCreateInterview,
    disableDelete,
    isEditing = false,
    showLogs = false,
    onEdit,
    onCopy: handleCopyRequirement,
    onDrawerClose,
    setResults,
    onOpenChild,
    onAssignMutated,
  } = props;

  const user = useAuth().iUser!;
  const userRoles = user?.role || [];
  const isParentEditor =
    userRoles.includes(UserRole['super-admin']) ||
    userRoles.includes(UserRole.admin) ||
    userRoles.includes(UserRole.support);
  const isSuperAdmin = userRoles.includes(UserRole['super-admin']);

  const [values, setValues] = useState<Partial<IRequirement>>(
    requirementFormInitialValues
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>(
    convertValuesToEmptyString(requirementFormInitialValues)
  );
  const [file, setFile] = useState<File>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [copyAlert, setCopyAlert] = useState(false);

  // Children (parent view) state
  const [children, setChildren] = useState<IRequirement[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pendingComments, setPendingComments] = useState<Record<string, string>>({});
  const [postingCommentFor, setPostingCommentFor] = useState<string | null>(null);
  const [removingChildId, setRemovingChildId] = useState<string | null>(null);
  const [parentDrawerOpen, setParentDrawerOpen] = useState(false);

  // Inline "Create Interview" drawer — opens the InterviewForm right from
  // the requirement context with the current viewData already seeded, so
  // the marketer/support operator never leaves the requirement they're
  // looking at. No SearchRequirement popup is needed because the context
  // is already known.
  const [createInterviewOpen, setCreateInterviewOpen] = useState(false);
  const [teamsForInterview, setTeamsForInterview] = useState<ITeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Propagate-to-children flow. After a parent update succeeds AND
  // the parent has children AND the diff carried at least one
  // parent-owned field, we open the two-step popup: confirm → select.
  // See PropagateToChildrenDialog.
  const [propagateOpen, setPropagateOpen] = useState(false);
  const [propagateChanges, setPropagateChanges] = useState<
    Record<string, unknown>
  >({});

  const currentFile =
    file ||
    (values?.resumeUpload && urlValidator(values.resumeUpload)
      ? values.resumeUpload
      : '');

  const fileCardButtonDisabled = mode === 'view' || isSubmitting;

  const isChildRecord = !!viewData?.parentReqID;
  const hasChildren = children.length > 0;
  const isParentWithChildren = !isChildRecord && hasChildren;
  const archive = hideButtons; // convention: when the page locks editing, archive is implied

  useHardKeySubmit(
    {
      onSubmit: (e) => {
        if (mode === 'add') handleSubmitForm(e);
        if (mode === 'edit') handleEditSubmitForm(e);
      },
    },
    [values, file, errors, reqToCopy, isEditing, hideButtons, mode, viewData, comment, accounts, consultants]
  );

  // ── Load children when viewing a parent ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!viewData?.reqID || viewData.parentReqID) {
        setChildren([]);
        return;
      }
      if (mode === 'add') {
        setChildren([]);
        return;
      }
      setLoadingChildren(true);
      try {
        const res = await listChildAssignments(viewData.reqID);
        if (cancelled) return;
        setChildren((res.data.data?.results as IRequirement[]) || []);
      } catch (e) {
        console.warn('Failed to load child assignments', e);
        if (!cancelled) setChildren([]);
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [viewData?.reqID, viewData?.parentReqID, mode]);

  // ── Sync values with mode / viewData ──
  useEffect(() => {
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData || {});
    } else if (mode === 'add') {
      setValues((pre) => ({
        ...pre,
        reqEnteredBy: `${user?.firstName} ${user?.lastName}`,
        reqEnteredByRef: `${user?.id}`,
      }));
    }
    setFile(undefined);
    setComment('');
    setErrors(convertValuesToEmptyString(requirementFormInitialValues));
  }, [mode, viewData]);

  useEffect(() => {
    if (!reqToCopy) return;
    setValues({ ...reqToCopy });
    setErrors(convertValuesToEmptyString(requirementFormInitialValues));
  }, [reqToCopy]);

  // ── File handling ──
  function handleFileChange(e?: React.ChangeEvent<HTMLInputElement>) {
    e?.preventDefault();
    if (!e?.target.files?.length) return;
    const maxSize = 5 * 1024 * 1024;
    const chosen = e.target.files[0];
    if (chosen.size > maxSize) {
      setFile(undefined);
      setErrors((pre) => ({
        ...pre,
        resumeUpload: `File size should be less than ${(
          maxSize /
          (1024 * 1024)
        ).toFixed(2)} MB`,
      }));
      return;
    }
    setFile(chosen);
    setErrors((pre) => ({ ...pre, resumeUpload: '' }));
  }

  async function handleFileUpload(f: File) {
    try {
      const { data } = await uploadFile(f);
      setValues((pre) => ({ ...pre, resumeUpload: data.data.url }));
      setFile(undefined);
      setErrors((pre) => ({ ...pre, resumeUpload: '' }));
      return data.data.url;
    } catch (error) {
      console.log(error);
      toast.error('Failed to upload');
    }
  }

  const removeFile = () => {
    setFile(undefined);
    setValues((pre) => ({ ...pre, resumeUpload: '' }));
  };

  async function createLog(
    id: string,
    data: Record<string, unknown>,
    operation: LogOperation
  ) {
    if (!id) {
      console.error({ data }, 'create log payload is not valid data');
      return;
    }
    try {
      const logPayload: CreateRequirementLogPayload = {
        requirementRef: id,
        userName: user.firstName + ' ' + user.lastName,
        userRef: user._id,
        oldData: values,
        newData: data,
        operation,
      };
      await createRequirementLog(logPayload);
    } catch (error) {
      console.log('Failed to create log ', error);
    }
  }

  // ── Submit (Add mode) ──
  async function handleSubmitForm(event: React.FormEvent | KeyboardEvent | React.MouseEvent) {
    event.preventDefault?.();
    if (isSubmitting) return;
    if (!validateAllFields(requirementValidationMeta, values, setErrors)) return;

    const payload: Partial<IRequirement> = { ...values };
    delete payload.mComment;

    if (comment.trim().length) {
      payload.mComment = [
        {
          username: `${user.firstName} ${user.lastName}`,
          date: new Date(),
          comment: comment.trim(),
        },
      ];
    }

    setIsSubmitting(true);
    try {
      if (file) {
        const url = await handleFileUpload(file);
        if (url) payload.resumeUpload = url;
      }
      const { data } = await createRequirement(payload as Record<string, unknown>);
      setResults?.((pre) => [data.data, ...(pre || [])]);
      createLog(data.data._id, payload, 'create');
      onDrawerClose?.();
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Submit (Edit mode) — ownership-split aware ──
  async function handleEditSubmitForm(event: React.FormEvent | KeyboardEvent | React.MouseEvent) {
    event.preventDefault?.();
    if (isSubmitting) return;
    if (!values._id) {
      toast.error('Missing requirement id');
      return;
    }
    if (!validateAllFields(requirementValidationMeta, values, setErrors)) return;

    let payload: Partial<IRequirement> = { ...values };
    delete payload.mComment;
    payload = getChangedFields(viewData || {}, payload, reqFields);

    // Ownership split. Three buckets:
    //   - parent  → fields that only live on the parent (jobTitle, jobDescription, …)
    //   - child   → fields that only live on the child (reqStatus, mComment, …)
    //   - shared  → fields editable on both records, applied to whichever
    //               doc the form is currently saving (client / prime / vendor info).
    // A child record gets `child + shared`; a parent-with-children gets
    // `parent + shared`. Standalone records save everything as-is.
    if (isChildRecord) {
      const { child, shared } = splitDirtyByOwnership(payload);
      payload = { ...child, ...shared };
    } else if (isParentWithChildren) {
      const { parent, shared } = splitDirtyByOwnership(payload);
      payload = { ...parent, ...shared };
    }

    if (comment.trim().length) {
      payload.mComment = [
        {
          username: `${user.firstName} ${user.lastName}`,
          date: new Date(),
          comment: comment.trim(),
        },
      ];
    }

    setIsSubmitting(true);
    try {
      if (file) {
        const url = await handleFileUpload(file);
        if (url) payload.resumeUpload = url;
      }
      const { data } = await updateRequirement(
        values._id,
        payload as Record<string, unknown>
      );
      setResults?.((pre) => {
        const next = (pre || []).map((d) =>
          d._id === data.data._id ? data.data : d
        );
        return [...next];
      });
      createLog(values._id, payload, 'update');

      // If this is a parent record with children AND the diff carried
      // any propagatable fields, prompt the user to push them onto
      // children. The dialog handles its own close + calls
      // onDrawerClose when done (skip / cancel / confirmed).
      //
      // "Propagatable" = parent-owned fields (jobTitle, jobDescription,
      // primaryTech, …) UNION shared-editable fields (clientCompany,
      // clientPerson, vendor / prime-vendor contacts, rate, duration,
      // remote, taxType, …). The server's propagation whitelist accepts
      // both — see PARENT_OWNED_FIELDS in requirementController.ts.
      // Child-only fields (reqStatus, marketer assignment, mComment,
      // per-child star colour) are excluded so per-child overrides
      // can never leak in.
      const propagatable: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (k === 'mComment' || k === '_id') continue;
        if (
          PARENT_OWNED_FIELD_SET.has(k as never) ||
          SHARED_EDITABLE_FIELD_SET.has(k as never)
        ) {
          propagatable[k] = v;
        }
      }
      if (isParentWithChildren && Object.keys(propagatable).length > 0) {
        setPropagateChanges(propagatable);
        setPropagateOpen(true);
      } else {
        onDrawerClose?.();
      }
    } catch (error) {
      console.log('An error occurred while updating:', error);
      toast.error('Failed to update the requirement');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Called by PropagateToChildrenDialog when the user picks
  // "all children" or a specific set. `selection` is either the
  // string 'all' or a list of child _ids.
  async function handlePropagateConfirm(selection: 'all' | string[]) {
    if (!values._id) return;
    try {
      const res = await propagateRequirementToChildren(values._id, {
        childIds: selection,
        changes: propagateChanges,
      });
      const count = res.data.data?.updatedCount ?? 0;
      if (count > 0) {
        toast.success(
          `Propagated to ${count} child record${count === 1 ? '' : 's'}.`
        );
      } else {
        toast.info('No children were updated.');
      }
    } catch (e) {
      console.error('propagate-to-children failed', e);
      toast.error('Could not propagate to children.');
    } finally {
      setPropagateOpen(false);
      onDrawerClose?.();
    }
  }

  async function handleDeleteRequirement() {
    if (!values._id) {
      toast.error('Missing requirement id');
      return;
    }
    try {
      await deleteRequirement(values._id);
      setResults?.((pre) =>
        [...(pre || [])].filter((p) => p._id !== values._id)
      );
      onDrawerClose?.();
    } catch (error) {
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  // ── Value helpers ──
  const addValue = (key: keyof IRequirement, newValue: unknown) => {
    const meta = requirementValidationMeta.find((m) => m.field === key);
    let v = newValue;
    if (meta) {
      if (errors[key] && isFieldValid(meta, v as never)) {
        setErrors((pre) => ({ ...pre, [key]: '' }));
      }
      if (meta.transform) {
        v = meta.transform(v as never);
      }
    }
    setValues((pre) => ({ ...pre, [key]: v }));
  };

  const onBlur = (key: keyof IRequirement) => {
    const meta = requirementValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key] as never, setErrors);
  };

  // For parent-with-children editing: disable parent-owned fields if we're
  // looking at a child; disable child-owned fields if we're looking at a
  // parent in view — except for shared-editable fields (client / prime
  // vendor / vendor info) which both parent and child can edit, with the
  // change persisting on whichever record was open. Legacy/standalone =
  // everything editable.
  const isParentOwned = (key: keyof IRequirement) =>
    PARENT_OWNED_FIELD_SET.has(key);
  const isSharedEditable = (key: keyof IRequirement) =>
    SHARED_EDITABLE_FIELD_SET.has(key);

  const fieldDisabled = (key: keyof IRequirement) => {
    if (!isEditing) return true;
    if (isSharedEditable(key)) return false; // both sides can edit; routing happens at save
    if (isChildRecord && isParentOwned(key)) return true; // child can't touch parent fields
    if (isParentWithChildren && !isParentOwned(key)) return true; // parent can't touch child-only fields
    return false;
  };

  async function handlecreateInterview() {
    try {
      if (!viewData?._id) return toast.error('Missing requirement id');

      // Open the inline InterviewForm drawer immediately for responsiveness.
      // The form needs a teams list for the "Team" Autocomplete; we fetch it
      // on first open and cache it on the component so re-opening is free.
      setCreateInterviewOpen(true);
      if (teamsForInterview.length === 0 && !teamsLoading) {
        setTeamsLoading(true);
        try {
          const { data } = await fetchTeamsList(`limit=5000`);
          setTeamsForInterview(data?.data?.results || []);
        } catch (err) {
          console.error('Failed to load teams for interview form', err);
          toast.error('Failed to load team list');
        } finally {
          setTeamsLoading(false);
        }
      }
    } catch (error) {
      toast.error('Failed to open interview form');
      console.error('An error occurred while opening the interview form:', error);
    }
  }

  // ── Per-child comment post ──
  async function postChildComment(child: IRequirement, text: string) {
    const trimmed = text.trim();
    if (!trimmed || !child._id) return;
    setPostingCommentFor(child._id);
    try {
      const commentPayload = {
        username: `${user.firstName} ${user.lastName}`,
        date: new Date(),
        comment: trimmed,
      };
      const { data } = await updateRequirement(child._id, {
        mComment: [commentPayload],
      });
      setChildren((prev) =>
        prev.map((c) => (c._id === data.data._id ? data.data : c))
      );
      setPendingComments((prev) => ({ ...prev, [child._id]: '' }));
      toast.success('Comment posted');
    } catch (e) {
      console.error('Failed to post child comment', e);
      toast.error('Failed to post comment');
    } finally {
      setPostingCommentFor(null);
    }
  }

  async function removeChild(child: IRequirement) {
    if (!child._id) return;
    setRemovingChildId(child._id);
    try {
      // Use dedicated unassign API wrapper via AssignRequirementDrawer's flow is
      // actually identical to calling deleteRequirement on the child. But we
      // want the server-side guard that blocks removal if interviews exist —
      // that lives on /assignments/:id. Call the API wrapper directly.
      const { unassignMarketer } = await import('../../../services/requirementApi');
      await unassignMarketer(child._id);
      setChildren((prev) => prev.filter((c) => c._id !== child._id));
      toast.success(`Removed ${child.reqID}`);
    } catch (e: any) {
      console.error('Failed to remove child assignment', e);
      toast.error(
        e?.response?.data?.message ||
          'Failed to remove assignment (interviews may exist)'
      );
    } finally {
      setRemovingChildId(null);
    }
  }

  // ── Chip-summary helper for a collapsed parent section ──
  // Custom chip-like Box (instead of MUI <Chip label="…">) so we can color
  // the label and the value independently — blue title, dark-orange value
  // — for a strong contrast read at a glance. ~30% larger than the
  // original 0.72rem chips: legible without dominating the section.
  function ChipSummary({
    items,
  }: {
    items: {
      label: string;
      value?: string;
      /** When true, the value is rendered as a clickable anchor that
       *  opens in a new tab, single-line truncated with ellipsis, and
       *  followed by a copy-to-clipboard icon. Use for URLs that bloat
       *  the layout (e.g. LinkedIn deeplinks). */
      link?: boolean;
    }[];
  }) {
    const nonEmpty = items.filter((i) => !!i.value);
    if (nonEmpty.length === 0)
      return (
        <Typography variant="caption" color="text.secondary">
          No details on file.
        </Typography>
      );

    const handleCopy = async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Could not copy');
      }
    };

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {nonEmpty.map((it) => {
          // Link chip: single row of bounded width with ellipsis on
          // overflow + a copy icon at the end. The chip stretches to
          // the row width so the URL has room without breaking layout.
          if (it.link) {
            return (
              <Box
                key={it.label}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.625,
                  borderRadius: '999px',
                  bgcolor: alpha(tokens.colors.blue, 0.08),
                  border: `1px solid ${alpha(tokens.colors.blue, 0.18)}`,
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    color: tokens.colors.blueDark,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {it.label}:
                </Box>
                <Box
                  component="a"
                  href={it.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={it.value}
                  sx={{
                    color: '#EA580C',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    '&:hover': { color: '#C2410C' },
                  }}
                >
                  {it.value}
                </Box>
                <Tooltip title="Copy link" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(it.value || '');
                    }}
                    sx={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      color: tokens.colors.blueDark,
                      '&:hover': {
                        bgcolor: alpha(tokens.colors.blue, 0.16),
                      },
                    }}
                  >
                    <IconCopy size={13} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }
          return (
            <Box
              key={it.label}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.625,
                borderRadius: '999px',
                bgcolor: alpha(tokens.colors.blue, 0.08),
                border: `1px solid ${alpha(tokens.colors.blue, 0.18)}`,
                maxWidth: '100%',
              }}
            >
              <Box
                component="span"
                sx={{
                  color: tokens.colors.blueDark,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {it.label}:
              </Box>
              <Box
                component="span"
                sx={{
                  color: '#EA580C',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  wordBreak: 'break-word',
                  minWidth: 0,
                }}
              >
                {it.value}
              </Box>
            </Box>
          );
        })}
      </Stack>
    );
  }

  // Parent view + has-children: sections 1-4 collapse to chip summaries.
  const collapseFirstSections = mode === 'view' && isParentWithChildren;

  const textFieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: !isEditing ? '#F6F9FC' : 'transparent',
      },
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: '#2A3547',
      },
    }),
    [isEditing]
  );

  if (!values)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress size={25} />
      </Box>
    );

  return (
    <>
      <Box sx={{ maxWidth: '100%', margin: '0 20px' }}>
        {/* ── AI suggestions (mode: add/edit) ── */}
        {(mode === 'add' || mode === 'edit') && (
          <RequirementAiSuggestions />
        )}

        {/* ── Top bar: resume card + action buttons ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 3,
            pb: 2.5,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            pt: 1,
          }}
        >
          {/* Resume card — left side */}
          <Box>
            {mode === 'edit' && (
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{
                  letterSpacing: '0.06em',
                  color: '#5A6A85',
                  textTransform: 'uppercase',
                }}
              >
                RESUME
              </Typography>
            )}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: '10px',
                minHeight: 38,
                minWidth: 210,
                p: 0,
              }}
            >
              {currentFile ? (
                mode === 'view' ? (
                  <>
                    <Stack
                      py="6px"
                      pl={2}
                      direction="row"
                      alignItems="center"
                      sx={{ flex: 1 }}
                    >
                      {values.resumeUpload && (
                        <img
                          src={`${getMaterialFileIcon(values.resumeUpload)}`}
                          alt="icon"
                          style={{ width: 17, height: 17 }}
                        />
                      )}
                      <Typography variant="subtitle2" pl="6px">
                        Resume
                      </Typography>
                    </Stack>
                    <Box pr={1}>
                      <IconButton
                        download
                        href={currentFile.toString()}
                        size="small"
                      >
                        <DownloadIcon sx={{ color: '#1976d2', width: 18 }} />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <SelectedFile
                    previewType="icon"
                    disabled={isSubmitting}
                    file={currentFile}
                    onClickDelete={removeFile}
                    onClickUpload={() => file && handleFileUpload(file)}
                  />
                )
              ) : mode === 'view' ? (
                <Box p={1} sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    No resume uploaded
                  </Typography>
                </Box>
              ) : (
                <Button
                  disabled={fileCardButtonDisabled}
                  variant="contained"
                  component="label"
                  startIcon={<AttachFile />}
                  size="small"
                  sx={{
                    m: '6px',
                    borderRadius: '8px',
                    backgroundColor: '#1976d2',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#1565c0' },
                  }}
                >
                  Choose File
                  <input
                    type="file"
                    accept=".doc,.docx"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              )}
            </Box>
            {!!errors.resumeUpload && (
              <Typography
                sx={{ mt: 0.5, fontSize: '0.72rem', color: '#EF4444' }}
              >
                {errors.resumeUpload}
              </Typography>
            )}
          </Box>

          {!hideButtons && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              {mode === 'add' ? (
                <Button
                  variant="contained"
                  type="submit"
                  onClick={handleSubmitForm}
                  size="small"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: '#032840',
                    color: '#fff',
                    '&:hover': { bgcolor: '#0A3555' },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    px: 2.5,
                    boxShadow: 'none',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress
                        style={{ color: '#fff', width: 14, height: 14 }}
                      />
                      <span style={{ paddingLeft: 6 }}>Saving</span>
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              ) : isEditing ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setValues(viewData || {});
                      onEdit?.(false);
                    }}
                    sx={{
                      borderColor: 'grey.300',
                      color: '#5A6A85',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      px: 2,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    size="small"
                    disabled={isSubmitting}
                    onClick={handleEditSubmitForm}
                    sx={{
                      bgcolor: '#032840',
                      color: '#fff',
                      '&:hover': { bgcolor: '#0A3555' },
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      px: 2.5,
                      boxShadow: 'none',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress
                          style={{ color: '#fff', width: 14, height: 14 }}
                        />
                        <span style={{ paddingLeft: 6 }}>Saving</span>
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconEdit size={16} />}
                    onClick={() => onEdit?.(true)}
                    sx={{
                      bgcolor: '#032840',
                      color: '#fff',
                      '&:hover': { bgcolor: '#0A3555' },
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      px: 2.5,
                      boxShadow: 'none',
                    }}
                  >
                    Edit
                  </Button>

                  {/* Create-interview is available on child rows too —
                      each marketer-owned child carries its own reqStatus and
                      the interview naturally references that child's reqID
                      (e.g. REQ-04-A), so the downstream Interviews lookup
                      resolves correctly. Copy/Delete remain gated below
                      because those mutate parent-owned shared fields. */}
                  {!disableCreateInterview &&
                    !!viewData?.reqStatus &&
                    ['Submitted', 'Interviewed'].includes(viewData.reqStatus) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handlecreateInterview}
                        sx={{
                          borderColor: tokens.colors.blue,
                          color: tokens.colors.blue,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: '8px',
                          px: 2,
                        }}
                      >
                        Create interview
                      </Button>
                    )}

                  {/* Copy button intentionally hidden for all roles —
                      see note in Requirements.tsx grid actions column. The
                      underlying setCopyAlert/onCopy/handleCopyRequirement
                      machinery + confirm dialog stay in place so flipping
                      this back later is a one-block JSX restore. */}

                  {!disableDelete && isSuperAdmin && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<IconTrash size={16} />}
                      onClick={() => setDeleteAlert(true)}
                      disabled={isSubmitting}
                      sx={{
                        borderColor: alpha('#EF4444', 0.3),
                        color: '#EF4444',
                        '&:hover': {
                          borderColor: '#EF4444',
                          bgcolor: alpha('#EF4444', 0.04),
                        },
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 2,
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>

        {/* ── Child record banner (Edit-on-parent link) ── */}
        {isChildRecord && viewData?.parentReqID && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(tokens.colors.blue, 0.06),
              border: `1px dashed ${alpha(tokens.colors.blue, 0.35)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
            }}
          >
            <IconFileText size={16} color={tokens.colors.blueDark} />
            <Typography variant="body2" color="text.secondary">
              This is a child assignment. Shared fields (client / vendor /
              job info) are edited on the parent record.
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<IconExternalLink size={14} />}
              onClick={() => setParentDrawerOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: alpha(tokens.colors.blue, 0.45),
                color: tokens.colors.blueDark,
              }}
            >
              Edit on parent {viewData.parentReqID}
            </Button>
          </Box>
        )}

        {/* ── Sections ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Section 1: Requirement & Communication — per-marketer workflow
              (status, commercial terms, comments). Hidden on parent-with-
              children drawers because that data lives on the children. */}
          {!isParentWithChildren && (
            <SectionCard number={1} title="Requirement & Communication">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <CustomSelectField
                  label="Req Status"
                  valueOptions={reqStatusOptions}
                  selectedValue={values.reqStatus || ''}
                  disabled={fieldDisabled('reqStatus')}
                  onBlur={() => onBlur('reqStatus')}
                  onChange={(value) => addValue('reqStatus', value)}
                  error={!!errors.reqStatus}
                  helperText={errors.reqStatus}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Assigned To"
                  value={values.assignedTo || ''}
                  disabled
                  fullWidth
                  size="small"
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Next Step"
                  value={values.nextStep || ''}
                  disabled={fieldDisabled('nextStep')}
                  onChange={(e) => addValue('nextStep', e.target.value)}
                  fullWidth
                  size="small"
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                {/* Applied For is a per-marketer decision — support entering
                    the parent doesn't know which consultant the eventual
                    marketer will apply for. Force-disable in add mode;
                    editable on the child record where marketing picks it. */}
                <CustomSelectField
                  label="Applied For"
                  valueOptions={
                    consultants
                      ?.map((c) => c.consultantName || '')
                      .filter(Boolean) || []
                  }
                  selectedValue={values.appliedFor || ''}
                  disabled={mode === 'add' || fieldDisabled('appliedFor')}
                  onChange={(value) => {
                    const id = consultants?.find(
                      (c) => c.consultantName === value,
                    )?._id;
                    addValue('appliedFor', value);
                    addValue('appliedForRef', id || '');
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Rate"
                  value={values.rate?.toString() || ''}
                  disabled={fieldDisabled('rate')}
                  onChange={(e) => addValue('rate', e.target.value)}
                  fullWidth
                  size="small"
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <CustomSelectField
                  freeSolo
                  label="Tax Type"
                  valueOptions={taxTypeOptions}
                  selectedValue={values.taxType?.toString() || ''}
                  disabled={fieldDisabled('taxType')}
                  onChange={(value) => addValue('taxType', value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Remote %"
                  value={values.remote?.toString() || ''}
                  disabled={fieldDisabled('remote')}
                  onChange={(e) => addValue('remote', e.target.value)}
                  fullWidth
                  size="small"
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <CustomSelectField
                  freeSolo
                  label="Duration"
                  valueOptions={duration}
                  selectedValue={values.duration?.toString() || ''}
                  disabled={fieldDisabled('duration')}
                  onChange={(value) => addValue('duration', value)}
                  fullWidth
                />
              </Grid>

              {/* Marketing comment composer + thread — per-marketer, child-
                  only. Hidden entirely in add mode (parent creation) since
                  there's no marketer to attribute a comment to yet; also
                  hidden in view/edit on parent-with-children (Section 1 is
                  already hidden in that case by the outer conditional). */}
              {mode !== 'add' && (
                <>
                  {isEditing && mode !== 'view' && (
                    <Grid size={12}>
                      <TextField
                        label="Marketing Person's Comment"
                        value={comment}
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        onChange={(e) => setComment(e.target.value)}
                        sx={textFieldSx}
                      />
                    </Grid>
                  )}
                  {!!(values.mComment || []).length && (
                    <Grid size={12}>
                      <Stack spacing={1}>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            letterSpacing: '0.06em',
                            color: tokens.colors.blueDark,
                            textTransform: 'uppercase',
                          }}
                        >
                          Comments ({(values.mComment || []).length})
                        </Typography>
                        {[...(values.mComment || [])]
                          .reverse()
                          .map((c, i) => (
                            <Box
                              key={i}
                              sx={{
                                p: 1.25,
                                borderRadius: 1.5,
                                bgcolor: '#F6F9FC',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                color={tokens.colors.blueDark}
                              >
                                {c.username}
                                <Box
                                  component="span"
                                  sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    ml: 0.5,
                                  }}
                                >
                                  ·{' '}
                                  {dayjs(c.date).format(
                                    dateFormate + ' hh:mm A',
                                  )}
                                </Box>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}
                              >
                                {c.comment}
                              </Typography>
                            </Box>
                          ))}
                      </Stack>
                    </Grid>
                  )}
                </>
              )}
            </SectionCard>
          )}

          {/* Section 2: Marketer Assignments — moved above Client Info so the
              per-marketer roster sits right under the primary workflow. */}
          {!isChildRecord && mode !== 'add' && (
            <SectionCard
              number={2}
              title={`Marketer Assignments (${children.length})`}
              right={(() => {
                if (archive) return null;
                // Parent-editors (admin / support / super-admin) always see
                // the button — they manage the full marketer roster.
                // A marketing-role user sees the button as a self-assign
                // shortcut, but only while they haven't already been
                // assigned to this parent — once they have a child, there's
                // nothing for them to do here. AssignRequirementDrawer
                // detects the role itself and renders the right mode.
                const isCurrentMarketerAssigned = children.some(
                  (c) => c.assignedToRef && c.assignedToRef === user.id
                );
                const isMarketing = userRoles.includes(UserRole.marketing);
                const canSelfAssign = isMarketing && !isCurrentMarketerAssigned;
                if (!isParentEditor && !canSelfAssign) return null;
                return (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<IconUsersPlus size={14} />}
                    onClick={() => setAssignOpen(true)}
                    sx={{
                      background:
                        'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                      color: '#fff',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: 'none',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                      },
                    }}
                  >
                    {isParentEditor ? 'Assign' : 'Assign me'}
                  </Button>
                );
              })()}
            >
              <Grid size={12}>
                {loadingChildren ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : children.length === 0 ? (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `1px dashed ${alpha(tokens.colors.blue, 0.35)}`,
                      bgcolor: alpha(tokens.colors.blue, 0.03),
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No marketers assigned yet.
                      {isParentEditor && !archive
                        ? ' Click “Assign” to spawn child assignments for this position.'
                        : ''}
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {children.map((c) => {
                      const isSelf =
                        String(c.assignedToRef || '') === String(user._id);
                      const readOnly = !isSelf && !isParentEditor;
                      return (
                        <MarketerAssignmentCard
                          key={c._id}
                          child={c}
                          currentUser={user}
                          pendingComment={pendingComments[c._id] || ''}
                          onPendingCommentChange={(text) =>
                            setPendingComments((prev) => ({
                              ...prev,
                              [c._id]: text,
                            }))
                          }
                          onPostComment={(text) => postChildComment(c, text)}
                          onOpenFocused={() => onOpenChild?.(c.reqID)}
                          onRemove={() => removeChild(c)}
                          removing={removingChildId === c._id}
                          posting={postingCommentFor === c._id}
                          readOnly={readOnly}
                          /* Unassign flow lives in the Assign drawer (header
                             button); the inline trash icon on each card is
                             suppressed so marketers don't lose an assignment
                             with an accidental click. */
                          canRemove={false}
                          isSelf={isSelf}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Grid>
            </SectionCard>
          )}

          {/* Section 3: Client Info */}
          <SectionCard
            number={3}
            title="Client Info"
            collapsible={collapseFirstSections}
            defaultOpen={!collapseFirstSections}
            forceSummary={mode === 'view'}
            summary={
              <ChipSummary
                items={[
                  { label: 'Client', value: values.clientCompany },
                  { label: 'Website', value: values.clientWebsite },
                  { label: 'Address', value: values.clientAddress },
                  { label: 'Person', value: values.clientPerson },
                  { label: 'Phone', value: values.clientPhone },
                  { label: 'Email', value: values.clientEmail },
                ]}
              />
            }
          >
            <CustomTextField
              label="Client Company"
              fullWidth
              selectedValue={values.clientCompany || ''}
              disabled={fieldDisabled('clientCompany')}
              onChange={(e) => addValue('clientCompany', e.target.value)}
            />
            <CustomTextField
              label="Client Website"
              fullWidth
              selectedValue={values.clientWebsite || ''}
              disabled={fieldDisabled('clientWebsite')}
              onChange={(e) => addValue('clientWebsite', e.target.value)}
            />
            <CustomTextField
              label="Client Address"
              fullWidth
              selectedValue={values.clientAddress || ''}
              disabled={fieldDisabled('clientAddress')}
              onChange={(e) => addValue('clientAddress', e.target.value)}
            />
            <CustomTextField
              label="Client Person Name"
              fullWidth
              selectedValue={values.clientPerson || ''}
              disabled={fieldDisabled('clientPerson')}
              onChange={(e) => addValue('clientPerson', e.target.value)}
            />
            <CustomTextField
              label="Client Phone"
              fullWidth
              selectedValue={values.clientPhone || ''}
              disabled={fieldDisabled('clientPhone')}
              onChange={(e) => addValue('clientPhone', e.target.value)}
            />
            <CustomTextField
              label="Client Email"
              fullWidth
              selectedValue={values.clientEmail || ''}
              disabled={fieldDisabled('clientEmail')}
              onBlur={() => onBlur('clientEmail')}
              onChange={(e) => addValue('clientEmail', e.target.value)}
              error={!!errors.clientEmail}
              helperText={errors.clientEmail}
            />
          </SectionCard>

          {/* Section 4: Prime Vendor */}
          <SectionCard
            number={4}
            title="Prime Vendor Info"
            collapsible={collapseFirstSections}
            defaultOpen={!collapseFirstSections}
            forceSummary={mode === 'view'}
            summary={
              <ChipSummary
                items={[
                  { label: 'Prime', value: values.primeVendorCompany },
                  { label: 'Website', value: values.primeVendorWebsite },
                  { label: 'Person', value: values.primeVendorName },
                  { label: 'Phone', value: values.primeVendorPhone },
                  { label: 'Email', value: values.primeVendorEmail },
                ]}
              />
            }
          >
            <CustomTextField
              label="Prime Vendor Company"
              fullWidth
              selectedValue={values.primeVendorCompany || ''}
              disabled={fieldDisabled('primeVendorCompany')}
              onChange={(e) => addValue('primeVendorCompany', e.target.value)}
            />
            <CustomTextField
              label="Prime Vendor Website"
              fullWidth
              selectedValue={values.primeVendorWebsite || ''}
              disabled={fieldDisabled('primeVendorWebsite')}
              onChange={(e) => addValue('primeVendorWebsite', e.target.value)}
            />
            <CustomTextField
              label="Prime Vendor Person Name"
              fullWidth
              selectedValue={values.primeVendorName || ''}
              disabled={fieldDisabled('primeVendorName')}
              onChange={(e) => addValue('primeVendorName', e.target.value)}
            />
            <CustomTextField
              label="Prime Vendor Phone"
              fullWidth
              selectedValue={values.primeVendorPhone || ''}
              disabled={fieldDisabled('primeVendorPhone')}
              onChange={(e) => addValue('primeVendorPhone', e.target.value)}
            />
            <CustomTextField
              label="Prime Vendor Email"
              fullWidth
              selectedValue={values.primeVendorEmail || ''}
              disabled={fieldDisabled('primeVendorEmail')}
              onBlur={() => onBlur('primeVendorEmail')}
              onChange={(e) => addValue('primeVendorEmail', e.target.value)}
              error={!!errors.primeVendorEmail}
              helperText={errors.primeVendorEmail}
            />
          </SectionCard>

          {/* Section 5: Vendor */}
          <SectionCard
            number={5}
            title="Vendor Info"
            collapsible={collapseFirstSections}
            defaultOpen={!collapseFirstSections}
            forceSummary={mode === 'view'}
            summary={
              <ChipSummary
                items={[
                  { label: 'Vendor', value: values.vendorCompany },
                  { label: 'Website', value: values.vendorWebsite },
                  { label: 'Person', value: values.vendorPersonName },
                  { label: 'Phone', value: values.vendorPhone },
                  { label: 'Email', value: values.vendorEmail },
                ]}
              />
            }
          >
            <CustomTextField
              label="Vendor Company"
              fullWidth
              selectedValue={values.vendorCompany || ''}
              disabled={fieldDisabled('vendorCompany')}
              onBlur={() => onBlur('vendorCompany')}
              onChange={(e) => addValue('vendorCompany', e.target.value)}
              error={!!errors.vendorCompany}
              helperText={errors.vendorCompany}
              required
            />
            <CustomTextField
              label="Vendor Website"
              fullWidth
              selectedValue={values.vendorWebsite || ''}
              disabled={fieldDisabled('vendorWebsite')}
              onChange={(e) => addValue('vendorWebsite', e.target.value)}
            />
            <CustomTextField
              label="Vendor Person Name"
              fullWidth
              selectedValue={values.vendorPersonName || ''}
              disabled={fieldDisabled('vendorPersonName')}
              onBlur={() => onBlur('vendorPersonName')}
              onChange={(e) => addValue('vendorPersonName', e.target.value)}
              error={!!errors.vendorPersonName}
              helperText={errors.vendorPersonName}
            />
            <CustomTextField
              label="Vendor Phone"
              fullWidth
              selectedValue={values.vendorPhone || ''}
              disabled={fieldDisabled('vendorPhone')}
              onChange={(e) => addValue('vendorPhone', e.target.value)}
            />
            <CustomTextField
              label="Vendor Email"
              fullWidth
              selectedValue={values.vendorEmail || ''}
              disabled={fieldDisabled('vendorEmail')}
              onBlur={() => onBlur('vendorEmail')}
              onChange={(e) => addValue('vendorEmail', e.target.value)}
              error={!!errors.vendorEmail}
              helperText={errors.vendorEmail}
            />
          </SectionCard>

          {/* Section 6: Job Requirement Info — job-level metadata (the
              shared-job facts). Chip summary in view mode; form in edit/add. */}
          <SectionCard
            number={6}
            title="Job Requirement Info"
            forceSummary={mode === 'view'}
            summary={
              <Box>
                <ChipSummary
                  items={[
                    { label: 'Title', value: values.jobTitle },
                    { label: 'Type', value: values.employementType },
                    { label: 'Primary Tech', value: values.primaryTech },
                    { label: 'Secondary Tech', value: values.secondaryTech },
                    { label: 'Tech Stack', value: values.primaryTechStack },
                    { label: 'Keywords', value: values.reqKeywords },
                    {
                      label: 'Portal',
                      value: values.jobPortalLink,
                      link: true,
                    },
                    { label: 'Got Req From', value: values.gotReqFrom },
                  ]}
                />
                {values.jobDescription && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#F6F9FC',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      maxHeight: 320,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Job Description
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}
                    >
                      {values.jobDescription}
                    </Typography>
                  </Box>
                )}
                {values.gotOnResume && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#F6F9FC',
                      border: '1px solid',
                      borderColor: 'grey.200',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Got On Resume
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}
                    >
                      {values.gotOnResume}
                    </Typography>
                  </Box>
                )}
              </Box>
            }
          >
            {/* Row 1 — provenance */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  format={dateFormate}
                  disabled
                  label="Requirement Entered Date"
                  value={values.createdAt ? dayjs(values.createdAt) : null}
                  onChange={() => {}}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      disabled: true,
                      sx: textFieldSx,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <CustomTextField
              label="Requirement Entered By"
              fullWidth
              selectedValue={values.reqEnteredBy || ''}
              disabled
              onChange={() => {}}
            />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <CustomSelectField
                freeSolo
                label="Got Requirement From"
                valueOptions={gotRequirementForm}
                selectedValue={values.gotReqFrom || ''}
                disabled={fieldDisabled('gotReqFrom')}
                onChange={(value) => addValue('gotReqFrom', value)}
                fullWidth
              />
            </Grid>

            {/* Row 2 — tech */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <CustomSelectField
                freeSolo
                label="Primary Tech"
                valueOptions={techStack}
                selectedValue={values.primaryTech || ''}
                disabled={fieldDisabled('primaryTech')}
                onChange={(value) => addValue('primaryTech', value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <CustomSelectField
                freeSolo
                label="Primary Tech Stack"
                valueOptions={techStack}
                selectedValue={values.primaryTechStack || ''}
                disabled={fieldDisabled('primaryTechStack')}
                onChange={(value) => addValue('primaryTechStack', value)}
                fullWidth
              />
            </Grid>
            <CustomTextField
              label="Secondary Tech"
              fullWidth
              selectedValue={values.secondaryTech || ''}
              disabled={fieldDisabled('secondaryTech')}
              onChange={(e) => addValue('secondaryTech', e.target.value)}
            />

            {/* Row 3 — title / type / portal */}
            <CustomTextField
              label="Job Title"
              fullWidth
              selectedValue={values.jobTitle || ''}
              disabled={fieldDisabled('jobTitle')}
              onChange={(e) => addValue('jobTitle', e.target.value)}
            />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <CustomSelectField
                freeSolo
                label="Employment Type"
                valueOptions={employementTypeOptions}
                selectedValue={values.employementType || ''}
                disabled={fieldDisabled('employementType')}
                onChange={(value) => addValue('employementType', value)}
                fullWidth
              />
            </Grid>
            <CustomTextField
              label="Job Portal Link"
              fullWidth
              selectedValue={values.jobPortalLink || ''}
              disabled={fieldDisabled('jobPortalLink')}
              onChange={(e) => addValue('jobPortalLink', e.target.value)}
            />

            {/* Row 4 — keywords (9) + resume note (3) */}
            <Grid size={{ xs: 12, md: 9 }}>
              <TextField
                label="Req Keywords"
                value={values.reqKeywords || ''}
                disabled={fieldDisabled('reqKeywords')}
                onChange={(e) => addValue('reqKeywords', e.target.value)}
                fullWidth
                size="small"
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Got On Resume"
                value={values.gotOnResume || ''}
                disabled={fieldDisabled('gotOnResume')}
                onChange={(e) => addValue('gotOnResume', e.target.value)}
                fullWidth
                size="small"
                sx={textFieldSx}
              />
            </Grid>

            {/* Full-width — job description */}
            <Grid size={12}>
              <TextField
                label="Complete Job Description"
                value={values.jobDescription || ''}
                disabled={fieldDisabled('jobDescription')}
                fullWidth
                size="small"
                multiline
                minRows={4}
                required
                onBlur={() => onBlur('jobDescription')}
                onChange={(e) => addValue('jobDescription', e.target.value)}
                error={!!errors.jobDescription}
                helperText={errors.jobDescription}
                sx={textFieldSx}
              />
            </Grid>
          </SectionCard>

          {/* Section 7: Footer metadata + logs */}
          {!hideFooter && !isEditing && (
            <>
              <Divider />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  flexWrap: 'wrap',
                  gap: 1,
                  px: 0.5,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: '#5A6A85' }}>
                    Entered by:{' '}
                    <Box component="span" sx={{ fontWeight: 700, color: '#0A3555' }}>
                      {values.reqEnteredBy || '—'}
                    </Box>{' '}
                    · On:{' '}
                    <Box component="span" sx={{ fontWeight: 700, color: '#0A3555' }}>
                      {values.createdAt
                        ? dayjs(values.createdAt).format(dateFormate + ' hh:mm A')
                        : '—'}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {showLogs && viewData?._id && !isEditing && (
            <>
              <Divider />
              <RequirementLogTable
                requirementObjectId={viewData._id}
                /* On a parent-or-legacy record, ask the server to roll up
                   children's logs into the same view so everyone's actions
                   against this position show in one timeline. Child drawers
                   stay scoped to just their own doc. */
                parentReqID={
                  viewData.parentReqID ? undefined : viewData.reqID
                }
              />
            </>
          )}
        </Box>
      </Box>

      {/* ── Delete confirmation ── */}
      <Dialog
        open={deleteAlert}
        onClose={() => setDeleteAlert(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>
          Delete Requirement?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this requirement? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteAlert(false)}
            sx={{ textTransform: 'none', color: '#5A6A85' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDeleteAlert(false);
              handleDeleteRequirement();
            }}
            variant="contained"
            startIcon={<IconTrash size={14} />}
            sx={{
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' },
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: '8px',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Copy confirmation ── */}
      <Dialog
        open={copyAlert}
        onClose={() => setCopyAlert(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>
          Copy Requirement
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to copy this requirement? A new standalone
            record will be created; child assignments are not cloned.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCopyAlert(false)}
            sx={{ textTransform: 'none', color: '#5A6A85' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<IconCopy size={14} />}
            onClick={() => {
              setCopyAlert(false);
              handleCopyRequirement?.();
            }}
            sx={{
              bgcolor: '#032840',
              '&:hover': { bgcolor: '#0A3555' },
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: '8px',
            }}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign drawer (parent view) ── */}
      {!isChildRecord && (
        <AssignRequirementDrawer
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          parent={viewData}
          accounts={accounts || []}
          onMutate={(info) => {
            // 1. Keep the form-internal `children` list in sync so the parent
            //    view's "Marketer assignments" card reflects the change
            //    without a manual reload. The drawer already refetched, so we
            //    just splice in the fresh list it handed us.
            setChildren(info.children);

            // 2. Close the assign sub-drawer on any successful add. Removal
            //    keeps it open so admins can chain trash clicks on multiple
            //    stale assignments without re-opening between each.
            if (info.kind === 'add') setAssignOpen(false);

            // 3. Bubble up to the page so it can update the grid's
            //    `childrenMap`, auto-expand the parent, bump the pipeline
            //    snapshot, and (for self-assign) open the new child drawer.
            //    Without this, the page-level grid wouldn't reflect the
            //    new assignment until a manual refresh.
            onAssignMutated?.(info);
          }}
        />
      )}

      {/* ── Parent drawer (child view "Edit on parent") ── */}
      {isChildRecord && viewData?.parentReqID && (
        <RequirementDrawer
          open={parentDrawerOpen}
          onClose={() => setParentDrawerOpen(false)}
          reqID={viewData.parentReqID}
          archive={archive}
        />
      )}

      {/* ── Inline Create-Interview drawer ──
          Opens a full InterviewForm with the current requirement (this child
          record, if viewing a child — parent reqID otherwise) already seeded
          into the form values via InterviewForm's `requirement` prop. No
          SearchRequirement popup is needed — the context is known.

          On successful save InterviewForm calls `onDrawerClose` and we close
          this drawer. The user stays on their current requirement page. */}
      {viewData && (
        <CustomDrawer
          open={createInterviewOpen}
          onClose={() => setCreateInterviewOpen(false)}
          title={`New interview · ${viewData.reqID}`}
          closeOnOutSideClick
        >
          {teamsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 240,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : (
            <InterviewForm
              mode="add"
              isEditing
              requirement={viewData as IRequirement}
              teamsList={teamsForInterview}
              onDrawerClose={() => setCreateInterviewOpen(false)}
              onCreate={() => {
                toast.success('Interview created');
              }}
            />
          )}
        </CustomDrawer>
      )}

      {/* Propagate parent updates to child records. Only ever open
          when isParentWithChildren AND the just-saved diff carried
          at least one parent-owned field. See handleEditSubmitForm. */}
      <PropagateToChildrenDialog
        open={propagateOpen}
        parentReqID={viewData?.reqID || ''}
        children={children}
        changedFields={Object.keys(propagateChanges)}
        onCancel={() => {
          setPropagateOpen(false);
          onDrawerClose?.();
        }}
        onConfirm={handlePropagateConfirm}
      />
    </>
  );
}
