import {
  Box,
  Button,
  Chip,
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
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconDeviceFloppy,
  IconMail,
  IconMailCog,
  IconX,
} from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';
import {
  getInvoiceEmailSettings,
  updateInvoiceEmailSettings,
} from '../../../services/invoiceEmailSettingsApi';
import {
  IEmailTemplateBlock,
  IInvoiceEmailSettings,
} from '../../../Interfaces/invoice';

type BlockKey = 'timesheetApprovalRequest' | 'raised' | 'due';

interface BlockMeta {
  key: BlockKey;
  title: string;
  short: string;
  hint: string;
  color: string;
  Icon: typeof IconMail;
  tokens: string[];
}

const BLOCKS: BlockMeta[] = [
  {
    key: 'timesheetApprovalRequest',
    title: 'Approval request',
    short: 'Approval',
    hint: 'Sent to super-admins when admin submits a month for approval.',
    color: tokens.colors.blue,
    Icon: IconClipboardCheck,
    tokens: [
      '{{projectId}}',
      '{{organizationName}}',
      '{{periodMonth}}',
      '{{totalHours}}',
      '{{requestedBy}}',
    ],
  },
  {
    key: 'raised',
    title: 'Invoice raised',
    short: 'Raised',
    hint: 'Sent to client/vendor/prime-vendor when an invoice is raised.',
    color: tokens.colors.pink,
    Icon: IconMail,
    tokens: [
      '{{invoiceNumber}}',
      '{{projectId}}',
      '{{organizationName}}',
      '{{clientCompany}}',
      '{{issueDate}}',
      '{{dueDate}}',
      '{{total}}',
      '{{currency}}',
    ],
  },
  {
    key: 'due',
    title: 'Payment due',
    short: 'Due',
    hint: 'Sent to the accounts team when an invoice becomes overdue.',
    color: '#EF4444',
    Icon: IconAlertTriangle,
    tokens: [
      '{{invoiceNumber}}',
      '{{projectId}}',
      '{{organizationName}}',
      '{{clientCompany}}',
      '{{dueDate}}',
      '{{daysOverdue}}',
      '{{total}}',
      '{{currency}}',
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InvoiceEmailSettingsDrawer({ open, onClose }: Props) {
  const [settings, setSettings] = useState<IInvoiceEmailSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<BlockKey>('timesheetApprovalRequest');
  const [savingKey, setSavingKey] = useState<BlockKey | null>(null);
  /** Per-tab dirty flag so the right Save button lights up, nothing else. */
  const [dirtyByKey, setDirtyByKey] = useState<Record<BlockKey, boolean>>({
    timesheetApprovalRequest: false,
    raised: false,
    due: false,
  });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await getInvoiceEmailSettings();
        if (mounted && res.data?.data) {
          setSettings(res.data.data);
          setDirtyByKey({
            timesheetApprovalRequest: false,
            raised: false,
            due: false,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const patch = (
    key: BlockKey,
    field: keyof IEmailTemplateBlock,
    value: string
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: { ...settings[key], [field]: value } });
    setDirtyByKey((d) => ({ ...d, [key]: true }));
  };

  async function handleSaveTab(key: BlockKey) {
    if (!settings) return;
    setSavingKey(key);
    try {
      // PATCH only the active block. Other blocks' edits sit in local state
      // until their own tabs' Save buttons are pressed — isolation by design.
      const res = await updateInvoiceEmailSettings({
        [key]: settings[key],
      });
      if (res.data?.data) {
        setSettings(res.data.data);
        setDirtyByKey((d) => ({ ...d, [key]: false }));
        toast.success(`${BLOCKS.find((b) => b.key === key)?.title} saved`);
      }
    } catch {
      toast.error('Could not save');
    } finally {
      setSavingKey(null);
    }
  }

  const header = useMemo(
    () => (
      <Box
        sx={{
          position: 'relative',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          px: 3,
          pt: 2.25,
          // Strong bottom padding so the text cannot visually bleed into the
          // content area. Also a hard border so the separation reads on every
          // browser even when scroll shadows render.
          pb: 2.5,
          overflow: 'hidden',
          borderBottom: '1px solid',
          borderColor: alpha('#fff', 0.08),
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
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
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ position: 'relative' }}
        >
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
              boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.35)}`,
            }}
          >
            <IconMailCog size={20} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.7),
                letterSpacing: '0.08em',
                fontWeight: 700,
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              BILLING · EMAIL TEMPLATES
            </Typography>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: '#fff', lineHeight: 1.25, mt: 0.25 }}
            >
              Invoice email templates
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
    ),
    [onClose]
  );

  const activeMeta = BLOCKS.find((b) => b.key === activeTab)!;
  const activeBlock = settings?.[activeTab];
  const isDirty = dirtyByKey[activeTab];
  const isSaving = savingKey === activeTab;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 760,
          maxWidth: '100vw',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // children manage their own scroll
        },
      }}
    >
      {header}

      {/* Tab bar — sits right under the header, owns its own bg so it reads
          as a discrete band even when the content scrolls behind it. */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F6F9FC' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v as BlockKey)}
          variant="fullWidth"
          sx={{
            px: 1,
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 48,
              fontSize: '0.82rem',
            },
            '& .Mui-selected': { color: tokens.colors.pinkDark },
            '& .MuiTabs-indicator': {
              bgcolor: tokens.colors.pink,
              height: 3,
              borderRadius: 3,
            },
          }}
        >
          {BLOCKS.map(({ key, short, Icon, color }) => (
            <Tab
              key={key}
              value={key}
              icon={<Icon size={14} color={color} />}
              iconPosition="start"
              label={
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  {short}
                  {dirtyByKey[key] && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: tokens.colors.pink,
                      }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Scrollable form area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, bgcolor: '#FBFCFE' }}>
        {loading || !settings || !activeBlock ? (
          <Stack direction="row" justifyContent="center" py={8}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {/* Block hint banner — sets context inside the scroll area */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: alpha(activeMeta.color, 0.08),
                border: `1px solid ${alpha(activeMeta.color, 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: alpha(activeMeta.color, 0.15),
                  color: activeMeta.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <activeMeta.Icon size={14} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} sx={{ fontSize: '0.88rem' }}>
                  {activeMeta.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: tokens.colors.lightTextSecondary }}
                >
                  {activeMeta.hint}
                </Typography>
              </Box>
            </Box>

            <TextField
              size="small"
              label="Subject"
              value={activeBlock.subject}
              onChange={(e) => patch(activeTab, 'subject', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Heading"
              value={activeBlock.heading}
              onChange={(e) => patch(activeTab, 'heading', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Body (lead)"
              multiline
              minRows={2}
              value={activeBlock.bodyLead}
              onChange={(e) => patch(activeTab, 'bodyLead', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Body (details)"
              multiline
              minRows={3}
              value={activeBlock.bodyDetails}
              onChange={(e) => patch(activeTab, 'bodyDetails', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Sign-off"
              multiline
              minRows={2}
              value={activeBlock.signOff}
              onChange={(e) => patch(activeTab, 'signOff', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: alpha(activeMeta.color, 0.3),
                bgcolor: alpha(activeMeta.color, 0.03),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: tokens.colors.lightTextSecondary,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontSize: '0.66rem',
                  display: 'block',
                  mb: 0.75,
                }}
              >
                Available tokens
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {activeMeta.tokens.map((t) => (
                  <Tooltip key={t} title="Click to copy">
                    <Chip
                      label={t}
                      size="small"
                      onClick={() => {
                        navigator.clipboard?.writeText(t).catch(() => {});
                        toast.success(`Copied ${t}`);
                      }}
                      sx={{
                        fontSize: '0.68rem',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, monospace',
                        bgcolor: alpha(activeMeta.color, 0.1),
                        color: activeMeta.color,
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Sticky per-tab save bar */}
      {!loading && settings && activeBlock && (
        <Box
          sx={{
            bgcolor: '#fff',
            borderTop: '1px solid',
            borderColor: 'grey.200',
            px: 3,
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {isDirty
              ? 'Unsaved changes on this tab'
              : 'All changes saved on this tab'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>
              Close
            </Button>
            <Button
              variant="contained"
              disabled={!isDirty || isSaving}
              onClick={() => handleSaveTab(activeTab)}
              startIcon={
                isSaving ? (
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
                '&.Mui-disabled': { opacity: 0.55 },
              }}
            >
              {isSaving ? 'Saving' : `Save ${activeMeta.short.toLowerCase()}`}
            </Button>
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
