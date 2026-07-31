import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Checkbox,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  IconArrowFork,
  IconUsers,
  IconBriefcase,
  IconInfoCircle,
} from '@tabler/icons-react';
import { IRequirement } from '../../Interfaces/types';
import { tokens } from '../../theme/theme';

interface Props {
  open: boolean;
  parentReqID: string;
  children: IRequirement[];
  changedFields: string[];
  onCancel: () => void;
  /**
   * Called when the user confirms. `selection` is either the string
   * "all" or an array of child `_id`s. Parent only shows the dialog
   * after the parent update has already succeeded, so this handler
   * just needs to call the propagate API and close.
   */
  onConfirm: (selection: 'all' | string[]) => Promise<void>;
}

type Step = 'confirm' | 'select';

/**
 * Two-step propagate flow:
 *   1. `confirm` — ask if the user wants to push their just-saved
 *      changes onto any children at all. Yes → step 2. No → close.
 *   2. `select` — checkbox list of children (reqID · marketer · consultant)
 *      plus an "Update all children" shortcut button.
 */
export default function PropagateToChildrenDialog({
  open,
  parentReqID,
  children,
  changedFields,
  onCancel,
  onConfirm,
}: Props) {
  const [step, setStep] = useState<Step>('confirm');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Reset internal state each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStep('confirm');
    setSelected(new Set());
    setBusy(false);
  }, [open]);

  const sortedChildren = useMemo(
    () =>
      children
        .slice()
        .sort((a, b) => (a.reqID || '').localeCompare(b.reqID || '')),
    [children],
  );

  const allSelected =
    sortedChildren.length > 0 && selected.size === sortedChildren.length;

  const toggleChild = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedChildren.map((c) => c._id).filter(Boolean)));
    }
  };

  const runPropagate = async (selection: 'all' | string[]) => {
    setBusy(true);
    try {
      await onConfirm(selection);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {step === 'confirm' ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                }}
              >
                <IconArrowFork size={18} />
              </Box>
              <span>Propagate changes to child records?</span>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              You just updated{' '}
              <b>{changedFields.length}</b>{' '}
              field{changedFields.length === 1 ? '' : 's'} on{' '}
              <b>{parentReqID}</b>. Would you like to push{' '}
              {changedFields.length === 1 ? 'the same change' : 'these changes'}{' '}
              onto {sortedChildren.length} child record
              {sortedChildren.length === 1 ? '' : 's'} as well?
            </Typography>
            {changedFields.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  FIELDS CHANGED
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 0.5 }}
                >
                  {changedFields.map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      sx={{
                        bgcolor: alpha(tokens.colors.blue, 0.1),
                        color: tokens.colors.blueDark,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            <Box
              sx={{
                mt: 1,
                p: 1.25,
                borderRadius: 2,
                bgcolor: alpha(tokens.colors.blue, 0.05),
                border: '1px solid',
                borderColor: alpha(tokens.colors.blue, 0.15),
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
              }}
            >
              <IconInfoCircle
                size={16}
                color={tokens.colors.blueDark}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                Marketer assignment, comments, per-child status and star
                colour are never overwritten. If you skip, only the parent
                record is updated.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={onCancel}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              No, parent only
            </Button>
            <Button
              onClick={() => setStep('select')}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: tokens.gradients.pinkBlue,
              }}
            >
              Yes, choose children
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                }}
              >
                <IconUsers size={18} />
              </Box>
              <span>Select child records</span>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
              Pick one or more child records, or use{' '}
              <b>Update all children</b> to hit every child of {parentReqID} in
              one go.
            </Typography>

            <Button
              variant="outlined"
              onClick={() => runPropagate('all')}
              disabled={busy || sortedChildren.length === 0}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                py: 1,
                mb: 1.5,
                borderStyle: 'dashed',
              }}
            >
              Update all {sortedChildren.length} children
            </Button>

            <Divider sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.06em',
                }}
              >
                OR PICK SPECIFIC
              </Typography>
            </Divider>

            {sortedChildren.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No child records to update.
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 320, overflowY: 'auto' }}>
                <Box
                  onClick={toggleAll}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: alpha(tokens.colors.blue, 0.03),
                    '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.06) },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={
                      selected.size > 0 && selected.size < sortedChildren.length
                    }
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'text.secondary',
                    }}
                  >
                    Select all
                  </Typography>
                </Box>
                {sortedChildren.map((c) => (
                  <Box
                    key={c._id}
                    onClick={() => toggleChild(c._id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selected.has(c._id)
                        ? alpha(tokens.colors.blueDark, 0.5)
                        : 'grey.200',
                      bgcolor: selected.has(c._id)
                        ? alpha(tokens.colors.blue, 0.08)
                        : 'transparent',
                      '&:hover': {
                        bgcolor: alpha(tokens.colors.blue, 0.04),
                      },
                    }}
                  >
                    <Checkbox size="small" checked={selected.has(c._id)} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#0A3555',
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {c.reqID || '—'}
                        </Typography>
                        {c.reqStatus && (
                          <Chip
                            label={c.reqStatus}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: alpha(tokens.colors.blue, 0.1),
                              color: tokens.colors.blueDark,
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ mt: 0.25, color: 'text.secondary' }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.72rem' }}
                          noWrap
                        >
                          <IconUsers
                            size={11}
                            style={{ verticalAlign: 'middle', marginRight: 3 }}
                          />
                          {c.assignedTo || 'Unassigned'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.72rem' }}
                          noWrap
                        >
                          <IconBriefcase
                            size={11}
                            style={{ verticalAlign: 'middle', marginRight: 3 }}
                          />
                          {c.appliedFor || '—'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => setStep('confirm')}
              disabled={busy}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              onClick={onCancel}
              disabled={busy}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Skip
            </Button>
            <Button
              onClick={() => runPropagate(Array.from(selected))}
              disabled={busy || selected.size === 0}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: tokens.gradients.pinkBlue,
              }}
            >
              Update {selected.size || 0} selected
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
