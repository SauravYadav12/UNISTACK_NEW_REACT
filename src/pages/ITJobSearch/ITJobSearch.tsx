import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
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
  alpha,
  Link,
  MenuItem,
} from '@mui/material';
import {
  IconBriefcase,
  IconRefresh,
  IconMailDown,
  IconExternalLink,
  IconUser,
  IconPhone,
  IconMail,
  IconWorldSearch,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import { SourcedJob, SourcedJobStatus } from '../../Interfaces/sourcedJob';
import {
  listSourcedJobs,
  runEmailIngest,
  runJsearchIngest,
} from '../../services/itJobSearchApi';
import ReviewJobDrawer from './ReviewJobDrawer';

const MotionBox = motion.create(Box);

export default function ITJobSearch() {
  const [status, setStatus] = useState<SourcedJobStatus | 'all'>('pending');
  const [source, setSource] = useState<'all' | 'email' | 'jsearch'>('all');
  const [onlyContact, setOnlyContact] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<SourcedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [selected, setSelected] = useState<SourcedJob | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSourcedJobs({
        status,
        source: source === 'all' ? undefined : source,
        hasVendorContact: onlyContact || undefined,
        q: q.trim() || undefined,
        limit: 100,
      });
      setRows(res.data.data.results || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, source, onlyContact, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0); // debounce search
    return () => clearTimeout(t);
  }, [load, q]);

  async function handleIngest() {
    setIngesting(true);
    try {
      const res = await runEmailIngest();
      const d = res.data.data as Record<string, number | boolean>;
      if (d.enabled === false) {
        toast.info('Email ingestion is not configured (GMAIL_USER / APP_PASSWORD).');
      } else {
        toast.success(
          `Inbox scan done — ${d.created || 0} new, ${d.duplicates || 0} dup, ${d.failed || 0} failed.`
        );
      }
      load();
    } catch {
      toast.error('Could not scan the inbox.');
    } finally {
      setIngesting(false);
    }
  }

  async function handleBoardSearch() {
    setBoarding(true);
    try {
      const res = await runJsearchIngest();
      const d = res.data.data as Record<string, number | boolean>;
      if (d.enabled === false) {
        toast.info('Job-board search is not configured (JSEARCH_RAPIDAPI_KEY).');
      } else if (d.quotaExceeded) {
        toast.warning(
          `Hit the job-board API quota — ${d.created || 0} added before stopping.`
        );
      } else {
        toast.success(
          `Job boards scanned — ${d.created || 0} new, ${d.duplicates || 0} dup, ${d.prefiltered || 0} filtered out.`
        );
      }
      load();
    } catch {
      toast.error('Could not search the job boards.');
    } finally {
      setBoarding(false);
    }
  }

  const removeFromList = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

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
                {total} {status === 'pending' ? 'to review' : status} · remote US IT roles from the inbox
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={handleBoardSearch}
              disabled={boarding || ingesting}
              startIcon={boarding ? <CircularProgress size={16} color="inherit" /> : <IconWorldSearch size={18} />}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#fff', borderColor: alpha('#fff', 0.4), '&:hover': { borderColor: '#fff', background: alpha('#fff', 0.08) } }}
            >
              {boarding ? 'Searching boards…' : 'Search job boards'}
            </Button>
            <Button
              variant="contained"
              onClick={handleIngest}
              disabled={ingesting || boarding}
              startIcon={ingesting ? <CircularProgress size={16} color="inherit" /> : <IconMailDown size={18} />}
              sx={{ textTransform: 'none', fontWeight: 700, background: tokens.gradients.pinkBlue, boxShadow: 'none', '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' } }}
            >
              {ingesting ? 'Scanning inbox…' : 'Refresh from inbox'}
            </Button>
          </Stack>
        </Stack>
      </MotionBox>

      {/* Filters */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          onChange={(_, v) => v && setStatus(v)}
        >
          <ToggleButton value="pending" sx={{ textTransform: 'none', fontWeight: 700 }}>Pending</ToggleButton>
          <ToggleButton value="approved" sx={{ textTransform: 'none', fontWeight: 700 }}>Approved</ToggleButton>
          <ToggleButton value="rejected" sx={{ textTransform: 'none', fontWeight: 700 }}>Rejected</ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: 'none', fontWeight: 700 }}>All</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            select
            size="small"
            value={source}
            onChange={(e) => setSource(e.target.value as 'all' | 'email' | 'jsearch')}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All sources</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="jsearch">Job boards</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Switch size="small" checked={onlyContact} onChange={(e) => setOnlyContact(e.target.checked)} />}
            label={<Typography variant="body2">Has vendor contact</Typography>}
          />
          <TextField size="small" placeholder="Search title / company / tech" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240 }} />
          <Tooltip title="Reload">
            <IconButton size="small" onClick={load} disabled={loading}>
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
          <Typography>No {status === 'all' ? '' : status} jobs. Try "Refresh from inbox".</Typography>
        </Box>
      ) : (
        <Stack spacing={1.25}>
          {rows.map((j) => (
            <JobCard key={j._id} job={j} onClick={() => setSelected(j)} />
          ))}
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

          {/* vendor contact preview — the hot info */}
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
