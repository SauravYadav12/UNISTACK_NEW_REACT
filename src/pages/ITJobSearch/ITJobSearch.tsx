import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Pagination,
  alpha,
  Link,
} from '@mui/material';
import {
  IconBriefcase,
  IconRefresh,
  IconInbox,
  IconExternalLink,
  IconUser,
  IconPhone,
  IconMail,
  IconWorldSearch,
  IconRss,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import { SourcedJob, SourcedJobStatus } from '../../Interfaces/sourcedJob';
import {
  listSourcedJobs,
  runJsearchIngest,
  runFeedIngest,
} from '../../services/itJobSearchApi';
import ReviewJobDrawer from './ReviewJobDrawer';

const MotionBox = motion.create(Box);
const LIMIT = 50; // records per page
const AUTO_REFRESH_MS = 15000; // silent poll so new positions appear on their own

type SourceKey = 'email' | 'jsearch' | 'feed';
const TABS: { key: SourceKey; label: string; icon: JSX.Element }[] = [
  { key: 'email', label: 'Inbox', icon: <IconInbox size={18} /> },
  { key: 'jsearch', label: 'Job Boards', icon: <IconWorldSearch size={18} /> },
  { key: 'feed', label: 'Remote Feeds', icon: <IconRss size={18} /> },
];

export default function ITJobSearch() {
  const [tab, setTab] = useState<SourceKey>('email');
  const [status, setStatus] = useState<SourcedJobStatus | 'all'>('pending');
  const [onlyContact, setOnlyContact] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SourcedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [selected, setSelected] = useState<SourcedJob | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await listSourcedJobs({
          status,
          source: tab,
          hasVendorContact: onlyContact || undefined,
          q: q.trim() || undefined,
          page,
          limit: LIMIT,
        });
        setRows(res.data.data.results || []);
        setTotal(res.data.data.total || 0);
      } catch {
        if (!silent) setRows([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [tab, status, onlyContact, q, page]
  );

  // Load on any filter change (debounced while typing a search).
  useEffect(() => {
    const t = setTimeout(() => load(false), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  // Auto-refresh: silently re-pull the current view so freshly-ingested
  // positions (inbox IDLE, background board/feed runs) appear on their own.
  useEffect(() => {
    const id = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Any change of tab / status / filters returns to the first page.
  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  // A background run streams results in — nudge a few silent refreshes.
  const burstRefresh = () => {
    [4000, 10000, 20000, 35000].forEach((ms) => setTimeout(() => load(true), ms));
  };

  async function handleBoardSearch() {
    setBoarding(true);
    try {
      const res = await runJsearchIngest();
      const d = res.data.data as unknown as { alreadyRunning?: boolean };
      toast.info(
        d.alreadyRunning
          ? 'A job-board search is already running — results will appear here.'
          : 'Searching job boards… new roles will appear here as they are found.'
      );
      burstRefresh();
    } catch {
      toast.error('Could not start the job-board search.');
    } finally {
      // Keep the button disabled briefly so it isn't spammed (the server
      // also guards against overlapping runs).
      setTimeout(() => setBoarding(false), 20000);
    }
  }

  async function handleFeedPull() {
    setFeeding(true);
    try {
      const res = await runFeedIngest();
      const d = res.data.data as unknown as { alreadyRunning?: boolean };
      toast.info(
        d.alreadyRunning
          ? 'A feed pull is already running — results will appear here.'
          : 'Pulling remote feeds… new roles will appear here as they are found.'
      );
      burstRefresh();
    } catch {
      toast.error('Could not start the feed pull.');
    } finally {
      setTimeout(() => setFeeding(false), 20000);
    }
  }

  const removeFromList = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Box>
      {/* Hero */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.gradients.pinkBlue }}>
              <IconBriefcase size={22} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>IT Job Search</Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.65) }}>
                {total} {status === 'pending' ? 'to review' : status} · {TABS.find((t) => t.key === tab)?.label}
              </Typography>
            </Box>
          </Stack>

          {/* Contextual action per source */}
          {tab === 'email' && (
            <Chip
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.colors.success, ml: 1 }} />}
              label="Auto-updating · real-time"
              sx={{ color: '#fff', bgcolor: alpha('#fff', 0.12), fontWeight: 600 }}
            />
          )}
          {tab === 'jsearch' && (
            <Button
              variant="contained"
              onClick={handleBoardSearch}
              disabled={boarding}
              startIcon={boarding ? <CircularProgress size={16} color="inherit" /> : <IconWorldSearch size={18} />}
              sx={{ textTransform: 'none', fontWeight: 700, background: tokens.gradients.pinkBlue, boxShadow: 'none', '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' } }}
            >
              {boarding ? 'Searching…' : 'Search job boards'}
            </Button>
          )}
          {tab === 'feed' && (
            <Button
              variant="contained"
              onClick={handleFeedPull}
              disabled={feeding}
              startIcon={feeding ? <CircularProgress size={16} color="inherit" /> : <IconRss size={18} />}
              sx={{ textTransform: 'none', fontWeight: 700, background: tokens.gradients.pinkBlue, boxShadow: 'none', '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' } }}
            >
              {feeding ? 'Pulling…' : 'Pull remote feeds'}
            </Button>
          )}
        </Stack>
      </MotionBox>

      {/* Source tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => resetTo(() => setTab(v))}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 48 } }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} icon={t.icon} iconPosition="start" label={t.label} />
        ))}
      </Tabs>

      {/* Filters */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          onChange={(_, v) => v && resetTo(() => setStatus(v))}
        >
          <ToggleButton value="pending" sx={{ textTransform: 'none', fontWeight: 700 }}>Pending</ToggleButton>
          <ToggleButton value="approved" sx={{ textTransform: 'none', fontWeight: 700 }}>Approved</ToggleButton>
          <ToggleButton value="rejected" sx={{ textTransform: 'none', fontWeight: 700 }}>Rejected</ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: 'none', fontWeight: 700 }}>All</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControlLabel
            control={<Switch size="small" checked={onlyContact} onChange={(e) => resetTo(() => setOnlyContact(e.target.checked))} />}
            label={<Typography variant="body2">Has vendor contact</Typography>}
          />
          <TextField size="small" placeholder="Search title / company / tech" value={q} onChange={(e) => resetTo(() => setQ(e.target.value))} sx={{ minWidth: 240 }} />
          <Tooltip title="Reload now">
            <IconButton size="small" onClick={() => load(false)} disabled={loading}>
              <IconRefresh size={18} className={loading ? 'sync-icon-loading' : ''} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Cards */}
      {loading && rows.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={28} /></Box>
      ) : rows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>
            {tab === 'email'
              ? 'No positions yet — new inbox jobs appear here automatically.'
              : tab === 'jsearch'
                ? 'No job-board results yet. Try "Search job boards".'
                : 'No feed results yet. Try "Pull remote feeds".'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.25}>
          {rows.map((j) => (
            <JobCard key={j._id} job={j} onClick={() => setSelected(j)} />
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </Typography>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
            siblingCount={1}
          />
        </Stack>
      )}

      <ReviewJobDrawer
        job={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onResolved={removeFromList}
      />
    </Box>
  );
}

function JobCard({ job, onClick }: { job: SourcedJob; onClick: () => void }) {
  const company =
    job.clientCompany || job.vendorCompany || job.primeVendorCompany || '—';
  const contactName = job.vendorPersonName || job.primeVendorName;
  const contactEmail = job.vendorEmail || job.primeVendorEmail;
  const contactPhone = job.vendorPhone || job.primeVendorPhone;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: job.hasVendorContact ? alpha(tokens.colors.success, 0.35) : 'divider',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'box-shadow .2s, border-color .2s',
        '&:hover': { boxShadow: `0 6px 24px ${alpha(tokens.colors.blue, 0.12)}` },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={700} noWrap>{job.jobTitle || 'Untitled role'}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {company}{job.primaryTech ? ` · ${job.primaryTech}` : ''}
          </Typography>

          {job.hasVendorContact && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
              {contactName && <Mini icon={<IconUser size={13} />} text={contactName} />}
              {contactEmail && <Mini icon={<IconMail size={13} />} text={contactEmail} />}
              {contactPhone && <Mini icon={<IconPhone size={13} />} text={contactPhone} />}
            </Stack>
          )}
        </Box>

        <Stack spacing={0.75} alignItems={{ sm: 'flex-end' }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent={{ sm: 'flex-end' }}>
            {job.hasVendorContact && <Chip size="small" label="Vendor contact" color="success" />}
            {job.is100Remote && <Chip size="small" label="100% Remote" sx={{ bgcolor: alpha(tokens.colors.success, 0.15), color: tokens.colors.success, fontWeight: 600 }} />}
            {job.workAuth === 'usc-gc-ok' && <Chip size="small" label="USC/GC" sx={{ bgcolor: alpha(tokens.colors.blue, 0.12), color: tokens.colors.blueDark, fontWeight: 600 }} />}
            {job.workAuth === 'needs-sponsorship' && <Chip size="small" label="Sponsorship" sx={{ bgcolor: alpha(tokens.colors.error, 0.12), color: tokens.colors.error, fontWeight: 600 }} />}
            <Chip size="small" variant="outlined" label={job.sourceName || job.source} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {moment(job.receivedAt).fromNow()}
            </Typography>
            {job.jobPortalLink && (
              <Link href={job.jobPortalLink} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} sx={{ display: 'inline-flex' }}>
                <IconExternalLink size={14} />
              </Link>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

function Mini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: tokens.colors.lightTextSecondary }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{text}</Typography>
    </Stack>
  );
}
