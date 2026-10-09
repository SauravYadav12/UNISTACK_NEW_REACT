import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Link,
  alpha,
} from '@mui/material';
import {
  IconCheck,
  IconX,
  IconDeviceFloppy,
  IconExternalLink,
  IconAlertTriangleFilled,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { tokens } from '../../theme/theme';
import { SourcedJob, SourcedJobEditable } from '../../Interfaces/sourcedJob';
import {
  updateSourcedJob,
  approveSourcedJob,
  rejectSourcedJob,
} from '../../services/itJobSearchApi';

interface Props {
  job: SourcedJob | null;
  open: boolean;
  onClose: () => void;
  onResolved: (id: string) => void; // approved or rejected → remove from queue
}

const STRING_FIELDS: Array<[keyof SourcedJobEditable, string]> = [
  ['jobTitle', 'Job Title'],
  ['employementType', 'Employment Type'],
  ['primaryTech', 'Primary Tech'],
  ['secondaryTech', 'Secondary Tech'],
  ['primaryTechStack', 'Primary Tech Stack'],
  ['reqKeywords', 'Keywords'],
  ['jobPortalLink', 'Job Post URL'],
];
const ARRAY_FIELDS: Array<[keyof SourcedJobEditable, string]> = [
  ['rate', 'Rate'],
  ['remote', 'Remote'],
  ['taxType', 'Tax Type'],
  ['duration', 'Duration'],
];
const VENDOR_FIELDS: Array<[keyof SourcedJobEditable, string]> = [
  ['vendorCompany', 'Vendor Company'],
  ['vendorPersonName', 'Vendor Contact'],
  ['vendorEmail', 'Vendor Email'],
  ['vendorPhone', 'Vendor Phone'],
];
const PRIME_FIELDS: Array<[keyof SourcedJobEditable, string]> = [
  ['primeVendorCompany', 'Prime Vendor Company'],
  ['primeVendorName', 'Prime Vendor Contact'],
  ['primeVendorEmail', 'Prime Vendor Email'],
  ['primeVendorPhone', 'Prime Vendor Phone'],
];
const CLIENT_FIELDS: Array<[keyof SourcedJobEditable, string]> = [
  ['clientCompany', 'Client Company'],
  ['clientPerson', 'Client Contact'],
  ['clientEmail', 'Client Email'],
  ['clientPhone', 'Client Phone'],
  ['clientAddress', 'Client Location'],
];

export default function ReviewJobDrawer({ job, open, onClose, onResolved }: Props) {
  const [form, setForm] = useState<SourcedJobEditable>({});
  const [busy, setBusy] = useState<'save' | 'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!job) return;
    const next: SourcedJobEditable = {};
    const src = job as unknown as Record<string, unknown>;
    [...STRING_FIELDS, ...VENDOR_FIELDS, ...PRIME_FIELDS, ...CLIENT_FIELDS].forEach(
      ([k]) => {
        (next as Record<string, unknown>)[k as string] =
          (src[k as string] as string) ?? '';
      }
    );
    ARRAY_FIELDS.forEach(([k]) => {
      (next as Record<string, unknown>)[k as string] =
        (src[k as string] as string[] | undefined) ?? [];
    });
    next.jobDescription = job.jobDescription ?? '';
    setForm(next);
  }, [job]);

  const setStr = (k: keyof SourcedJobEditable, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setArr = (k: keyof SourcedJobEditable, v: string) =>
    setForm((f) => ({
      ...f,
      [k]: v.split(',').map((s) => s.trim()).filter(Boolean),
    }));

  async function persist(): Promise<boolean> {
    if (!job) return false;
    try {
      await updateSourcedJob(job._id, form);
      return true;
    } catch {
      toast.error('Could not save edits');
      return false;
    }
  }

  async function handleSave() {
    setBusy('save');
    const ok = await persist();
    setBusy(null);
    if (ok) toast.success('Saved');
  }

  async function handleApprove() {
    if (!job) return;
    setBusy('approve');
    // Save edits first so the created Requirement reflects the final fields.
    const ok = await persist();
    if (!ok) {
      setBusy(null);
      return;
    }
    try {
      await approveSourcedJob(job._id);
      toast.success('Approved → moved to Requirements');
      onResolved(job._id);
      onClose();
    } catch {
      toast.error('Approve failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!job) return;
    setBusy('reject');
    try {
      await rejectSourcedJob(job._id);
      toast.info('Rejected');
      onResolved(job._id);
      onClose();
    } catch {
      toast.error('Reject failed');
    } finally {
      setBusy(null);
    }
  }

  const missingUrl = useMemo(
    () => !job?.hasVendorContact && !form.jobPortalLink,
    [job, form.jobPortalLink]
  );

  if (!job) return null;

  const field = ([k, label]: [keyof SourcedJobEditable, string]) => (
    <TextField
      key={k as string}
      label={label}
      size="small"
      fullWidth
      value={(form[k] as string) ?? ''}
      onChange={(e) => setStr(k, e.target.value)}
    />
  );

  return (
    <CustomDrawer open={open} onClose={onClose} title="Review job" closeOnOutSideClick>
      <Stack spacing={2.5} sx={{ pb: 10 }}>
        {/* classification chips */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <SourceBadge name={job.sourceName} />
          {job.hasVendorContact && (
            <Chip size="small" label="Has vendor contact" color="success" />
          )}
          <Chip
            size="small"
            label={job.is100Remote ? '100% Remote' : 'Not 100% remote'}
            sx={{ bgcolor: alpha(job.is100Remote ? tokens.colors.success : '#94A3B8', 0.15) }}
          />
          <Chip size="small" label={job.isTechnical ? 'IT' : 'Non-IT'} sx={{ bgcolor: alpha(tokens.colors.blue, 0.12) }} />
          <AuthChip auth={job.workAuth} />
          {typeof job.confidence === 'number' && (
            <Chip size="small" variant="outlined" label={`conf ${Math.round(job.confidence * 100)}%`} />
          )}
          <Chip size="small" variant="outlined" label={moment(job.receivedAt).format('MMM D, h:mm A')} />
        </Stack>

        {missingUrl && (
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha('#F59E0B', 0.12), display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconAlertTriangleFilled size={16} color="#B45309" />
            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>
              No vendor contact and no job-post URL — add the URL so a human can find the vendor.
            </Typography>
          </Box>
        )}

        <Section title="Job">
          {STRING_FIELDS.map(field)}
        </Section>

        <Section title="Commercial">
          {ARRAY_FIELDS.map(([k, label]) => (
            <TextField
              key={k as string}
              label={`${label} (comma-separated)`}
              size="small"
              fullWidth
              value={((form[k] as string[]) || []).join(', ')}
              onChange={(e) => setArr(k, e.target.value)}
            />
          ))}
        </Section>

        <Section title="Vendor contact" accent={tokens.colors.pink}>
          {VENDOR_FIELDS.map(field)}
        </Section>
        <Section title="Prime vendor">{PRIME_FIELDS.map(field)}</Section>
        <Section title="Client">{CLIENT_FIELDS.map(field)}</Section>

        <Section title="Description">
          <TextField
            label="Job Description"
            size="small"
            fullWidth
            multiline
            minRows={4}
            maxRows={14}
            value={(form.jobDescription as string) ?? ''}
            onChange={(e) => setStr('jobDescription', e.target.value)}
          />
        </Section>

        {job.jobPortalLink && (
          <Link href={job.jobPortalLink} target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}>
            <IconExternalLink size={14} /> Open job post
          </Link>
        )}
      </Stack>

      {/* sticky action bar */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          mt: -8,
          py: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={handleSave}
          disabled={!!busy}
          startIcon={busy === 'save' ? <CircularProgress size={14} /> : <IconDeviceFloppy size={16} />}
          sx={{ textTransform: 'none' }}
        >
          Save
        </Button>
        <Button
          color="error"
          variant="outlined"
          onClick={handleReject}
          disabled={!!busy}
          startIcon={busy === 'reject' ? <CircularProgress size={14} /> : <IconX size={16} />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleApprove}
          disabled={!!busy}
          startIcon={busy === 'approve' ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={16} />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Approve → Requirement
        </Button>
      </Box>
    </CustomDrawer>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: accent || tokens.colors.lightTextSecondary,
        }}
      >
        {title}
      </Typography>
      <Divider sx={{ mt: 0.5, mb: 1.25 }} />
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}

function SourceBadge({ name }: { name?: string }) {
  return (
    <Chip
      size="small"
      label={name || 'source'}
      sx={{ bgcolor: alpha(tokens.colors.blueDark, 0.1), color: tokens.colors.blueDark, fontWeight: 600 }}
    />
  );
}

function AuthChip({ auth }: { auth: SourcedJob['workAuth'] }) {
  const map: Record<SourcedJob['workAuth'], { label: string; color: string }> = {
    'usc-gc-ok': { label: 'USC/GC ok', color: tokens.colors.success },
    'needs-sponsorship': { label: 'Sponsorship', color: tokens.colors.error },
    unknown: { label: 'Auth: unknown', color: '#94A3B8' },
  };
  const c = map[auth] || map.unknown;
  return <Chip size="small" label={c.label} sx={{ bgcolor: alpha(c.color, 0.15), color: c.color, fontWeight: 600 }} />;
}
