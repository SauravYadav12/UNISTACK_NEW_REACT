import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { IconArrowRight, IconClock, IconDatabase } from '@tabler/icons-react';
import { useJobBoardSearch } from '../../context/JobBoardSearchContext';
import { NormalizedJob } from '../../Interfaces/jobBoard';

/**
 * The grid of per-publisher cards shown beneath the search bar.
 *
 * Each card represents one job board (Indeed, LinkedIn, ZipRecruiter,
 * Glassdoor, Dice, Monster, Other). Clicking a card opens the drawer
 * with that board's full list of jobs.
 *
 * Card content:
 *   - publisher name + total count
 *   - first three job titles as a preview
 *   - a "View all →" affordance
 *
 * Plus a small header strip that reports:
 *   - when the results were fetched
 *   - whether they came from the shared cache (no quota burn) or live
 *   - the remaining monthly quota if the server forwarded it
 */

interface ResultsGridProps {
  onOpenPublisher: (publisher: string) => void;
}

function formatRelative(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const ms = Date.now() - then;
  if (ms < 60_000) return 'just now';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CardSkeleton() {
  return (
    <Card variant="outlined" sx={{ width: 320, borderRadius: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="30%" />
        <Box sx={{ mt: 1.5 }}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
        </Box>
      </CardContent>
    </Card>
  );
}

interface PublisherCardProps {
  publisher: string;
  jobs: NormalizedJob[];
  onOpen: () => void;
}

function PublisherCard({ publisher, jobs, onOpen }: PublisherCardProps) {
  const preview = jobs.slice(0, 3);
  return (
    <Card variant="outlined" sx={{ width: 320, borderRadius: 2 }}>
      <CardActionArea onClick={onOpen}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {publisher}
            </Typography>
            <Chip
              size="small"
              color="primary"
              label={`${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`}
            />
          </Stack>

          <Stack spacing={0.5} sx={{ minHeight: 78 }}>
            {preview.map((j) => (
              <Typography
                key={j.id}
                variant="body2"
                color="text.secondary"
                noWrap
              >
                • {j.title}
                {j.company ? ` — ${j.company}` : ''}
              </Typography>
            ))}
            {preview.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No previews available.
              </Typography>
            )}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={0.5}
            sx={{ mt: 1.5, color: 'primary.main' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              View all
            </Typography>
            <IconArrowRight size={16} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function ResultsGrid({ onOpenPublisher }: ResultsGridProps) {
  const { response, isLoading } = useJobBoardSearch();

  if (isLoading && !response) {
    return (
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 3 }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </Stack>
    );
  }

  if (!response) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Enter a job title above to search across major US job boards.
        </Typography>
      </Box>
    );
  }

  const publishers = Object.keys(response.byPublisher || {}).sort((a, b) => {
    return (
      (response.byPublisher[b]?.length ?? 0) -
      (response.byPublisher[a]?.length ?? 0)
    );
  });

  if (publishers.length === 0) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No matches. Try a different keyword, location, or time range.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        <Chip
          icon={<IconClock size={14} />}
          size="small"
          label={`Fetched ${formatRelative(response.fetchedAt)}`}
          variant="outlined"
        />
        {response.fromCache && (
          <Chip
            icon={<IconDatabase size={14} />}
            size="small"
            color="success"
            variant="outlined"
            label="Cached · no quota used"
          />
        )}
        {response.quota?.remaining != null && (
          <Chip
            size="small"
            variant="outlined"
            label={
              response.quota.limit != null
                ? `${response.quota.remaining} / ${response.quota.limit} calls left this month`
                : `${response.quota.remaining} calls left this month`
            }
          />
        )}
        {isLoading && <CircularProgress size={18} />}
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={2}>
        {publishers.map((publisher) => (
          <PublisherCard
            key={publisher}
            publisher={publisher}
            jobs={response.byPublisher[publisher] ?? []}
            onOpen={() => onOpenPublisher(publisher)}
          />
        ))}
      </Stack>
    </Box>
  );
}
