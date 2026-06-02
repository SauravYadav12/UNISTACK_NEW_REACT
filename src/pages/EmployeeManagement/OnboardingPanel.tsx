import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconRefresh,
  IconRocket,
  IconSettings,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import AddCandidateDialog from '../../components/onboarding/AddCandidateDialog';
import CandidateProgressCard from '../../components/onboarding/CandidateProgressCard';
import OnboardingCandidateDrawer from './OnboardingCandidateDrawer';
import OnboardingTemplateEditor from './OnboardingTemplateEditor';
import { listCandidates } from '../../services/onboardingApi';
import { OnboardingCandidateSummary } from '../../Interfaces/onboarding';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import { tokens } from '../../theme';

/**
 * Onboarding tab inside Employee Management.
 *
 * Restructured into:
 *   1. A 4-up stats strip (Total / In progress / Awaiting action /
 *      Onboarded) for at-a-glance health of the pipeline.
 *   2. A toolbar with the primary "Add candidate" CTA + reload +
 *      super-admin-only "Edit offer template".
 *   3. A "In progress" section with the candidate grid, plus
 *      separate collapsible "Onboarded" and "Rejected" buckets.
 *   4. A branded empty-state card (gradient icon + copy + CTA) when
 *      there's nothing in progress.
 */

export default function OnboardingPanel() {
  const { iUser } = useAuth();
  const isSuperAdmin = Boolean(iUser?.role?.includes(UserRole['super-admin']));

  const [candidates, setCandidates] = useState<OnboardingCandidateSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  // All three section buckets are collapsible. "In progress" defaults
  // to expanded because it's where day-to-day attention lands; the
  // Onboarded + Rejected archives default to collapsed so they don't
  // crowd the screen.
  const [showInProgress, setShowInProgress] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await listCandidates();
      setCandidates(data || []);
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

  // ── Bucketing for the stats strip + sections ─────────────────────
  // - In progress: anything not signed and not rejected.
  // - Awaiting admin action: stages where the candidate has handed
  //   the baton back to HR and needs HR to act next.
  // - Onboarded: fully signed.
  // - Rejected: terminal failure.
  const { active, completed, rejected, awaitingAdmin } = useMemo(() => {
    const a: OnboardingCandidateSummary[] = [];
    const c: OnboardingCandidateSummary[] = [];
    const r: OnboardingCandidateSummary[] = [];
    let waiting = 0;
    const ADMIN_NEXT_STAGES = new Set([
      'form-submitted',
      'info-requested',
      'bg-check',
      'bg-check-passed',
    ]);
    for (const cand of candidates) {
      if (cand.stage === 'rejected') r.push(cand);
      else if (cand.stage === 'offer-signed') c.push(cand);
      else {
        a.push(cand);
        if (ADMIN_NEXT_STAGES.has(cand.stage)) waiting++;
      }
    }
    return { active: a, completed: c, rejected: r, awaitingAdmin: waiting };
  }, [candidates]);

  const stats = [
    {
      label: 'Total candidates',
      value: candidates.length,
      icon: <IconUsers size={18} />,
      accent: tokens.colors.lightTextSecondary,
      bg: tokens.colors.lightSurfaceAlt,
    },
    {
      label: 'In progress',
      value: active.length,
      icon: <IconRocket size={18} />,
      accent: tokens.colors.pink,
      bg: alpha(tokens.colors.pink, 0.08),
    },
    {
      label: 'Awaiting your action',
      value: awaitingAdmin,
      icon: <IconAlertCircle size={18} />,
      accent: tokens.colors.warning,
      bg: alpha(tokens.colors.warning, 0.1),
    },
    {
      label: 'Onboarded',
      value: completed.length,
      icon: <IconUserCheck size={18} />,
      accent: tokens.colors.success,
      bg: alpha(tokens.colors.success, 0.1),
    },
  ];

  return (
    <Box>
      {/* ── Stats strip ─────────────────────────────────────────── */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {stats.map((s, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={s.label}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  height: '100%',
                  transition: 'border-color 0.18s',
                  '&:hover': { borderColor: alpha(s.accent, 0.45) },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: s.bg,
                    color: s.accent,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: tokens.colors.lightText,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: tokens.colors.lightTextSecondary,
                      fontWeight: 600,
                      letterSpacing: 0.3,
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{
          mb: 2.5,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(
            tokens.colors.pink,
            0.04,
          )} 0%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: tokens.colors.pink,
              mb: 0.25,
            }}
          >
            Pre-employee lifecycle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Initiate, track, and complete each candidate — form, background
            check, and signed offer all in one place.
          </Typography>
        </Box>
        {/* Toolbar order: primary CTA (Add candidate) first, then the
            secondary IconButton actions (template editor + reload). The
            template editor button is gated on super-admin and rendered
            as a gear icon to match the visual treatment of the reload
            button — both are utility actions, the CTA is the focus. */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            size="small"
            startIcon={<IconUserPlus size={16} />}
            onClick={() => setAddOpen(true)}
            sx={{ minHeight: 36 }}
          >
            Add candidate
          </Button>
          {isSuperAdmin && (
            <Tooltip title="Edit offer letter template">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setTemplateEditorOpen(true)}
                >
                  <IconSettings size={18} />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Reload">
            <span>
              <IconButton size="small" onClick={load} disabled={loading}>
                <IconRefresh size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {loading && (
        <Stack direction="row" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      )}

      {!loading && error && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(tokens.colors.error, 0.4),
            bgcolor: alpha(tokens.colors.error, 0.06),
            mb: 2,
          }}
        >
          <Typography color="error" variant="body2" fontWeight={600}>
            {error}
          </Typography>
        </Box>
      )}

      {!loading && !error && (
        <>
          {/* ── In progress section ─────────────────────────── */}
          <CollapsibleSectionTitle
            accent={tokens.colors.pink}
            label="In progress"
            count={active.length}
            icon={<IconRocket size={14} />}
            open={showInProgress}
            onToggle={() => setShowInProgress((x) => !x)}
          />
          <Collapse in={showInProgress} unmountOnExit>
            <Box sx={{ mt: 1 }}>
              {active.length === 0 ? (
                <EmptyHero />
              ) : (
                <Grid container spacing={2}>
                  {active.map((c) => (
                    <Grid key={c._id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <CandidateProgressCard
                        candidate={c}
                        onClick={() => setOpenCandidateId(c._id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Collapse>

          {/* ── Onboarded section ───────────────────────────── */}
          {completed.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <CollapsibleSectionTitle
                accent={tokens.colors.success}
                label="Onboarded"
                count={completed.length}
                icon={<IconUserCheck size={14} />}
                open={showCompleted}
                onToggle={() => setShowCompleted((x) => !x)}
              />
              <Collapse in={showCompleted} unmountOnExit>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {completed.map((c) => (
                    <Grid key={c._id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <CandidateProgressCard
                        candidate={c}
                        onClick={() => setOpenCandidateId(c._id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </Box>
          )}

          {/* ── Rejected section ────────────────────────────── */}
          {rejected.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <CollapsibleSectionTitle
                accent={tokens.colors.error}
                label="Rejected"
                count={rejected.length}
                icon={<IconClock size={14} />}
                open={showRejected}
                onToggle={() => setShowRejected((x) => !x)}
              />
              <Collapse in={showRejected} unmountOnExit>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {rejected.map((c) => (
                    <Grid key={c._id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <CandidateProgressCard
                        candidate={c}
                        onClick={() => setOpenCandidateId(c._id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </Box>
          )}
        </>
      )}

      <AddCandidateDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={load}
      />

      <OnboardingCandidateDrawer
        candidateId={openCandidateId}
        onClose={() => {
          setOpenCandidateId(null);
          load();
        }}
      />

      <OnboardingTemplateEditor
        open={templateEditorOpen}
        onClose={() => setTemplateEditorOpen(false)}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components

function CollapsibleSectionTitle({
  accent,
  label,
  count,
  icon,
  open,
  onToggle,
}: {
  accent: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      onClick={onToggle}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { '& .chevron': { color: accent } },
      }}
    >
      <Box
        className="chevron"
        sx={{
          color: tokens.colors.lightTextSecondary,
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
      >
        {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
      </Box>
      <Box sx={{ width: 14, height: 4, bgcolor: accent, borderRadius: 2 }} />
      {icon && (
        <Box sx={{ color: accent, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      )}
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: tokens.colors.lightText,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          fontSize: 10.5,
          fontWeight: 800,
          color: accent,
          bgcolor: alpha(accent, 0.1),
          borderRadius: 1.5,
          px: 0.85,
          py: 0.15,
          letterSpacing: 0.5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </Box>
    </Stack>
  );
}

function EmptyHero() {
  // No inline CTA — the "Add candidate" button lives in the toolbar
  // above the grid, so a second one here would be redundant.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        sx={{
          py: 5,
          px: 3,
          borderRadius: 4,
          border: '1px dashed',
          borderColor: alpha(tokens.colors.pink, 0.25),
          background: `linear-gradient(135deg, ${alpha(
            tokens.colors.pink,
            0.04,
          )} 0%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tokens.gradients.brand,
            color: '#fff',
            boxShadow: tokens.shadows.glow,
          }}
        >
          <IconUserPlus size={28} />
        </Box>
        <Typography fontWeight={800} sx={{ fontSize: 16 }}>
          No candidates in flight
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 420 }}
        >
          Use the <strong>Add candidate</strong> button above to start
          onboarding a new hire — they'll get an email with a link to
          fill their details, and you can track every step from here.
        </Typography>
      </Box>
    </motion.div>
  );
}
