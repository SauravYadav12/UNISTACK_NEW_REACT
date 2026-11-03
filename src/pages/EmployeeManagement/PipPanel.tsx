import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { IconTarget, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { Pip } from '../../Interfaces/pip';
import { listPips } from '../../services/pipApi';
import { errMsg } from '../../components/pip/pipStatus';
import PipCard from '../../components/pip/PipCard';
import CreatePipWizardDialog from '../../components/pip/CreatePipWizardDialog';
import PipDetailDialog from '../../components/pip/PipDetailDialog';

type StatusTab = 'active' | 'successful' | 'failed' | 'removed';

export default function PipPanel() {
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [pips, setPips] = useState<Pip[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState<Pip | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPips(await listPips());
    } catch (e) {
      toast.error(errMsg(e, 'Failed to load PIPs.'));
      setPips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Active tab holds both drafts and live/active PIPs.
  const buckets = useMemo(() => {
    const active = pips.filter((p) => p.status === 'draft' || p.status === 'active');
    const successful = pips.filter((p) => p.status === 'successful');
    const failed = pips.filter((p) => p.status === 'failed');
    const removed = pips.filter((p) => p.status === 'removed');
    return { active, successful, failed, removed };
  }, [pips]);

  const current = buckets[statusTab];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Tabs
          value={statusTab}
          onChange={(_, v) => setStatusTab(v)}
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 700 } }}
        >
          <Tab value="active" label={`Active (${buckets.active.length})`} />
          <Tab value="successful" label={`Successful (${buckets.successful.length})`} />
          <Tab value="failed" label={`Failed (${buckets.failed.length})`} />
          <Tab value="removed" label={`Removed (${buckets.removed.length})`} />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => setWizardOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          New
        </Button>
      </Stack>

      {loading && pips.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : current.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <IconTarget size={40} style={{ opacity: 0.4 }} />
          <Typography sx={{ mt: 1 }}>
            {statusTab === 'active'
              ? 'No active PIPs. Click "New" to put an employee on a Performance Improvement Plan.'
              : `No ${statusTab} PIPs yet.`}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {current.map((p) => (
            <Grid key={p._id} size={{ xs: 12, md: 6, lg: 4 }}>
              <PipCard pip={p} onClick={() => setSelected(p)} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreatePipWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaved={load}
      />
      <PipDetailDialog
        pip={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </Box>
  );
}
