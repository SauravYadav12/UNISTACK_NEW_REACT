import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconX,
  IconSend,
  IconDeviceFloppy,
  IconTrash,
  IconCheck,
  IconBan,
  IconCalendarPlus,
  IconAlertTriangleFilled,
  IconMailForward,
  IconUserMinus,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Pip, PIP_REASON_LABELS } from '../../Interfaces/pip';
import {
  updatePip,
  sendPip,
  extendPip,
  resolvePip,
  resendPip,
  removePip,
  deletePip,
} from '../../services/pipApi';
import { PIP_STATUS_META, errMsg } from './pipStatus';
import { tokens } from '../../theme/theme';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';

interface Props {
  pip: Pip | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function PipDetailDialog({ pip, open, onClose, onChanged }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [extendDays, setExtendDays] = useState(15);
  const [note, setNote] = useState('');
  const [confirmFail, setConfirmFail] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const { iUser } = useAuth();
  const isSuperAdmin = Boolean(iUser?.role?.includes(UserRole['super-admin']));

  useEffect(() => {
    if (!pip) return;
    setSubject(pip.emailSubject || '');
    setBody(pip.emailBody || '');
    setExtendDays(15);
    setNote('');
    setConfirmFail(false);
    setConfirmRemove(false);
    setBusy(null);
  }, [pip]);

  if (!pip) return null;
  const meta = PIP_STATUS_META[pip.status];
  const isDraft = pip.status === 'draft';
  const isActive = pip.status === 'active';
  const resolved =
    pip.status === 'successful' ||
    pip.status === 'failed' ||
    pip.status === 'removed';
  // Super-admin extras are only offered on a live PIP, and hidden while a
  // confirm panel is open so the footer shows just Cancel / Confirm.
  const showActiveActions = isActive && !confirmFail && !confirmRemove;

  async function run(key: string, fn: () => Promise<unknown>, okMsg: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(okMsg);
      onChanged();
      onClose();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (key === 'send' && status === 502) {
        toast.warning(errMsg(e, 'The email failed to send; the PIP stays a draft.'));
        onChanged();
      } else {
        toast.error(errMsg(e));
      }
    } finally {
      setBusy(null);
    }
  }

  const id = pip._id;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Typography variant="h6" fontWeight={700}>{pip.employeeName}</Typography>
          <Chip
            size="small"
            label={meta.label}
            sx={{ bgcolor: alpha(meta.color, 0.15), color: meta.color, fontWeight: 700 }}
          />
        </Stack>
        <Tooltip title="Close" arrow placement="left">
          <IconButton
            onClick={onClose}
            size="small"
            disabled={Boolean(busy)}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
          >
            <IconX size={18} />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {/* Reasons */}
          <Box>
            <Label>Reason(s)</Label>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {pip.reasons.map((r) => (
                <Chip
                  key={r}
                  size="small"
                  variant="outlined"
                  label={r === 'other' && pip.otherReason ? pip.otherReason : PIP_REASON_LABELS[r]}
                />
              ))}
            </Stack>
          </Box>

          {/* Timeline */}
          {!isDraft && (
            <Box>
              <Label>Plan timeline</Label>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Started <strong>{moment(pip.startDate).format('MMM D, YYYY')}</strong>
                {' · '}ends <strong>{moment(pip.endDate).format('MMM D, YYYY')}</strong>
                {pip.extensionDays > 0 && ` · extended by ${pip.extensionDays} day(s)`}
              </Typography>
              {!!pip.resendCount && pip.resendCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Email resent {pip.resendCount} time(s)
                  {pip.lastResentAt
                    ? ` · last on ${moment(pip.lastResentAt).format('MMM D, YYYY')}`
                    : ''}
                </Typography>
              )}
              {resolved && pip.resolvedAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {meta.label} on {moment(pip.resolvedAt).format('MMM D, YYYY')}
                  {pip.resolutionNote ? ` — ${pip.resolutionNote}` : ''}
                </Typography>
              )}
            </Box>
          )}

          {/* Email */}
          <Box>
            <Label>Email to employee</Label>
            {isDraft ? (
              <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                <TextField
                  size="small"
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <TextField
                  multiline
                  minRows={10}
                  maxRows={20}
                  label="Body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  sx={{ '& textarea': { fontSize: 13, lineHeight: 1.6 } }}
                />
              </Stack>
            ) : (
              <Box
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  maxHeight: 280,
                  overflow: 'auto',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{pip.emailSubject}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', fontSize: 13, lineHeight: 1.6 }}>
                  {pip.emailBody}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Active: extend + resolution note */}
          {showActiveActions && (
            <Box>
              <Label>Review actions</Label>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Extend by (days)"
                  value={extendDays || ''}
                  onChange={(e) => setExtendDays(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
                  sx={{ width: 160 }}
                  inputProps={{ min: 1, max: 180 }}
                />
                <Button
                  variant="outlined"
                  startIcon={busy === 'extend' ? <CircularProgress size={14} /> : <IconCalendarPlus size={16} />}
                  disabled={Boolean(busy) || extendDays < 1}
                  onClick={() => run('extend', () => extendPip(id, extendDays), `PIP extended by ${extendDays} day(s).`)}
                >
                  Extend
                </Button>
              </Stack>
              <TextField
                fullWidth
                size="small"
                label="Resolution note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                sx={{ mt: 1.5 }}
              />
            </Box>
          )}

          {/* Failed confirmation */}
          {confirmFail && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(tokens.colors.error, 0.08), border: `1px solid ${alpha(tokens.colors.error, 0.4)}` }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <IconAlertTriangleFilled size={18} color={tokens.colors.error} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: tokens.colors.error, fontWeight: 700 }}>
                    Deactivate {pip.employeeName}?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Marking this PIP as failed will <strong>deactivate the employee</strong> from
                    the system (stamping their relieving date) and email them the outcome. This
                    treats them as having left the company.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Remove-from-PIP confirmation (super-admin) */}
          {confirmRemove && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(tokens.colors.blue, 0.08), border: `1px solid ${alpha(tokens.colors.blue, 0.4)}` }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <IconUserMinus size={18} color={tokens.colors.blueDark} />
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" sx={{ color: tokens.colors.blueDark, fontWeight: 700 }}>
                    Remove {pip.employeeName} from this PIP?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    This closes the plan and emails the employee that they have been removed. The
                    account <strong>stays active</strong> — this is not a termination.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reason (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={{ mt: 1.5 }}
                  />
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {/* Left side — destructive / secondary */}
        <Box>
          {isDraft && (
            <Button
              color="error"
              startIcon={busy === 'delete' ? <CircularProgress size={14} /> : <IconTrash size={16} />}
              disabled={Boolean(busy)}
              onClick={() => run('delete', () => deletePip(id), 'Draft deleted.')}
            >
              Delete
            </Button>
          )}
          {showActiveActions && isSuperAdmin && (
            <Button
              startIcon={busy === 'resend' ? <CircularProgress size={14} /> : <IconMailForward size={16} />}
              disabled={Boolean(busy)}
              onClick={() => run('resend', () => resendPip(id), `PIP email resent to ${pip.employeeName}.`)}
            >
              Resend email
            </Button>
          )}
        </Box>

        {/* Right side — primary actions per status */}
        <Stack direction="row" spacing={1}>
          {isDraft && (
            <>
              <Button
                startIcon={busy === 'save' ? <CircularProgress size={14} /> : <IconDeviceFloppy size={16} />}
                disabled={Boolean(busy) || !subject.trim() || !body.trim()}
                onClick={() => run('save', () => updatePip(id, { emailSubject: subject.trim(), emailBody: body }), 'Draft saved.')}
              >
                Save
              </Button>
              <Button
                variant="contained"
                startIcon={busy === 'send' ? <CircularProgress size={14} color="inherit" /> : <IconSend size={16} />}
                disabled={Boolean(busy)}
                onClick={async () => {
                  // Persist edits first, then send.
                  setBusy('send');
                  try {
                    await updatePip(id, { emailSubject: subject.trim(), emailBody: body });
                    await sendPip(id);
                    toast.success(`PIP email sent to ${pip.employeeName}. Tracking started.`);
                    onChanged();
                    onClose();
                  } catch (e) {
                    const status = (e as { response?: { status?: number } })?.response?.status;
                    if (status === 502) toast.warning(errMsg(e, 'Email failed; still a draft.'));
                    else toast.error(errMsg(e));
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Send
              </Button>
            </>
          )}

          {showActiveActions && (
            <>
              {isSuperAdmin && (
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<IconUserMinus size={16} />}
                  disabled={Boolean(busy)}
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove from PIP
                </Button>
              )}
              <Button
                variant="outlined"
                color="success"
                startIcon={busy === 'ok' ? <CircularProgress size={14} /> : <IconCheck size={16} />}
                disabled={Boolean(busy)}
                onClick={() => run('ok', () => resolvePip(id, 'successful', note.trim() || undefined), `${pip.employeeName}'s PIP marked successful.`)}
              >
                PIP Successful
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<IconBan size={16} />}
                disabled={Boolean(busy)}
                onClick={() => setConfirmFail(true)}
              >
                PIP Failed
              </Button>
            </>
          )}

          {confirmFail && (
            <>
              <Button onClick={() => setConfirmFail(false)} disabled={Boolean(busy)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={busy === 'fail' ? <CircularProgress size={14} color="inherit" /> : <IconBan size={16} />}
                disabled={Boolean(busy)}
                onClick={() => run('fail', () => resolvePip(id, 'failed', note.trim() || undefined), `${pip.employeeName}'s PIP marked failed; employee deactivated.`)}
              >
                Confirm — deactivate
              </Button>
            </>
          )}

          {confirmRemove && (
            <>
              <Button onClick={() => setConfirmRemove(false)} disabled={Boolean(busy)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={busy === 'remove' ? <CircularProgress size={14} color="inherit" /> : <IconUserMinus size={16} />}
                disabled={Boolean(busy)}
                onClick={() => run('remove', () => removePip(id, note.trim() || undefined), `${pip.employeeName} removed from the PIP.`)}
                sx={{ bgcolor: tokens.colors.blueDark, '&:hover': { bgcolor: tokens.colors.blueDark } }}
              >
                Confirm — remove
              </Button>
            </>
          )}

          {resolved && (
            <Button onClick={onClose} variant="contained">Close</Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}
    >
      {children}
    </Typography>
  );
}
