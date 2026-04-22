import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { ChangeEvent, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IconCloudUpload,
  IconDownload,
  IconFileText,
  IconTrash,
} from '@tabler/icons-react';
import moment from 'moment';
import { tokens } from '../../../theme/theme';
import { IProject, IProjectContract } from '../../../Interfaces/project';
import { uploadFile } from '../../../services/storageApi';
import {
  addContract as apiAddContract,
  removeContract as apiRemoveContract,
} from '../../../services/projectApi';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB — matches server cap

interface Props {
  project: IProject;
  onUpdated: (p: IProject) => void;
}

function prettyBytes(n?: number): string {
  if (n == null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

type PendingUpload = {
  name: string;
  sizeBytes: number;
  /** Ticks forward while the XHR is in flight (indeterminate at the end). */
  phase: 'uploading' | 'attaching';
};

/**
 * Additional docs panel. Single card with multi-file PDF support — no scope
 * buckets. Everything is stored under `scope: 'other'` server-side; the UI
 * presents it as one flat list. Displays an explicit progress bar + filename
 * strip while an upload is in flight so the user knows work is happening.
 */
export default function ContractUploadPanel({ project, onUpdated }: Props) {
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IProjectContract | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const docs = project.contracts || [];

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow same file re-pick
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File exceeds 20 MB limit');
      return;
    }

    setPending({ name: file.name, sizeBytes: file.size, phase: 'uploading' });
    try {
      const uploadRes = await uploadFile(file, 'contract');
      const url = uploadRes.data?.data?.url;
      if (!url) throw new Error('Upload failed — no URL returned');

      // Transition the progress strip to "attaching" so the user sees the
      // handoff between the S3 upload and the Mongo write.
      setPending((p) => (p ? { ...p, phase: 'attaching' } : p));

      const { data } = await apiAddContract(project._id, {
        scope: 'other',
        url,
        fileName: file.name,
        sizeBytes: file.size,
      });
      if (data.data) onUpdated(data.data);
      toast.success('Document uploaded');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ||
        (err as { message?: string })?.message ||
        'Upload failed';
      toast.error(msg);
    } finally {
      setPending(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?._id) return;
    const { data } = await apiRemoveContract(project._id, pendingDelete._id);
    if (data.data) onUpdated(data.data);
    setPendingDelete(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Additional docs
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PDFs only, up to 20 MB each. Signed contracts, NDAs, addendums — anything the project needs for the paper trail.
        </Typography>
      </Box>

      <Box
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(tokens.colors.blue, 0.3),
          bgcolor: alpha(tokens.colors.blue, 0.04),
          overflow: 'hidden',
        }}
      >
        {/* Upload strip */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            borderBottom: docs.length || pending ? `1px solid ${alpha(tokens.colors.blue, 0.2)}` : 'none',
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: alpha(tokens.colors.blue, 0.15),
              color: tokens.colors.blueDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileText size={16} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ fontSize: '0.9rem' }}>
              Project documents
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.colors.lightTextSecondary }}
            >
              {docs.length} attached
            </Typography>
          </Box>
          <input
            type="file"
            accept="application/pdf"
            ref={fileRef}
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={!!pending}
            startIcon={
              pending ? (
                <CircularProgress size={14} sx={{ color: '#fff' }} />
              ) : (
                <IconCloudUpload size={16} />
              )
            }
            variant="contained"
            sx={{
              bgcolor: tokens.colors.pink,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { bgcolor: tokens.colors.pinkDark },
              '&.Mui-disabled': {
                bgcolor: alpha(tokens.colors.pink, 0.5),
                color: '#fff',
              },
            }}
          >
            {pending ? 'Uploading…' : 'Upload PDF'}
          </Button>
        </Box>

        {/* Live upload progress — visible only while work is in flight. */}
        {pending && (
          <Box
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: alpha(tokens.colors.pink, 0.04),
              borderBottom: `1px solid ${alpha(tokens.colors.pink, 0.15)}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.75 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: alpha(tokens.colors.pink, 0.12),
                  color: tokens.colors.pinkDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CircularProgress size={14} sx={{ color: tokens.colors.pinkDark }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: tokens.colors.lightText,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {pending.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: tokens.colors.lightTextSecondary, fontSize: '0.7rem' }}
                >
                  {prettyBytes(pending.sizeBytes)} ·{' '}
                  {pending.phase === 'uploading' ? 'uploading to storage…' : 'attaching to project…'}
                </Typography>
              </Box>
            </Stack>
            <LinearProgress
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(tokens.colors.pink, 0.15),
                '& .MuiLinearProgress-bar': { bgcolor: tokens.colors.pink },
              }}
            />
          </Box>
        )}

        {/* File list */}
        {docs.length > 0 && (
          <Stack
            divider={
              <Box sx={{ borderBottom: '1px solid', borderColor: 'grey.100' }} />
            }
          >
            {docs.map((f) => (
              <Box
                key={f._id || f.url}
                sx={{
                  px: 2,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    bgcolor: alpha(tokens.colors.blue, 0.1),
                    color: tokens.colors.blueDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconFileText size={14} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0A3555',
                      wordBreak: 'break-word',
                    }}
                  >
                    {f.fileName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
                  >
                    {prettyBytes(f.sizeBytes)}
                    {f.uploadedBy ? ` · ${f.uploadedBy}` : ''}
                    {f.uploadedAt ? ` · ${moment(f.uploadedAt).format('MMM D, YYYY')}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    component="a"
                    href={f.url}
                    target="_blank"
                    rel="noopener"
                    sx={{ color: tokens.colors.blueDark }}
                  >
                    <IconDownload size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => setPendingDelete(f)}
                    sx={{ color: '#EF4444' }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}

        {!pending && docs.length === 0 && (
          <Box
            sx={{
              px: 2,
              py: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: tokens.colors.lightTextSecondary }}
            >
              Nothing attached yet — upload the first PDF above.
            </Typography>
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Remove this document?"
        description={
          pendingDelete
            ? `"${pendingDelete.fileName}" will be removed from this project. The file on S3 is not deleted automatically.`
            : ''
        }
        confirmLabel="Remove"
        tone="danger"
      />
    </Box>
  );
}
