import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconCalendarTime,
  IconExternalLink,
  IconHistory,
  IconRefresh,
  IconUserOff,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import moment from 'moment';

import GenerateBackdatedOnboardingDialog from '../../components/onboarding/GenerateBackdatedOnboardingDialog';
import OnboardingCandidateDrawer from './OnboardingCandidateDrawer';
import { listCandidates } from '../../services/onboardingApi';
import { OnboardingCandidateSummary } from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

const MotionBox = motion.create(Box);

/**
 * Super-admin tab for digitising paper onboarding paperwork of
 * legacy / pre-portal employees. Lists previously-generated backdated
 * records and exposes the "Generate" CTA that opens the dialog.
 *
 * The records are real OnboardingCandidate documents (stage =
 * 'onboarded', isBackdated = true) so they render in the same admin
 * drawer + the employee's My Documents → Onboarding tab as any other.
 */
export default function BackdatedOnboardingPanel() {
  const [rows, setRows] = useState<OnboardingCandidateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await listCandidates({ backdated: true });
      setRows(data || []);
    } catch (e) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
          (e as Error)?.message ||
          'Failed to load.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Box>
      {/* Toolbar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            Backdated onboarding records
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Digitised paperwork for legacy / pre-portal employees. Each record
            surfaces in the employee&rsquo;s My Documents tab automatically.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Reload">
            <IconButton
              size="small"
              onClick={load}
              disabled={loading}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <IconRefresh size={16} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<IconHistory size={16} />}
            onClick={() => setGenerateOpen(true)}
            sx={{
              textTransform: 'none',
              bgcolor: tokens.colors.pink,
              '&:hover': {
                bgcolor: tokens.colors.pink,
                filter: 'brightness(0.92)',
              },
            }}
          >
            Generate backdated onboarding
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.error, 0.08),
            border: `1px solid ${alpha(tokens.colors.error, 0.3)}`,
            color: tokens.colors.error,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <EmptyState onGenerate={() => setGenerateOpen(true)} />
      ) : (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {rows.map((r, idx) => (
            <Box key={r._id}>
              {idx > 0 && <Divider />}
              <BackdatedRow row={r} onView={() => setOpenCandidateId(r._id)} />
            </Box>
          ))}
        </Box>
      )}

      <GenerateBackdatedOnboardingDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onCreated={load}
      />

      <OnboardingCandidateDrawer
        candidateId={openCandidateId}
        onClose={() => {
          setOpenCandidateId(null);
          load();
        }}
      />
    </Box>
  );
}

interface RowProps {
  row: OnboardingCandidateSummary;
  onView: () => void;
}

function BackdatedRow({ row, onView }: RowProps) {
  const fullName = `${row.firstName} ${row.lastName}`.trim();
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ px: 2, py: 1.5 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.blue, 0.1),
            color: tokens.colors.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconCalendarTime size={20} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
            {fullName} · {row.candId}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.position} · {row.email}
          </Typography>
        </Box>
      </Stack>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Joined
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
            {row.proposedStartDate
              ? moment(row.proposedStartDate).format('DD MMM YYYY')
              : '—'}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconExternalLink size={14} />}
          onClick={onView}
          sx={{ textTransform: 'none' }}
        >
          View docs
        </Button>
      </Stack>
    </Stack>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        borderRadius: 4,
        bgcolor: alpha(tokens.colors.blue, 0.04),
        border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: alpha(tokens.colors.blue, 0.12),
          color: tokens.colors.blue,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <IconUserOff size={28} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>
        No backdated records yet
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}
      >
        Generate digital copies of paper onboarding paperwork for legacy
        employees so their offer letter and policy documents appear in their My
        Documents tab.
      </Typography>
      <Button
        variant="contained"
        startIcon={<IconHistory size={16} />}
        onClick={onGenerate}
        sx={{
          textTransform: 'none',
          bgcolor: tokens.colors.pink,
          '&:hover': {
            bgcolor: tokens.colors.pink,
            filter: 'brightness(0.92)',
          },
        }}
      >
        Generate backdated onboarding
      </Button>
    </MotionBox>
  );
}
