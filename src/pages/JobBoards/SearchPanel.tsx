import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
  FormControlLabel,
} from '@mui/material';
import {
  IconSearch,
  IconRotate,
  IconAdjustments,
  IconRefresh,
} from '@tabler/icons-react';
import { useJobBoardSearch } from '../../context/JobBoardSearchContext';
import { US_LOCATION_OPTIONS } from './usLocations';
import {
  DatePostedFilter,
  EmploymentTypeFilter,
} from '../../Interfaces/jobBoard';

/**
 * Read the current user's role(s) from localStorage to match the
 * convention used elsewhere in the codebase (see InterviewForm.tsx).
 * `role` is sometimes stored as a string ("super-admin") and sometimes
 * as an array — handle both.
 */
function readUserRoles(): string[] {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { role?: string | string[] };
    if (Array.isArray(parsed.role)) return parsed.role;
    if (typeof parsed.role === 'string') return [parsed.role];
    return [];
  } catch {
    return [];
  }
}

/**
 * The search bar at the top of the Job Boards page.
 *
 * Behaviour highlights:
 *   - Region locked to US (no country picker — see the chip).
 *   - Submit only — never search-as-you-type, since each call may burn a
 *     monthly-quota credit.
 *   - Reset clears state without triggering a refetch.
 *   - Admins see a "Force refresh" toggle that bypasses the server cache;
 *     other roles always read cache when fresh.
 */

const DATE_POSTED_OPTIONS: { value: DatePostedFilter; label: string }[] = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Past 24 hours' },
  { value: '3days', label: 'Past 3 days' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentTypeFilter; label: string }[] = [
  { value: 'FULLTIME', label: 'Full-time' },
  { value: 'CONTRACTOR', label: 'Contract' },
  { value: 'PARTTIME', label: 'Part-time' },
  { value: 'INTERN', label: 'Internship' },
];

export default function SearchPanel() {
  const { lastRequest, isLoading, search, reset } = useJobBoardSearch();
  const roles = readUserRoles();
  const isAdmin =
    roles.includes('admin') || roles.includes('super-admin');

  const [query, setQuery] = useState<string>(lastRequest?.query ?? '');
  const [location, setLocation] = useState<string>(lastRequest?.location ?? '');
  const [datePosted, setDatePosted] = useState<DatePostedFilter>(
    lastRequest?.datePosted ?? 'all',
  );
  const [employmentType, setEmploymentType] = useState<
    EmploymentTypeFilter | ''
  >(lastRequest?.employmentType ?? '');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(
    lastRequest?.remoteOnly ?? false,
  );
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);

  // Sync local form state with the persisted last-search after the page
  // hydrates from sessionStorage. Without this, an opened-fresh tab
  // would show empty inputs even though results are visible below.
  useEffect(() => {
    if (lastRequest) {
      setQuery(lastRequest.query);
      setLocation(lastRequest.location);
      setDatePosted(lastRequest.datePosted ?? 'all');
      setEmploymentType(lastRequest.employmentType ?? '');
      setRemoteOnly(lastRequest.remoteOnly ?? false);
    }
  }, [lastRequest]);

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    search({
      query: trimmed,
      location: location.trim(),
      datePosted,
      employmentType: employmentType || undefined,
      remoteOnly,
      forceRefresh: isAdmin && forceRefresh ? true : undefined,
    });
  };

  const handleReset = () => {
    setQuery('');
    setLocation('');
    setDatePosted('all');
    setEmploymentType('');
    setRemoteOnly(false);
    setForceRefresh(false);
    setShowAdvanced(false);
    reset();
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <TextField
          label="Job title, skill or company"
          placeholder="e.g. React Developer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', mr: 1, color: 'text.secondary' }}>
                <IconSearch size={18} />
              </Box>
            ),
          }}
        />

        <Autocomplete
          options={US_LOCATION_OPTIONS}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.label
          }
          value={
            US_LOCATION_OPTIONS.find((o) => o.value === location) ?? {
              label: location,
              value: location,
            }
          }
          onChange={(_, option) => {
            if (!option) {
              setLocation('');
              return;
            }
            setLocation(typeof option === 'string' ? option : option.value);
          }}
          freeSolo
          sx={{ minWidth: 240 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Location"
              size="small"
              placeholder="State, City, ST"
            />
          )}
        />

        <Tooltip title="Region locked to United States for now">
          <Chip
            label="US only"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        </Tooltip>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<IconSearch size={16} />}
            disabled={isLoading || query.trim().length === 0}
            sx={{ minHeight: 40, px: 2.5 }}
          >
            Search
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<IconRotate size={16} />}
            onClick={handleReset}
            disabled={isLoading}
            sx={{ minHeight: 40, px: 2 }}
          >
            Reset
          </Button>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mt: 1.5, flexWrap: 'wrap' }}
      >
        <Button
          type="button"
          size="small"
          startIcon={<IconAdjustments size={16} />}
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? 'Hide filters' : 'More filters'}
        </Button>
        {isAdmin && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
              />
            }
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconRefresh size={16} />
                <Typography variant="body2">
                  Force refresh (admin)
                </Typography>
              </Stack>
            }
          />
        )}
      </Stack>

      <Collapse in={showAdvanced} unmountOnExit>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mt: 2 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="date-posted-label">Date posted</InputLabel>
            <Select
              labelId="date-posted-label"
              label="Date posted"
              value={datePosted}
              onChange={(e) =>
                setDatePosted(e.target.value as DatePostedFilter)
              }
            >
              {DATE_POSTED_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="employment-label">Employment type</InputLabel>
            <Select
              labelId="employment-label"
              label="Employment type"
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(
                  (e.target.value as EmploymentTypeFilter) || '',
                )
              }
            >
              <MenuItem value="">Any</MenuItem>
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
            }
            label="Remote only"
          />
        </Stack>
      </Collapse>
    </Paper>
  );
}
