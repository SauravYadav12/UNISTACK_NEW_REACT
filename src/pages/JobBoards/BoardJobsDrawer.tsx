import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { useJobBoardSearch } from '../../context/JobBoardSearchContext';
import { NormalizedJob } from '../../Interfaces/jobBoard';

/**
 * Drawer that lists every job for the publisher the user clicked on the
 * results grid. Each row is clickable — clicking opens the JobDetailDialog
 * with the full posting.
 *
 * No "Load more" affordance: the parent search already fetches the
 * full result batch upfront (JSearch v2 uses opaque cursors, so
 * page-based pagination would just re-fetch the same jobs).
 */

interface BoardJobsDrawerProps {
  publisher: string | null;
  onClose: () => void;
  onSelectJob: (job: NormalizedJob) => void;
}

function formatPostedAt(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BoardJobsDrawer({
  publisher,
  onClose,
  onSelectJob,
}: BoardJobsDrawerProps) {
  const { response } = useJobBoardSearch();

  const jobs: NormalizedJob[] = publisher
    ? response?.byPublisher?.[publisher] ?? []
    : [];

  return (
    <CustomDrawer
      open={Boolean(publisher)}
      onClose={onClose}
      closeOnOutSideClick
      title={publisher ? `${publisher} jobs` : ''}
      subTitle={
        publisher && jobs.length
          ? `${jobs.length} ${jobs.length === 1 ? 'result' : 'results'}`
          : ''
      }
    >
      <Box sx={{ px: 1 }}>
        {jobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No jobs to show.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {jobs.map((job, idx) => (
              <Box key={job.id || `${publisher}-${idx}`}>
                <ListItemButton
                  onClick={() => onSelectJob(job)}
                  sx={{ alignItems: 'flex-start', py: 1.5 }}
                >
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {job.title || 'Untitled role'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[job.company, job.location].filter(Boolean).join(' · ')}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 0.5, flexWrap: 'wrap' }}
                    >
                      {job.employmentType && (
                        <Chip
                          size="small"
                          label={job.employmentType.toLowerCase()}
                          variant="outlined"
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
                        <Chip
                          size="small"
                          variant="outlined"
                          label={job.salary}
                        />
                      )}
                      {job.postedAt && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Posted ${formatPostedAt(job.postedAt)}`}
                        />
                      )}
                    </Stack>
                  </Stack>
                </ListItemButton>
                <Divider />
              </Box>
            ))}
          </List>
        )}
      </Box>
    </CustomDrawer>
  );
}
