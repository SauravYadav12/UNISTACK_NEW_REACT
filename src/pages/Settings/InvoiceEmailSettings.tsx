import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IconDeviceFloppy, IconMailCog } from '@tabler/icons-react';
import {
  getInvoiceEmailSettings,
  updateInvoiceEmailSettings,
} from '../../services/invoiceEmailSettingsApi';
import {
  IEmailTemplateBlock,
  IInvoiceEmailSettings,
} from '../../Interfaces/invoice';
import { tokens } from '../../theme/theme';

const MotionBox = motion.create(Box);

type BlockKey = 'timesheetApprovalRequest' | 'raised' | 'due';

const BLOCKS: { key: BlockKey; title: string; hint: string; color: string; tokens: string[] }[] = [
  {
    key: 'timesheetApprovalRequest',
    title: 'Timesheet approval request',
    hint: 'Sent to super-admins when admin submits a month for approval.',
    color: tokens.colors.blue,
    tokens: ['{{projectId}}', '{{organizationName}}', '{{periodMonth}}', '{{totalHours}}', '{{requestedBy}}'],
  },
  {
    key: 'raised',
    title: 'Invoice raised',
    hint: 'Sent to client/vendor/prime-vendor recipients when an invoice is raised.',
    color: tokens.colors.pink,
    tokens: ['{{invoiceNumber}}', '{{projectId}}', '{{organizationName}}', '{{clientCompany}}', '{{issueDate}}', '{{dueDate}}', '{{total}}', '{{currency}}'],
  },
  {
    key: 'due',
    title: 'Payment due alert',
    hint: 'Sent to the accounts team when an invoice becomes overdue.',
    color: '#EF4444',
    tokens: ['{{invoiceNumber}}', '{{projectId}}', '{{organizationName}}', '{{clientCompany}}', '{{dueDate}}', '{{daysOverdue}}', '{{total}}', '{{currency}}'],
  },
];

export default function InvoiceEmailSettingsPage() {
  const [settings, setSettings] = useState<IInvoiceEmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getInvoiceEmailSettings();
        if (mounted && res.data?.data) setSettings(res.data.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const patch = (key: BlockKey, field: keyof IEmailTemplateBlock, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: { ...settings[key], [field]: value },
    });
    setDirty(true);
  };

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await updateInvoiceEmailSettings({
        timesheetApprovalRequest: settings.timesheetApprovalRequest,
        raised: settings.raised,
        due: settings.due,
      });
      if (res.data?.data) {
        setSettings(res.data.data);
        setDirty(false);
        toast.success('Saved');
      }
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  }

  const hero = useMemo(
    () => (
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
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
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
            }}
          >
            <IconMailCog size={24} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 700 }}>
              BILLING · EMAIL TEMPLATES
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>
              Invoice email{' '}
              <Box
                component="span"
                sx={{
                  background: tokens.gradients.pinkBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                templates
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.65) }}>
              Edit what goes out for approval requests, raised invoices, and due alerts.
            </Typography>
          </Box>
        </Stack>
      </MotionBox>
    ),
    []
  );

  if (loading) {
    return (
      <Box>
        {hero}
        <Stack direction="row" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box>
        {hero}
        <Typography color="text.secondary">Could not load settings.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {hero}

      <Grid container spacing={2}>
        {BLOCKS.map(({ key, title, hint, color, tokens: tokenHints }) => {
          const block = settings[key];
          return (
            <Grid size={{ xs: 12, lg: 4 }} key={key}>
              <Box
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: alpha(color, 0.25),
                  overflow: 'hidden',
                  height: '100%',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: alpha(color, 0.08),
                    borderBottom: `1px solid ${alpha(color, 0.2)}`,
                  }}
                >
                  <Typography fontWeight={800}>{title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hint}
                  </Typography>
                </Box>
                <Stack spacing={1.5} sx={{ p: 2 }}>
                  <TextField
                    size="small"
                    label="Subject"
                    value={block.subject}
                    onChange={(e) => patch(key, 'subject', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small"
                    label="Heading"
                    value={block.heading}
                    onChange={(e) => patch(key, 'heading', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small"
                    label="Body (lead)"
                    multiline
                    minRows={2}
                    value={block.bodyLead}
                    onChange={(e) => patch(key, 'bodyLead', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small"
                    label="Body (details)"
                    multiline
                    minRows={3}
                    value={block.bodyDetails}
                    onChange={(e) => patch(key, 'bodyDetails', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small"
                    label="Sign-off"
                    multiline
                    minRows={2}
                    value={block.signOff}
                    onChange={(e) => patch(key, 'signOff', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: tokens.colors.lightTextSecondary,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontSize: '0.66rem',
                      }}
                    >
                      Available tokens
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      {tokenHints.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            bgcolor: alpha(color, 0.1),
                            color,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          disabled={!dirty || saving}
          onClick={handleSave}
          startIcon={
            saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <IconDeviceFloppy size={16} />
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
          {saving ? 'Saving' : 'Save all'}
        </Button>
      </Stack>
    </Box>
  );
}
