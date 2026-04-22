import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { IconFolders, IconX } from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';
import { createProjectFromReq, suggestProjectId } from '../../../services/projectApi';
import SearchRequirement from '../Interviews/SearchRequirement';
import { IProject } from '../../../Interfaces/project';
import { IOrganization } from '../../../Interfaces/organization';
import { IRequirement } from '../../../Interfaces/types';

interface Props {
  open: boolean;
  /** Target organization for the new project. Required before the user can
   *  pick a requirement — blocks the dialog with a friendly hint otherwise. */
  organization: IOrganization | null;
  onClose: () => void;
  onCreated: (p: IProject) => void;
}

export default function AddProjectDialog({
  open,
  organization,
  onClose,
  onCreated,
}: Props) {
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  // Project ID: pre-filled from server suggest endpoint, admin may override.
  // Duplicates are caught on submit (409 from API) and surfaced inline.
  const [projectId, setProjectId] = useState('');
  const [projectIdError, setProjectIdError] = useState('');
  const [projectIdLoading, setProjectIdLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setProjectIdLoading(true);
    suggestProjectId()
      .then((res) => {
        if (mounted && res.data?.data?.projectId) {
          setProjectId(res.data.data.projectId);
        }
      })
      .finally(() => {
        if (mounted) setProjectIdLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open]);

  const handleClose = () => {
    if (creatingFor) return;
    setProjectIdError('');
    onClose();
  };

  /**
   * Fired when the user picks a requirement row inside SearchRequirement.
   * Validates the Project-ID input + organization context, then creates the
   * project from the picked reqID. Server-side the `createProjectFromReq`
   * controller blocks conversion for parents-with-children and for reqs that
   * already have an active project, so we only need to handle those errors
   * by surface (toast / inline helper text).
   */
  const handleCreate = async (record: IRequirement) => {
    if (!organization) {
      toast.error('Select an organization first');
      return;
    }
    // Only child requirements (those with a parentReqID) are convertible.
    // The server enforces this too; short-circuit here to skip the network
    // roundtrip and give a clearer, role-specific message.
    if (!record.parentReqID) {
      toast.error(
        `${record.reqID} isn't a marketer assignment. Assign a marketer to it first (spawns ${record.reqID}-A) and create the project from that child.`,
      );
      return;
    }
    const pid = projectId.trim();
    if (!pid) {
      setProjectIdError('Project ID is required');
      return;
    }
    if (!/^[A-Za-z0-9-]{3,20}$/.test(pid)) {
      setProjectIdError('3–20 chars, letters/digits/hyphens only');
      return;
    }
    setProjectIdError('');
    setCreatingFor(record.reqID || '');
    try {
      const { data } = await createProjectFromReq(
        record.reqID || '',
        organization._id,
        pid,
      );
      if (!data.data) throw new Error(data.message || 'Create failed');
      toast.success(
        `Project ${data.data.projectId} created from ${record.reqID}`,
      );
      onCreated(data.data);
    } catch (err: unknown) {
      const resp = (err as {
        response?: { status?: number; data?: { code?: string; message?: string } };
      }).response;
      const msg =
        resp?.data?.message ||
        (err as { message?: string }).message ||
        'Could not create project';
      // Surface duplicate-ID errors inline on the project-ID field instead of
      // a toast — more scannable, and the admin can immediately correct it.
      if (resp?.status === 409 && resp?.data?.code === 'PROJECT_ID_TAKEN') {
        setProjectIdError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      }}
    >
      {/* Brand-bannered header */}
      <Box
        sx={{
          position: 'relative',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          px: 3,
          py: 2.25,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              tokens.colors.blue,
              0.3,
            )} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${tokens.colors.pink} 0%, ${tokens.colors.blue} 100%)`,
          }}
        />
        <DialogTitle
          sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1.25 }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: tokens.gradients.pinkBlue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <IconFolders size={18} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
              Add project
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
              {organization
                ? `Organization: ${organization.shortCode} · ${organization.name}`
                : 'Select an organization first'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            disabled={!!creatingFor}
            sx={{ color: '#fff' }}
          >
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Project ID input stays on the dialog itself since it's global to
            the create action — not tied to any specific requirement row. */}
        <Box sx={{ p: 3, pb: 0 }}>
          <TextField
            fullWidth
            size="small"
            label="Project ID"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value.trim().toUpperCase());
              if (projectIdError) setProjectIdError('');
            }}
            error={!!projectIdError}
            helperText={
              projectIdError ||
              (projectIdLoading
                ? 'Loading suggestion…'
                : 'Edit if you need a different ID. 3–20 chars, letters/digits/hyphens.')
            }
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
            }}
          />
        </Box>

        {/* Mirror the Add Interview flow — the same rich SearchRequirement
            experience (parent hero + assignments list, YOUR/MATCHED/LEGACY
            chips, debounced lookup) is used to pick the source requirement.
            `onSelect` fires the project-create pipeline.
            `disableSelectReason` grays out rows that are already attached to
            a project (in any org) so the admin can't trigger a duplicate
            create — with the existing project's ID + org shown inline. */}
        <SearchRequirement
          onSelect={handleCreate}
          disableSelectReason={(r) => {
            if (!r.project?.projectId) return null;
            const org =
              r.project.organizationShortCode ||
              r.project.organizationName ||
              'another organization';
            return `Already attached as project ${r.project.projectId} under ${org}. Delete that project first to re-attach.`;
          }}
        />

        {/* Creating overlay — prevents another select while the request is
            in flight, keeps the UX calm without spinning one button. */}
        {creatingFor && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: alpha('#fff', 0.75),
              backdropFilter: 'blur(2px)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack alignItems="center" spacing={1.25}>
              <CircularProgress size={28} sx={{ color: tokens.colors.pink }} />
              <Typography variant="body2" fontWeight={700}>
                Creating project from {creatingFor}…
              </Typography>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
