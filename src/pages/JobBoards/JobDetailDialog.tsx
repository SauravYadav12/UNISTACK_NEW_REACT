import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { IconExternalLink } from '@tabler/icons-react';
import { NormalizedJob } from '../../Interfaces/jobBoard';

/**
 * Modal showing the full details of a single posting.
 *
 * Mirrors the codebase's existing MUI Dialog convention (see
 * `EditSlipDialog.tsx`). The apply link opens in a new tab — boards
 * actively block iframe embedding (X-Frame-Deny), and a new tab keeps
 * the user's place in the drawer behind the modal.
 */

interface JobDetailDialogProps {
  job: NormalizedJob | null;
  onClose: () => void;
}

function formatPostedAt(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function JobDetailDialog({
  job,
  onClose,
}: JobDetailDialogProps) {
  const open = Boolean(job);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {job && (
        <>
          <DialogTitle sx={{ pb: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {job.title || 'Untitled role'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[job.company, job.location].filter(Boolean).join(' · ')}
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={job.publisher}
              />
              {job.employmentType && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={job.employmentType.toLowerCase()}
                />
              )}
              {job.isRemote && (
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  label="Remote"
                />
              )}
              {job.salary && (
                <Chip size="small" variant="outlined" label={job.salary} />
              )}
              {job.postedAt && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Posted ${formatPostedAt(job.postedAt)}`}
                />
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                Description
              </Typography>
              {/* Job descriptions from aggregators are plain-text with
                  newline breaks. Render in a pre-wrap block so paragraphs
                  survive. No HTML is injected — defends against any
                  upstream attempts to ship markup. */}
              <Typography
                variant="body2"
                component="div"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: 'text.primary',
                  lineHeight: 1.6,
                }}
              >
                {job.description ||
                  'No description provided. Open the link below to view on the job board.'}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Close</Button>
            {job.applyUrl && (
              <Button
                variant="contained"
                endIcon={<IconExternalLink size={18} />}
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply on {job.publisher}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
