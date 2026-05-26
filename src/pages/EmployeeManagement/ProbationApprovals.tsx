import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconCalendarPlus,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  listPendingProbations,
  confirmProbation,
  extendProbation,
  ProbationPendingRow,
} from '../../services/probationApi';
import { tokens } from '../../theme';

/**
 * Probation approvals tab.
 *
 * - The list endpoint returns every employee whose `probationStatus`
 *   is 'in_progress' (or legacy: status unset + DOJ post-launch). The
 *   cron fires a notification once the 90-day window elapses; admins
 *   land here from the bell.
 * - Confirm: date picker (defaults to today). Backdating retroactively
 *   credits the months between the chosen date and now. Forward-dating
 *   is also fine (early confirm with delayed credit).
 * - Extend: positive day count; pushes the original window out. The
 *   cron will nudge again once the new date is reached.
 */

type DialogMode = 'confirm' | 'extend' | null;

export default function ProbationApprovals() {
  const [rows, setRows] = useState<ProbationPendingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeRow, setActiveRow] = useState<ProbationPendingRow | null>(null);
  const [endDate, setEndDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [extendDays, setExtendDays] = useState<string>('30');
  const [extendReason, setExtendReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listPendingProbations();
      setRows(data || []);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to load.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Group rows for the visual split: overdue (action required) first,
  // upcoming (HR can still act early) second.
  const { overdueRows, upcomingRows } = useMemo(() => {
    const overdueRows: ProbationPendingRow[] = [];
    const upcomingRows: ProbationPendingRow[] = [];
    for (const r of rows) {
      if (r.overdue) overdueRows.push(r);
      else upcomingRows.push(r);
    }
    return { overdueRows, upcomingRows };
  }, [rows]);

  function openConfirm(row: ProbationPendingRow) {
    setActiveRow(row);
    // Default end date = today (allows backdating + forward-dating from
    // the same field). Set to the originalEnd if it's in the past so
    // admins get the "intended" date pre-filled — they can adjust.
    const today = moment().format('YYYY-MM-DD');
    const origEnd = row.probationOriginalEndDate
      ? moment(row.probationOriginalEndDate).format('YYYY-MM-DD')
      : today;
    setEndDate(row.overdue ? origEnd : today);
    setDialogMode('confirm');
  }

  function openExtend(row: ProbationPendingRow) {
    setActiveRow(row);
    setExtendDays('30');
    setExtendReason('');
    setDialogMode('extend');
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveRow(null);
  }

  // Live preview of the new original-end date when extending — admins
  // see the exact calendar date they're committing to before clicking.
  const extendPreview = useMemo(() => {
    if (!activeRow || dialogMode !== 'extend') return null;
    const n = Number(extendDays);
    if (!Number.isFinite(n) || n <= 0) return null;
    const base = activeRow.probationOriginalEndDate
      ? moment(activeRow.probationOriginalEndDate)
      : moment();
    return base.clone().add(Math.floor(n), 'days');
  }, [activeRow, dialogMode, extendDays]);

  async function submitConfirm() {
    if (!activeRow) return;
    setSubmitting(true);
    try {
      await confirmProbation(activeRow.userId, endDate);
      toast.success(
        `Probation confirmed for ${activeRow.firstName ?? 'employee'}.`,
      );
      closeDialog();
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to confirm.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExtend() {
    if (!activeRow) return;
    const n = Number(extendDays);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Days must be a positive number.');
      return;
    }
    setSubmitting(true);
    try {
      await extendProbation(activeRow.userId, Math.floor(n), extendReason);
      toast.success(
        `Probation extended for ${activeRow.firstName ?? 'employee'}.`,
      );
      closeDialog();
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to extend.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" color="text.secondary">
          Confirm or extend each new joiner once their 3-month window
          completes. No paid leaves accrue until you act.
        </Typography>
        <Tooltip title="Reload">
          <IconButton onClick={load} disabled={loading} size="small">
            <IconRefresh size={18} />
          </IconButton>
        </Tooltip>
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
            backgroundColor: alpha(tokens.colors.error, 0.06),
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconAlertCircle size={18} color={tokens.colors.error} />
            <Typography variant="body2" sx={{ color: tokens.colors.error }}>
              {error}
            </Typography>
          </Stack>
        </Box>
      )}

      {!loading && !error && rows.length === 0 && (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography color="text.secondary">
            No employees currently on probation.
          </Typography>
        </Box>
      )}

      {!loading && !error && rows.length > 0 && (
        <Stack spacing={4}>
          {overdueRows.length > 0 && (
            <SectionTable
              title="Awaiting your action"
              subtitle="3-month probation window has elapsed."
              rows={overdueRows}
              accent={tokens.colors.warning}
              onConfirm={openConfirm}
              onExtend={openExtend}
            />
          )}
          {upcomingRows.length > 0 && (
            <SectionTable
              title="Upcoming"
              subtitle="Still inside the 3-month window. Acting early is fine."
              rows={upcomingRows}
              accent={tokens.colors.lightTextSecondary}
              onConfirm={openConfirm}
              onExtend={openExtend}
            />
          )}
        </Stack>
      )}

      {/* Confirm dialog ────────────────────────────────────────────── */}
      <Dialog
        open={dialogMode === 'confirm'}
        onClose={submitting ? undefined : closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Confirm probation
          {activeRow && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontWeight: 500 }}
            >
              {activeRow.firstName} {activeRow.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Pick the effective end date. Past dates retroactively credit
            leaves from that month; future dates delay the credit. The
            employee accrues 1 PL + 1 ML per month starting the month of
            the chosen date.
          </Typography>
          <TextField
            type="date"
            fullWidth
            label="Probation end date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submitConfirm}
            variant="contained"
            startIcon={<IconCheck size={16} />}
            disabled={submitting || !endDate}
          >
            {submitting ? 'Confirming…' : 'Confirm probation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend dialog ────────────────────────────────────────────── */}
      <Dialog
        open={dialogMode === 'extend'}
        onClose={submitting ? undefined : closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Extend probation
          {activeRow && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontWeight: 500 }}
            >
              {activeRow.firstName} {activeRow.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              How many additional days to extend probation by? The
              employee continues to accrue zero paid leaves during the
              extension.
            </Typography>
            <TextField
              type="number"
              fullWidth
              label="Days to extend"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              inputProps={{ min: 1, max: 365 }}
              disabled={submitting}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              label="Reason (optional)"
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              disabled={submitting}
            />
            {extendPreview && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(tokens.colors.pink, 0.08),
                  border: '1px solid',
                  borderColor: alpha(tokens.colors.pink, 0.25),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  New probation end date
                </Typography>
                <Typography fontWeight={700}>
                  {extendPreview.format('DD MMM YYYY')}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submitExtend}
            variant="contained"
            startIcon={<IconCalendarPlus size={16} />}
            disabled={submitting || !extendDays}
          >
            {submitting ? 'Extending…' : 'Extend probation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SectionTable({
  title,
  subtitle,
  rows,
  accent,
  onConfirm,
  onExtend,
}: {
  title: string;
  subtitle: string;
  rows: ProbationPendingRow[];
  accent: string;
  onConfirm: (r: ProbationPendingRow) => void;
  onExtend: (r: ProbationPendingRow) => void;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography fontWeight={800}>{title}</Typography>
        <Chip
          size="small"
          label={rows.length}
          sx={{
            bgcolor: alpha(accent, 0.12),
            color: accent,
            fontWeight: 700,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
            <Box component="tr">
              <Th>Employee</Th>
              <Th>Joined</Th>
              <Th>Original end</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </Box>
          </Box>
          <Box component="tbody">
            {rows.map((r) => (
              <Box
                component="tr"
                key={r.userId}
                sx={{ borderTop: '1px solid', borderColor: 'grey.100' }}
              >
                <Td>
                  <Typography sx={{ fontWeight: 600 }}>
                    {r.firstName} {r.lastName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {r.email}
                  </Typography>
                </Td>
                <Td>
                  {r.dateOfJoining
                    ? moment(r.dateOfJoining).format('DD MMM YYYY')
                    : '—'}
                </Td>
                <Td>
                  {r.probationOriginalEndDate
                    ? moment(r.probationOriginalEndDate).format('DD MMM YYYY')
                    : '—'}
                  {r.probationExtensionDays > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      Extended +{r.probationExtensionDays}d
                    </Typography>
                  )}
                </Td>
                <Td>
                  {r.overdue ? (
                    <Chip
                      size="small"
                      label={
                        r.daysOverdue !== null
                          ? `${r.daysOverdue}d overdue`
                          : 'Overdue'
                      }
                      sx={{
                        bgcolor: alpha(tokens.colors.warning, 0.15),
                        color: tokens.colors.warning,
                        fontWeight: 700,
                      }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label={
                        r.daysOverdue !== null
                          ? `${-r.daysOverdue}d remaining`
                          : 'In window'
                      }
                      variant="outlined"
                    />
                  )}
                </Td>
                <Td align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onExtend(r)}
                    >
                      Extend
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onConfirm(r)}
                    >
                      Confirm
                    </Button>
                  </Stack>
                </Td>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: 'right';
}) {
  return (
    <Box
      component="th"
      sx={{
        p: 1.5,
        textAlign: align ?? 'left',
        fontWeight: 700,
        fontSize: 12,
        color: tokens.colors.lightTextSecondary,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Box>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: 'right';
}) {
  return (
    <Box
      component="td"
      sx={{
        p: 1.5,
        textAlign: align ?? 'left',
        verticalAlign: 'top',
      }}
    >
      {children}
    </Box>
  );
}
