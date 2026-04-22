import { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, FormControlLabel, Grid, Stack,
  Switch, TextField, Typography, alpha, Tooltip, Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconEye, IconCalendarEvent, IconSparkles,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

import {
  HolidayNoticeSettings,
  HolidayNoticePreview,
  getHolidayNoticeSettings,
  updateHolidayNoticeSettings,
  previewHolidayNotice,
} from '../../services/holidayNoticeApi';
import { tokens } from '../../theme/theme';

const PLACEHOLDERS = [
  { token: 'employeeName', label: 'Employee name' },
  { token: 'holidayName', label: 'Holiday name' },
  { token: 'holidayDate', label: 'Holiday date' },
  { token: 'daysUntil', label: 'Days until' },
  { token: 'country', label: 'Country' },
  { token: 'companyName', label: 'Company name' },
];

export default function HolidayNoticeSettingsPanel() {
  const [settings, setSettings] = useState<HolidayNoticeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<HolidayNoticePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getHolidayNoticeSettings();
        setSettings(data);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof HolidayNoticeSettings>(k: K, v: HolidayNoticeSettings[K]) {
    setSettings((s) => (s ? { ...s, [k]: v } : s));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const { data } = await updateHolidayNoticeSettings({
        enabled: settings.enabled,
        daysBefore: Number(settings.daysBefore) || 7,
        subject: settings.subject,
        heading: settings.heading,
        bodyLead: settings.bodyLead,
        bodyDetails: settings.bodyDetails,
        signOff: settings.signOff,
      });
      setSettings(data);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      const { data } = await previewHolidayNotice();
      setPreview(data);
    } catch {
      toast.error('Could not render preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  // Helper — paste a placeholder into the currently-focused field. Inserts
  // at the end for simplicity (no cursor tracking to keep the code small).
  function insertPlaceholder(token: string) {
    if (!settings || !focusedField) {
      toast.info('Click inside a field first, then pick a placeholder');
      return;
    }
    const current = (settings as unknown as Record<string, string>)[focusedField] || '';
    const next = current + (current && !current.endsWith(' ') ? ' ' : '') + `{{${token}}}`;
    update(focusedField as keyof HolidayNoticeSettings, next as never);
  }

  if (loading || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const textFieldProps = (field: keyof HolidayNoticeSettings) => ({
    onFocus: () => setFocusedField(field as string),
  });

  return (
    <Box>
      {/* Header banner with brand stripe */}
      <Box sx={{
        position: 'relative',
        borderRadius: 3, p: 2, mb: 3, overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(tokens.colors.brand, 0.04)} 0%, ${alpha(tokens.colors.pink, 0.05)} 60%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
        border: `1px solid ${alpha(tokens.colors.pink, 0.18)}`,
      }}>
        <Box sx={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
          background: `linear-gradient(180deg, ${tokens.colors.pink} 0%, ${tokens.colors.blue} 50%, ${tokens.colors.yellow} 100%)`,
        }} />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between" spacing={1.5}
          sx={{ pl: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <motion.div
              whileHover={{ rotate: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16 }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: alpha(tokens.colors.pink, 0.12),
                color: tokens.colors.pink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCalendarEvent size={20} stroke={2} />
              </Box>
            </motion.div>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: tokens.colors.lightText }}>
                Holiday notice automation
              </Typography>
              <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
                Automated email sent to all employees {settings.daysBefore} day{settings.daysBefore === 1 ? '' : 's'} before each holiday. Runs daily at 9:00 AM EST.
              </Typography>
            </Box>
          </Stack>
          <FormControlLabel
            label={settings.enabled ? 'Automation ON' : 'Automation OFF'}
            labelPlacement="start"
            sx={{ m: 0, '& .MuiTypography-root': { fontWeight: 700, fontSize: 12, letterSpacing: 0.5 } }}
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => update('enabled', e.target.checked)}
              />
            }
          />
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Form side */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Days before holiday"
                  type="number"
                  size="small" fullWidth
                  value={settings.daysBefore}
                  onChange={(e) => update('daysBefore', Math.max(1, Number(e.target.value) || 1))}
                  inputProps={{ min: 1, max: 30 }}
                  {...textFieldProps('daysBefore')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Email subject"
                  size="small" fullWidth
                  value={settings.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  {...textFieldProps('subject')}
                />
              </Grid>
            </Grid>

            <TextField
              label="Heading (shown inside the email)"
              size="small" fullWidth
              value={settings.heading}
              onChange={(e) => update('heading', e.target.value)}
              {...textFieldProps('heading')}
            />

            <TextField
              label="Body — lead paragraph"
              size="small" fullWidth multiline minRows={3}
              value={settings.bodyLead}
              onChange={(e) => update('bodyLead', e.target.value)}
              {...textFieldProps('bodyLead')}
            />

            <TextField
              label="Body — details paragraph"
              size="small" fullWidth multiline minRows={3}
              value={settings.bodyDetails}
              onChange={(e) => update('bodyDetails', e.target.value)}
              {...textFieldProps('bodyDetails')}
            />

            <TextField
              label="Sign-off (supports line breaks)"
              size="small" fullWidth multiline minRows={2}
              value={settings.signOff}
              onChange={(e) => update('signOff', e.target.value)}
              {...textFieldProps('signOff')}
            />

            {/* Placeholder palette */}
            <Box sx={{
              p: 1.5, borderRadius: 2,
              bgcolor: alpha(tokens.colors.brand, 0.03),
              border: `1px dashed ${alpha(tokens.colors.brand, 0.18)}`,
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <IconSparkles size={14} color={tokens.colors.pink} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: tokens.colors.pink }}>
                  PLACEHOLDERS
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                  · click to insert at end of focused field
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {PLACEHOLDERS.map((p) => (
                  <Tooltip key={p.token} title={p.label}>
                    <Chip
                      onClick={() => insertPlaceholder(p.token)}
                      label={`{{${p.token}}}`}
                      size="small"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10,
                        bgcolor: alpha(tokens.colors.pink, 0.08),
                        color: tokens.colors.pink,
                        border: `1px solid ${alpha(tokens.colors.pink, 0.22)}`,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.16) },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                disabled={saving}
                onClick={handleSave}
                sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
                startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}
              >
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
              <Button
                variant="outlined"
                disabled={previewLoading}
                onClick={handlePreview}
                startIcon={previewLoading ? <CircularProgress size={14} /> : <IconEye size={16} />}
              >
                {previewLoading ? 'Rendering…' : 'Preview email'}
              </Button>
            </Stack>

            <Box sx={{
              mt: 1.5, p: 1.5, borderRadius: 2,
              bgcolor: 'rgba(55, 183, 234, 0.06)',
              border: '1px solid rgba(55, 183, 234, 0.2)',
            }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: tokens.colors.blue }}>
                FULLY AUTOMATED
              </Typography>
              <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary, mt: 0.25, lineHeight: 1.5 }}>
                The system checks daily at 9:00 AM EST and sends the email {settings.daysBefore} day{settings.daysBefore === 1 ? '' : 's'} before each upcoming holiday. No manual trigger needed — just keep the template up to date here.
              </Typography>
            </Box>
          </Stack>
        </Grid>

        {/* Preview side */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{
            borderRadius: 3, p: 0, height: '100%',
            border: '1px solid', borderColor: 'divider',
            bgcolor: '#F4F6F8',
            overflow: 'hidden',
            position: 'sticky', top: 12,
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25, bgcolor: tokens.colors.brand, color: '#fff' }}>
              <Typography sx={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, opacity: 0.85 }}>
                LIVE PREVIEW
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.pink }} />
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.blue }} />
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.yellow }} />
              </Stack>
            </Stack>
            {preview ? (
              <Box>
                <Box sx={{ p: 1.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, letterSpacing: 1, fontWeight: 600 }}>
                    SUBJECT
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.colors.brand }}>
                    {preview.subject}
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 560, overflow: 'auto' }}>
                  <iframe
                    title="Holiday notice preview"
                    srcDoc={preview.html}
                    style={{ width: '100%', height: 560, border: 'none', background: '#f4f6f8' }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: tokens.colors.lightTextSecondary, mb: 2 }}>
                  Hit <strong>Preview email</strong> to render the template with sample data.
                </Typography>
                <Button
                  variant="contained"
                  disabled={previewLoading}
                  onClick={handlePreview}
                  sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
                  startIcon={previewLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <IconEye size={16} />}
                >
                  {previewLoading ? 'Rendering…' : 'Render preview'}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

    </Box>
  );
}
