import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconDeviceFloppy,
  IconRefresh,
  IconSettings,
  IconX,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import {
  PerformanceRole,
  WeightsAuditEntry,
  WeightsBlock,
  WeightsResponse,
} from '../../Interfaces/performance';
import {
  getPerformanceWeights,
  resetPerformanceWeights,
  updatePerformanceWeights,
} from '../../services/performanceApi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a successful save/reset so the leaderboard reloads. */
  onSaved?: () => void;
}

export default function WeightsDrawer({ open, onClose, onSaved }: Props) {
  const [data, setData] = useState<WeightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<PerformanceRole>('marketing');
  const [local, setLocal] = useState<Record<PerformanceRole, Record<string, number>>>(
    { marketing: {}, support: {} }
  );
  const [dirty, setDirty] = useState<Record<PerformanceRole, boolean>>({
    marketing: false,
    support: false,
  });
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<PerformanceRole | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getPerformanceWeights();
        if (!cancelled && res.data?.data) {
          setData(res.data.data);
          setLocal({
            marketing: { ...res.data.data.marketing.weights },
            support: { ...res.data.data.support.weights },
          });
          setDirty({ marketing: false, support: false });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function patch(role: PerformanceRole, key: string, raw: string) {
    const n = Number(raw);
    setLocal((s) => ({
      ...s,
      [role]: { ...s[role], [key]: Number.isFinite(n) ? n : 0 },
    }));
    setDirty((d) => ({ ...d, [role]: true }));
  }

  async function handleSave(role: PerformanceRole) {
    setSaving(true);
    try {
      await updatePerformanceWeights({ role, weights: local[role] });
      toast.success(`${role === 'marketing' ? 'Marketing' : 'Support'} weights saved`);
      // Refetch so the audit log shows the new entry.
      const res = await getPerformanceWeights();
      if (res.data?.data) setData(res.data.data);
      setDirty((d) => ({ ...d, [role]: false }));
      onSaved?.();
    } catch {
      toast.error('Could not save weights');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(role: PerformanceRole) {
    try {
      await resetPerformanceWeights(role);
      toast.success(
        `${role === 'marketing' ? 'Marketing' : 'Support'} weights reset to defaults`
      );
      const res = await getPerformanceWeights();
      const fresh = res.data?.data;
      if (fresh) {
        setData(fresh);
        setLocal((s) => ({
          ...s,
          [role]: { ...fresh[role].weights },
        }));
        setDirty((d) => ({ ...d, [role]: false }));
      }
      setResetTarget(null);
      onSaved?.();
    } catch {
      toast.error('Could not reset');
    }
  }

  const activeBlock: WeightsBlock | undefined = data?.[tab];
  const activeLocal = local[tab];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 640,
          maxWidth: '100vw',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header band */}
      <Box
        sx={{
          position: 'relative',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          px: 3,
          pt: 2.25,
          pb: 2.25,
          overflow: 'hidden',
          borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gradients.pinkBlue,
          }}
        />
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSettings size={20} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.7),
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              SCORING · WEIGHTS
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              Edit the formula
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: '#fff',
              bgcolor: alpha('#fff', 0.1),
              '&:hover': { bgcolor: alpha('#fff', 0.18) },
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
      </Box>

      {/* Role tabs */}
      <Box sx={{ bgcolor: '#F6F9FC', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as PerformanceRole)}
          variant="fullWidth"
          sx={{
            minHeight: 46,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 46,
            },
            '& .Mui-selected': { color: tokens.colors.pinkDark },
            '& .MuiTabs-indicator': {
              bgcolor: tokens.colors.pink,
              height: 3,
              borderRadius: 3,
            },
          }}
        >
          <Tab value="marketing" label="Marketing" />
          <Tab value="support" label="Support" />
        </Tabs>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#FBFCFE' }}>
        {loading || !activeBlock ? (
          <Stack direction="row" justifyContent="center" py={6}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {Object.keys(activeBlock.defaults).map((k) => (
              <Stack
                key={k}
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {k}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.72rem' }}
                  >
                    default · {activeBlock.defaults[k]}
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={
                    activeLocal[k] !== undefined
                      ? String(activeLocal[k])
                      : String(activeBlock.weights[k] ?? activeBlock.defaults[k])
                  }
                  onChange={(e) => patch(tab, k, e.target.value)}
                  sx={{
                    width: 120,
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Stack>
            ))}

            {/* Audit log */}
            {activeBlock.audit?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: tokens.colors.lightTextSecondary,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '0.66rem',
                  }}
                >
                  Audit log
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {activeBlock.audit
                    .slice()
                    .reverse()
                    .slice(0, 25)
                    .map((entry, i) => (
                      <AuditEntry key={entry._id || i} entry={entry} />
                    ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Actions */}
      {!loading && activeBlock && (
        <Box
          sx={{
            bgcolor: '#fff',
            borderTop: '1px solid',
            borderColor: 'grey.200',
            px: 3,
            py: 1.75,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Tooltip title="Reset this role to factory defaults">
            <Button
              size="small"
              startIcon={<IconRefresh size={14} />}
              onClick={() => setResetTarget(tab)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: tokens.colors.lightText,
              }}
            >
              Reset to defaults
            </Button>
          </Tooltip>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>
              Close
            </Button>
            <Button
              variant="contained"
              disabled={!dirty[tab] || saving}
              onClick={() => handleSave(tab)}
              startIcon={
                saving ? (
                  <CircularProgress size={14} sx={{ color: '#fff' }} />
                ) : (
                  <IconDeviceFloppy size={16} />
                )
              }
              sx={{
                background: tokens.gradients.pinkBlue,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                },
              }}
            >
              {saving ? 'Saving' : `Save ${tab}`}
            </Button>
          </Stack>
        </Box>
      )}

      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={async () => {
          if (resetTarget) await handleReset(resetTarget);
        }}
        title="Reset to defaults?"
        description="All weights for this role return to shipped defaults. The change is audit-logged."
        confirmLabel="Reset"
        tone="warning"
      />
    </Drawer>
  );
}

function AuditEntry({ entry }: { entry: WeightsAuditEntry }) {
  const changedKeys = Object.keys({ ...entry.before, ...entry.after }).filter(
    (k) => entry.before[k] !== entry.after[k]
  );
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
        {entry.changedByName || 'Admin'}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {moment(entry.changedAt).format('MMM D, YYYY · HH:mm')}
        {entry.reason && ` · ${entry.reason}`}
      </Typography>
      <Stack
        direction="row"
        spacing={0.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 0.75 }}
      >
        {changedKeys.map((k) => (
          <Box
            key={k}
            sx={{
              px: 0.875,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.pink, 0.08),
              color: tokens.colors.pinkDark,
              fontSize: '0.68rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {k}: {entry.before[k] ?? '—'} → {entry.after[k] ?? '—'}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
