import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconEdit,
  IconTrash,
  IconX,
  IconHistory,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { ChessLead, ChessLeadLog, ChessLeadPayload } from '../../Interfaces/chessLead';
import {
  createChessLeadLog,
  deleteChessLead,
  getChessLead,
  getChessLeadLogs,
  updateChessLead,
} from '../../services/chessLeadApi';
import ChessLeadForm from './ChessLeadForm';
import {
  CHESS_PRIORITY_COLORS,
  CHESS_STATUS_COLORS,
  computePricing,
} from './chessLeadsValues';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Props {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  /** Fired after any mutation so the parent grid can refetch. */
  onChanged: () => void;
}

const READABLE_FIELD: Record<string, string> = {
  academyName: 'Academy name',
  subscriptionDate: 'Subscription date',
  totalIds: 'Total IDs',
  mobileNumber: 'Mobile number',
  stateOrCity: 'State / City',
  pricingPerId: 'Pricing per ID',
  gstPercent: 'GST %',
  status: 'Status',
  priority: 'Priority',
  reason: 'Reason',
  nextFollowUpDate: 'Next follow-up',
  lastRenewalDate: 'Last renewal',
  country: 'Country',
  state: 'State',
  city: 'City',
};

export default function ChessLeadDrawer({ open, leadId, onClose, onChanged }: Props) {
  const { iUser } = useAuth();
  const [lead, setLead] = useState<ChessLead | null>(null);
  const [logs, setLogs] = useState<ChessLeadLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = iUser?.role?.includes(UserRole['super-admin']) || false;

  useEffect(() => {
    if (!open || !leadId) {
      setLead(null);
      setLogs([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([getChessLead(leadId), getChessLeadLogs(leadId)])
      .then(([l, lg]) => {
        if (cancelled) return;
        setLead(l.data?.data || null);
        setLogs(lg.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load lead');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  async function refetchLogs(id: string) {
    try {
      const lg = await getChessLeadLogs(id);
      setLogs(lg.data?.data || []);
    } catch {
      /* silent — log fetch failure shouldn't spam the user */
    }
  }

  async function handleSave(payload: ChessLeadPayload) {
    if (!lead || !iUser) return;
    setSaving(true);
    try {
      const before = { ...lead };
      const res = await updateChessLead(lead._id, payload);
      const updated = res.data?.data;
      if (updated) {
        setLead(updated);
        // Diff the fields the user actually changed and log only those.
        const diff: Record<string, { before: unknown; after: unknown }> = {};
        for (const k of Object.keys(payload)) {
          const key = k as keyof ChessLeadPayload;
          const b = (before as unknown as Record<string, unknown>)[k];
          const a = (updated as unknown as Record<string, unknown>)[k];
          if (JSON.stringify(b) !== JSON.stringify(a)) {
            diff[key] = { before: b, after: a };
          }
        }
        if (Object.keys(diff).length > 0) {
          await createChessLeadLog({
            leadRef: lead._id,
            leadId: lead.leadId,
            operation: 'update',
            userName:
              `${iUser.firstName || ''} ${iUser.lastName || ''}`.trim() || iUser.email,
            userRef: iUser._id,
            oldData: Object.fromEntries(
              Object.entries(diff).map(([k, v]) => [k, v.before]),
            ) as Partial<ChessLead>,
            newData: Object.fromEntries(
              Object.entries(diff).map(([k, v]) => [k, v.after]),
            ) as Partial<ChessLead>,
          });
          await refetchLogs(lead._id);
        }
        toast.success('Lead updated');
        setEditOpen(false);
        onChanged();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        'Could not save lead';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead || !iUser) return;
    setDeleting(true);
    try {
      await deleteChessLead(lead._id);
      await createChessLeadLog({
        leadRef: lead._id,
        leadId: lead.leadId,
        operation: 'delete',
        userName:
          `${iUser.firstName || ''} ${iUser.lastName || ''}`.trim() || iUser.email,
        userRef: iUser._id,
        oldData: lead,
      });
      toast.success('Lead deleted');
      onChanged();
      onClose();
    } catch {
      toast.error('Could not delete lead');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 520 }, p: 0 } }}
      >
        <Box
          sx={{
            p: 2.5,
            background: tokens.gradients.pinkBlue,
            color: '#fff',
            position: 'relative',
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: '#fff',
              '&:hover': { bgcolor: alpha('#fff', 0.15) },
            }}
          >
            <IconX size={18} />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ letterSpacing: '0.14em', fontWeight: 800, opacity: 0.85 }}
          >
            {lead?.leadId || (loading ? 'LOADING…' : 'LEAD')}
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '1.35rem', mt: 0.25 }}>
            {lead?.academyName || (loading ? 'Loading…' : '—')}
          </Typography>
          {lead && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={lead.status}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
              <Chip
                size="small"
                label={lead.priority}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          {loading && !lead ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress size={22} />
            </Stack>
          ) : lead ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Field label="Subscription date" value={fmtDate(lead.subscriptionDate)} />
                <Field
                  label="Next follow-up"
                  value={fmtDate(lead.nextFollowUpDate)}
                  highlight={isOverdue(lead.nextFollowUpDate)}
                />
                <Field label="Total IDs" value={lead.totalIds ?? '—'} />
                <Field
                  label="Pricing per ID"
                  value={
                    lead.pricingPerId != null
                      ? `₹${lead.pricingPerId.toLocaleString('en-IN')}`
                      : '—'
                  }
                />
                <Field label="Mobile" value={lead.mobileNumber || '—'} />
                <Field label="Location" value={formatLocation(lead)} />
                <Field label="Last renewal" value={fmtDate(lead.lastRenewalDate)} />
                <Field label="Country" value={lead.country || '—'} />
              </Box>

              <PricingSummary
                totalIds={lead.totalIds}
                pricingPerId={lead.pricingPerId}
                gstPercent={lead.gstPercent}
              />

              {lead.reason && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'text.secondary',
                    }}
                  >
                    Reason / notes
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {lead.reason}
                  </Typography>
                </Box>
              )}

              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<IconEdit size={16} />}
                  onClick={() => setEditOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Edit lead
                </Button>
                {canDelete && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash size={16} />}
                    onClick={() => setConfirmDelete(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    Delete
                  </Button>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <IconHistory size={16} color={tokens.colors.blueDark} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  Audit log
                </Typography>
                <Chip
                  size="small"
                  label={logs.length}
                  sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                />
              </Stack>

              {logs.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No activity recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1.25} sx={{ pl: 1, borderLeft: `2px solid ${alpha(tokens.colors.blue, 0.15)}` }}>
                  {logs.map((log) => (
                    <LogRow key={log._id} log={log} />
                  ))}
                </Stack>
              )}
            </>
          ) : (
            <Typography color="text.secondary">Lead not found.</Typography>
          )}
        </Box>
      </Drawer>

      <ChessLeadForm
        open={editOpen}
        initial={lead}
        saving={saving}
        onClose={() => !saving && setEditOpen(false)}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete ${lead?.leadId || 'lead'}?`}
        description="This permanently removes the lead. Audit trail is preserved."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        tone="danger"
      />
    </>
  );
}

function PricingSummary({
  totalIds,
  pricingPerId,
  gstPercent,
}: {
  totalIds?: number;
  pricingPerId?: number;
  gstPercent?: number;
}) {
  const { subtotal, gstAmount, grandTotal } = computePricing(
    totalIds,
    pricingPerId,
    gstPercent,
  );
  if (subtotal === 0) return null;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
        bgcolor: alpha(tokens.colors.blue, 0.03),
        mb: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: tokens.colors.blueDark,
          fontSize: '0.65rem',
          display: 'block',
          mb: 0.5,
        }}
      >
        Pricing
      </Typography>
      <Stack direction="row" spacing={2}>
        <SummaryCell label="Subtotal" value={subtotal} />
        <SummaryCell label={`GST (${gstPercent ?? 18}%)`} value={gstAmount} />
        <SummaryCell label="Total" value={grandTotal} bold />
      </Stack>
    </Box>
  );
}

function SummaryCell({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: bold ? 900 : 700,
          fontSize: bold ? '1rem' : '0.85rem',
          color: bold ? tokens.colors.pinkDark : 'text.primary',
        }}
      >
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'text.secondary',
          fontSize: '0.65rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.9rem',
          color: highlight ? '#EF4444' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function LogRow({ log }: { log: ChessLeadLog }) {
  const isCreate = log.operation === 'create';
  const isDelete = log.operation === 'delete';
  const dot = isCreate ? '#10B981' : isDelete ? '#EF4444' : tokens.colors.blueDark;
  return (
    <Box sx={{ pl: 1.25, position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          left: -5,
          top: 6,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: dot,
        }}
      />
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
        {log.userName} · {log.operation}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {moment(log.createdAt).fromNow()} · {moment(log.createdAt).format('MMM D, YYYY h:mm a')}
      </Typography>
      {log.operation === 'update' && log.newData && (
        <Box sx={{ mt: 0.5, pl: 0.5 }}>
          {Object.entries(log.newData as Record<string, unknown>).map(([k, v]) => {
            const label = READABLE_FIELD[k] || k;
            const before = (log.oldData as Record<string, unknown> | undefined)?.[k];
            return (
              <Typography key={k} variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {label}:
                </Box>{' '}
                {fmtVal(before) !== '—' && (
                  <>
                    <Box component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {fmtVal(before)}
                    </Box>{' '}
                    →{' '}
                  </>
                )}
                <Box component="span" sx={{ fontWeight: 700, color: dot }}>
                  {fmtVal(v)}
                </Box>
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/** Renders "City, State" — or falls back to the legacy free-text field
 *  for old rows that pre-date the country/state/city triplet. */
function formatLocation(lead: ChessLead): string {
  const parts = [lead.city, lead.state].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return lead.stateOrCity || '—';
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const m = moment(iso, 'YYYY-MM-DD', true);
  return m.isValid() ? m.format('MMM D, YYYY') : iso;
}

function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  return iso < moment().format('YYYY-MM-DD');
}

function fmtVal(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
// Priority colors imported for potential inline chip use; keeps the
// symbol tree-shaken but referenced so ESLint doesn't complain.
void CHESS_PRIORITY_COLORS;
void CHESS_STATUS_COLORS;
