import { ReactNode, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, IconButton, Stack, Typography, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconQuestionMark, IconX } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

/**
 * ConfirmDialog — reusable confirmation modal with async-aware Confirm button.
 *
 * Design highlights:
 *  - Left-side vertical accent stripe tinted to the tone (neutral/success/danger/warning)
 *  - Large halo'd stamp icon that pulses gently while idle, scales in on open
 *  - Scattered Unicodez tri-color dots in the top-right corner for brand flair
 *  - Confirm button morphs into an inline spinner (same width) while awaiting onConfirm
 *  - Cancel + backdrop click blocked while awaiting — no double-submits
 *
 * Tone presets map to the brand palette; the icon can be overridden per use.
 */
export type ConfirmTone = 'neutral' | 'success' | 'danger' | 'warning';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** May return a promise; component shows loader until it resolves. Throw to keep modal open. */
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  /** Close the dialog automatically once onConfirm resolves. Default: true. */
  autoCloseOnSuccess?: boolean;
}

const TONE: Record<ConfirmTone, { accent: string; badgeBg: string; halo: string; iconDefault: ReactNode }> = {
  neutral: {
    accent: tokens.colors.blue,
    badgeBg: alpha(tokens.colors.blue, 0.12),
    halo: alpha(tokens.colors.blue, 0.22),
    iconDefault: <IconQuestionMark size={28} stroke={2.25} />,
  },
  success: {
    accent: tokens.colors.success,
    badgeBg: alpha(tokens.colors.success, 0.12),
    halo: alpha(tokens.colors.success, 0.22),
    iconDefault: <IconCheck size={28} stroke={2.25} />,
  },
  danger: {
    accent: tokens.colors.error,
    badgeBg: alpha(tokens.colors.error, 0.12),
    halo: alpha(tokens.colors.error, 0.22),
    iconDefault: <IconAlertTriangle size={28} stroke={2.25} />,
  },
  warning: {
    accent: tokens.colors.warning,
    badgeBg: alpha(tokens.colors.warning, 0.12),
    halo: alpha(tokens.colors.warning, 0.22),
    iconDefault: <IconInfoCircle size={28} stroke={2.25} />,
  },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'neutral',
  icon,
  autoCloseOnSuccess = true,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const t = TONE[tone];

  async function handleConfirm() {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
      if (autoCloseOnSuccess) onClose();
    } catch {
      // Leave the dialog open so the caller can surface their own error state.
    } finally {
      setLoading(false);
    }
  }

  function handleClose(_: unknown, reason?: 'backdropClick' | 'escapeKeyDown') {
    if (loading) return; // block dismissal during pending request
    if (reason === 'backdropClick') return; // intentional — click Cancel
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          // Kill the default MUI border so our accent stripe is the sole edge.
          border: 'none',
        },
      }}
      // Subtle backdrop color tint — breaks the flat grey feel.
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha(tokens.colors.brand, 0.55),
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      {/* Left accent stripe */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 6,
        background: `linear-gradient(180deg, ${t.accent} 0%, ${alpha(t.accent, 0.4)} 100%)`,
      }} />

      {/* Corner brand dots — faint, decorative */}
      <Box sx={{
        position: 'absolute', top: 14, right: 18, display: 'flex', gap: 0.75, opacity: 0.55,
      }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.pink }} />
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.blue }} />
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.yellow }} />
      </Box>

      {/* Close (X) — disabled during load */}
      <IconButton
        size="small"
        onClick={() => !loading && onClose()}
        disabled={loading}
        sx={{
          position: 'absolute', top: 8, right: 46,
          color: 'text.secondary',
          '&:hover': { bgcolor: alpha(tokens.colors.brand, 0.06) },
        }}
      >
        <IconX size={16} />
      </IconButton>

      <Box sx={{ pl: 4.5, pr: 3.5, pt: 4, pb: 3 }}>
        {/* Stamp icon with halo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ position: 'relative' }}
          >
            {/* Pulse halo */}
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                background: t.halo,
              }}
            />
            <Box sx={{
              position: 'relative',
              width: 60, height: 60, borderRadius: '50%',
              bgcolor: t.badgeBg,
              color: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${alpha(t.accent, 0.25)}`,
            }}>
              {icon || t.iconDefault}
            </Box>
          </motion.div>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: tokens.colors.brand,
            letterSpacing: '-0.01em',
            mb: description ? 1 : 2,
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        {description && (
          <Box sx={{ textAlign: 'center', mb: 3, px: 1 }}>
            {typeof description === 'string' ? (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {description}
              </Typography>
            ) : (
              description
            )}
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1.25} sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="text"
            onClick={onClose}
            disabled={loading}
            sx={{
              py: 1.2,
              fontWeight: 600,
              color: 'text.secondary',
              borderRadius: 2,
              bgcolor: alpha(tokens.colors.brand, 0.04),
              '&:hover': { bgcolor: alpha(tokens.colors.brand, 0.08) },
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
            disableElevation
            sx={{
              py: 1.2,
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: t.accent,
              color: '#fff',
              position: 'relative',
              '&:hover': { bgcolor: t.accent, filter: 'brightness(0.92)' },
              '&.Mui-disabled': { bgcolor: t.accent, color: '#fff', opacity: 0.85 },
            }}
          >
            {/* Keep the button width stable: both states occupy the same slot. */}
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <CircularProgress size={16} thickness={5} sx={{ color: '#fff' }} />
                    <span>Working…</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {confirmLabel}
                  </motion.span>
                )}
              </AnimatePresence>
            </Box>
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
