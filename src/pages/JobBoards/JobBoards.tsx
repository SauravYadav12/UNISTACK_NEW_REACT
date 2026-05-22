import { useState } from 'react';
import { Box, Stack, Typography, Alert, AlertTitle } from '@mui/material';
import SearchPanel from './SearchPanel';
import ResultsGrid from './ResultsGrid';
import BoardJobsDrawer from './BoardJobsDrawer';
import JobDetailDialog from './JobDetailDialog';
import { useJobBoardSearch } from '../../context/JobBoardSearchContext';
import { NormalizedJob } from '../../Interfaces/jobBoard';

/**
 * Job Boards — unified search across multiple US job boards.
 *
 * One search bar feeds the server, which fans out to a single aggregator
 * (JSearch) and caches identical queries org-wide. Results are grouped
 * by publisher into cards; clicking a card opens a drawer with the full
 * list for that board; clicking a job opens a modal with full details.
 *
 * The provider lives one level up (in App.tsx) so the drawer + dialog
 * always read the same state — no refetch on navigation.
 */
export default function JobBoards() {
  const { response, error } = useJobBoardSearch();

  const [activePublisher, setActivePublisher] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<NormalizedJob | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Job Boards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search across major US job boards from one place. Click a board
            card to see all its results.
          </Typography>
        </Box>
      </Stack>

      <SearchPanel />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Search failed</AlertTitle>
          {error}
        </Alert>
      )}

      {response?.quotaExceeded && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Monthly search quota reached</AlertTitle>
          We've hit the free-tier limit for the aggregator this month.
          Cached results from earlier searches still work. The quota resets
          at the start of next month.
        </Alert>
      )}

      <ResultsGrid
        onOpenPublisher={(publisher) => setActivePublisher(publisher)}
      />

      <BoardJobsDrawer
        publisher={activePublisher}
        onClose={() => setActivePublisher(null)}
        onSelectJob={(job) => setActiveJob(job)}
      />

      <JobDetailDialog
        job={activeJob}
        onClose={() => setActiveJob(null)}
      />
    </Box>
  );
}
