import {
  Autocomplete,
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
  Typography,
  alpha,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconCalendarMonth,
  IconCash,
  IconChevronRight,
  IconDownload,
  IconFileInvoice,
  IconMail,
  IconRotate,
  IconSend,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { tokens } from '../../../../theme/theme';
import { IProject } from '../../../../Interfaces/project';
import {
  IInvoice,
  InvoiceStatus,
} from '../../../../Interfaces/invoice';
import {
  deleteInvoice,
  invoicesList,
  markInvoicePaid,
  markInvoiceUnpaid,
  raiseInvoice,
  resendInvoiceEmail,
  updateInvoice,
} from '../../../../services/invoiceApi';
import { uploadFile } from '../../../../services/storageApi';
import { getTimesheetByMonth } from '../../../../services/timesheetApi';
import { ITimesheetScreenshot } from '../../../../Interfaces/timesheet';
import { formatMoney } from '../../../../utils/money';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../../../Interfaces/iUser';
import InvoiceDraftEditor, {
  DraftEditorState,
} from './InvoiceDraftEditor';
import InvoicePreview from './InvoicePreview';
import { renderInvoicePdf } from './downloadInvoicePdf';

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: '#5A6A85',
  Raised: tokens.colors.blueDark,
  Paid: '#10B981',
  Due: '#EF4444',
};

function StatusChip({ status }: { status: InvoiceStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.375,
        borderRadius: '6px',
        bgcolor: alpha(color, 0.12),
        color,
        height: 24,
      }}
    >
      <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.7rem' }}>
        {status}
      </Typography>
    </Box>
  );
}

interface Props {
  project: IProject;
  /** Bumped by parent to force a list reload (e.g. after approval). */
  refreshKey?: number;
}

export default function InvoicesPanel({ project, refreshKey = 0 }: Props) {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IInvoice | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesList(`projectRef=${project._id}&limit=200`);
      setInvoices(res.data?.data?.results || []);
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshKey]);

  const grouped = useMemo(() => {
    const byStatus: Record<InvoiceStatus, IInvoice[]> = {
      Draft: [],
      Raised: [],
      Due: [],
      Paid: [],
    };
    for (const inv of invoices) {
      byStatus[inv.status].push(inv);
    }
    return byStatus;
  }, [invoices]);

  const handleUpdated = (inv: IInvoice) => {
    setInvoices((prev) =>
      prev.map((p) => (p._id === inv._id ? inv : p))
    );
    setSelected(inv);
  };

  const handleRemoved = (id: string) => {
    setInvoices((prev) => prev.filter((p) => p._id !== id));
    setSelected(null);
  };

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.pink, 0.1),
            color: tokens.colors.pinkDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconFileInvoice size={18} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800}>Invoices</Typography>
          <Typography variant="caption" color="text.secondary">
            Auto-generated when super-admin approves the month's timesheets.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Stack direction="row" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Stack>
      ) : invoices.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>No invoices yet</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Fill the timesheets and submit for approval — invoices land here once approved.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {(['Draft', 'Raised', 'Due', 'Paid'] as InvoiceStatus[])
            .filter((s) => grouped[s].length > 0)
            .map((s) => (
              <Box key={s}>
                <Typography
                  variant="caption"
                  sx={{
                    color: STATUS_COLORS[s],
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: '0.66rem',
                    ml: 0.5,
                  }}
                >
                  {s} ({grouped[s].length})
                </Typography>
                <Stack spacing={1} sx={{ mt: 0.5 }}>
                  {grouped[s].map((inv) => (
                    <Box
                      key={inv._id}
                      onClick={() => setSelected(inv)}
                      sx={{
                        cursor: 'pointer',
                        p: 1.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: alpha(STATUS_COLORS[inv.status], 0.4),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(STATUS_COLORS[inv.status], 0.1)}`,
                        },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={800} sx={{ color: tokens.colors.pinkDark }}>
                            {inv.invoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            · {inv.periodMonth}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {inv.lineItems.length} item(s)
                          {inv.dueDate && ` · due ${moment(inv.dueDate).format('MMM D, YYYY')}`}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
                        {formatMoney(inv.total, inv.currency)}
                      </Typography>
                      <StatusChip status={inv.status} />
                      <IconChevronRight size={16} color={tokens.colors.lightTextSecondary} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
        </Stack>
      )}

      <InvoiceModal
        project={project}
        invoice={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
        onRemoved={handleRemoved}
      />
    </Stack>
  );
}

// ─── Modal with three modes: Draft / Raised|Due / Paid ─────────────────────

function InvoiceModal({
  project,
  invoice,
  onClose,
  onUpdated,
  onRemoved,
}: {
  project: IProject;
  invoice: IInvoice | null;
  onClose: () => void;
  onUpdated: (i: IInvoice) => void;
  onRemoved: (id: string) => void;
}) {
  const [draft, setDraft] = useState<DraftEditorState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [raising, setRaising] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingUnpaid, setPendingUnpaid] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidForm, setPaidForm] = useState({
    paidOn: moment().format('YYYY-MM-DD'),
    paymentReference: '',
    paymentNotes: '',
  });
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Email editor + confirm flow state. The same dialog now backs both flows:
  //   - 'raise'  → Draft → Raised, calls raiseInvoice on confirm
  //   - 'resend' → Raised/Due, calls resendInvoiceEmail on confirm
  // Dialog UI branches on `dialogMode` for title, button label, and which
  // server endpoint runs.
  const [emailOpen, setEmailOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'raise' | 'resend'>('raise');
  const [emailForm, setEmailForm] = useState<{
    to: string[];
    cc: string[];
    subject: string;
    body: string;
  }>({
    to: [],
    cc: [],
    subject: '',
    body: '',
  });
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);

  // Attachments preview — populated when the email dialog opens so the admin
  // can eyeball what's actually going out. PDF is synthetic (generated on
  // Raise); screenshots come from the month's Timesheet doc.
  const [attachmentScreenshots, setAttachmentScreenshots] = useState<
    ITimesheetScreenshot[]
  >([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Only super-admin + admin can edit invoice number / issue date.
  const { iUser } = useAuth();
  const canEditMeta =
    (iUser?.role?.includes(UserRole['super-admin']) ||
      iUser?.role?.includes(UserRole.admin)) ??
    false;

  useEffect(() => {
    if (invoice && invoice.status === 'Draft') {
      // Default issueDate to today so admins don't have to type it for every
      // fresh draft — still fully editable in the override strip.
      setDraft({
        lineItems: invoice.lineItems,
        taxPercent: invoice.taxPercent,
        taxLabel: invoice.taxLabel,
        notes: invoice.notes,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate || moment().format('YYYY-MM-DD'),
        // Pre-seed the manual due-date override only when the invoice
        // already carries one (rare on a fresh draft — usually empty).
        // Empty here means the editor's auto-suggest will populate the
        // visible field from issueDate + paymentTerms.days.
        dueDate: invoice.dueDate || '',
      });
      setDirty(false);
    } else {
      setDraft(null);
    }
  }, [invoice]);

  if (!invoice) return null;
  // Bind to a local so async handlers don't re-trigger TS's "possibly null"
  // narrowing when `invoice` is read inside them later.
  const inv = invoice;
  const isDraft = inv.status === 'Draft';

  async function handleSaveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await updateInvoice(inv._id, draft);
      if (res.data?.data) {
        onUpdated(res.data.data);
        setDirty(false);
        toast.success('Draft saved');
      }
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  }

  /** Pre-fill + open the email-editor dialog.
   *
   *  - In `raise` mode (Draft → Raised), recipients default to whichever
   *    flags are set on the project's invoiceRecipients.
   *  - In `resend` mode (already Raised/Due), recipients default to the
   *    invoice's last-send `emailedTo` / `emailedCc` so the operator edits
   *    the actual previous message instead of the project defaults.
   *
   *  Also fetches the month's screenshots so the attachments preview shows
   *  the admin exactly what will ride along with the email. */
  async function handleOpenEmailEditor(mode: 'raise' | 'resend' = 'raise') {
    setDialogMode(mode);

    let toDefaults: string[] = [];
    let ccDefaults: string[] = [];
    let subjectDefault = `Invoice ${inv.invoiceNumber} — ${inv.organizationName}`;
    let bodyDefault = `Hi,\n\nPlease find attached invoice ${inv.invoiceNumber} for ${inv.periodMonth}.\n\nThanks.`;

    if (mode === 'resend') {
      // Restore the actual previous send so the operator edits exactly what
      // was last delivered. Fall back to project flags when the invoice was
      // raised before this metadata existed (legacy rows).
      toDefaults = (inv.emailedTo || []).filter(Boolean);
      ccDefaults = (inv.emailedCc || []).filter(Boolean);
      if (inv.emailedSubject) subjectDefault = inv.emailedSubject;
      if (inv.emailedBody) bodyDefault = inv.emailedBody;
    }

    if (toDefaults.length === 0) {
      const flags = project.invoiceRecipients;
      if (flags?.client && project.clientEmail) toDefaults.push(project.clientEmail);
      if (flags?.vendor && project.vendorEmail) toDefaults.push(project.vendorEmail);
      if (flags?.primeVendor && project.primeVendorEmail)
        toDefaults.push(project.primeVendorEmail);
      (flags?.customEmails || []).forEach((e) => toDefaults.push(e));
    }

    setEmailForm({
      to: toDefaults,
      cc: ccDefaults,
      subject: subjectDefault,
      body: bodyDefault,
    });
    setEmailOpen(true);

    // Fire the screenshot fetch in parallel — the dialog renders a skeleton
    // while this resolves. Failure isn't blocking; admin just sees an empty
    // attachments list + warning.
    setLoadingAttachments(true);
    try {
      const res = await getTimesheetByMonth(inv.projectRef, inv.periodMonth);
      setAttachmentScreenshots(res.data?.data?.screenshots || []);
    } catch {
      setAttachmentScreenshots([]);
    } finally {
      setLoadingAttachments(false);
    }
  }

  /** Second step — admin confirms the recipient + amount before we actually send. */
  function handleProceedToConfirm() {
    const tos = emailForm.to.map((s) => s.trim()).filter(Boolean);
    if (tos.length === 0 || !tos.every((e) => e.includes('@'))) {
      toast.error('Enter at least one valid recipient in "To"');
      return;
    }
    setEmailConfirmOpen(true);
  }

  /** Final step — render PDF, upload, then either raise or resend depending
   *  on which mode the dialog opened in. Same UX, different endpoint. */
  async function handleSendFromDialog() {
    setRaising(true);
    try {
      // For raise: persist any dirty draft first so the PDF reflects the
      // final state. Resend skips this — the invoice is already raised.
      if (dialogMode === 'raise' && dirty && draft) {
        const save = await updateInvoice(inv._id, draft);
        if (save.data?.data) onUpdated(save.data.data);
      }

      let pdfUrl: string | undefined;
      try {
        if (previewRef.current) {
          const blob = (await renderInvoicePdf(previewRef.current, {
            asBlob: true,
            filename: `${inv.invoiceNumber}.pdf`,
          })) as Blob;
          if (blob) {
            const file = new File([blob], `${inv.invoiceNumber}.pdf`, {
              type: 'application/pdf',
            });
            const up = await uploadFile(file, 'invoice');
            pdfUrl = up.data?.data?.url;
          }
        }
      } catch (e) {
        console.warn('PDF render/upload failed — sending without attachment', e);
      }

      const toList = emailForm.to.map((s) => s.trim()).filter(Boolean);
      const ccList = emailForm.cc.map((s) => s.trim()).filter(Boolean);

      const res =
        dialogMode === 'raise'
          ? await raiseInvoice(inv._id, {
              pdfUrl,
              to: toList,
              cc: ccList,
              subject: emailForm.subject,
              body: emailForm.body,
              // Pass the admin's issueDate + dueDate overrides through
              // to the server. Empty / undefined values fall back to
              // today (issue) and issue + paymentTerms.days (due).
              issueDate: draft?.issueDate || undefined,
              dueDate: draft?.dueDate || undefined,
            })
          : await resendInvoiceEmail(inv._id, {
              pdfUrl,
              to: toList,
              cc: ccList,
              subject: emailForm.subject,
              body: emailForm.body,
            });
      if (res.data?.data) {
        onUpdated(res.data.data);
        toast.success(
          dialogMode === 'raise' ? 'Invoice raised + emailed' : 'Email sent'
        );
        setEmailConfirmOpen(false);
        setEmailOpen(false);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (dialogMode === 'raise' ? 'Raise failed' : 'Resend failed');
      toast.error(msg);
    } finally {
      setRaising(false);
    }
  }

  async function handleMarkPaid() {
    try {
      const res = await markInvoicePaid(inv._id, paidForm);
      if (res.data?.data) {
        onUpdated(res.data.data);
        toast.success('Marked paid');
        setPaidOpen(false);
      }
    } catch {
      toast.error('Could not mark paid');
    }
  }

  async function handleMarkUnpaid() {
    const res = await markInvoiceUnpaid(inv._id);
    if (res.data?.data) {
      onUpdated(res.data.data);
      toast.success('Reverted to unpaid');
      setPendingUnpaid(false);
    }
  }

  async function handleDelete() {
    const res = await deleteInvoice(inv._id);
    if (res.data?.data) {
      onRemoved(inv._id);
      toast.success('Draft deleted');
    }
    setPendingDelete(false);
  }

  /** Resend hops back into the same compose dialog used for Raise — mode
   *  switches to 'resend', which prefills To/CC/Subject/Body from the
   *  invoice's last-send metadata so the operator edits the actual previous
   *  message instead of starting from project defaults. */
  function handleResend() {
    handleOpenEmailEditor('resend');
  }

  async function handleDownload() {
    if (!previewRef.current) return;
    await renderInvoicePdf(previewRef.current, {
      filename: `${inv.invoiceNumber}.pdf`,
    });
  }

  return (
    <Dialog
      open={!!invoice}
      onClose={saving || raising ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: alpha(tokens.colors.pink, 0.1),
            color: tokens.colors.pinkDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconFileInvoice size={16} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800}>{inv.invoiceNumber}</Typography>
          <Typography variant="caption" color="text.secondary">
            {inv.periodMonth} · {inv.status}
          </Typography>
        </Box>
        <StatusChip status={inv.status} />
        <IconButton size="small" onClick={onClose} disabled={saving || raising}>
          <IconX size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isDraft && draft ? (
          <InvoiceDraftEditor
            value={draft}
            currency={inv.currency}
            canEditMeta={canEditMeta}
            paymentTermsDays={project.paymentTerms?.days ?? 30}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {/* For Raised/Paid/Due, we render the preview read-only — still
                referenced for the download action via `previewRef`. */}
          </Box>
        )}

        {/* InvoicePreview always mounts (off-flow but reachable) so download
            and Raise can capture it. Hidden visually for the draft editor. */}
        <Box
          sx={{
            mt: isDraft ? 3 : 0,
            borderTop: isDraft ? '1px dashed' : 'none',
            borderColor: 'grey.200',
            pt: isDraft ? 2.5 : 0,
          }}
        >
          {!isDraft && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                display: 'block',
                mb: 1,
              }}
            >
              Invoice preview
            </Typography>
          )}
          {isDraft && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                display: 'block',
                mb: 1,
              }}
            >
              Preview (saved on raise)
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              bgcolor: '#F4F6F8',
              p: 2,
              borderRadius: 3,
              overflow: 'auto',
            }}
          >
            <InvoicePreview
              ref={previewRef}
              invoice={
                isDraft && draft
                  ? {
                      ...invoice,
                      lineItems: draft.lineItems,
                      taxPercent: draft.taxPercent,
                      taxLabel: draft.taxLabel,
                      notes: draft.notes,
                      // Totals recomputed server-side on save; preview uses our calc
                      subtotal: sumLineItems(draft.lineItems),
                      taxAmount: Math.round(
                        (sumLineItems(draft.lineItems) * (draft.taxPercent || 0)) / 100 * 100
                      ) / 100,
                      total:
                        sumLineItems(draft.lineItems) +
                        Math.round(
                          (sumLineItems(draft.lineItems) * (draft.taxPercent || 0)) / 100 * 100
                        ) / 100,
                    }
                  : invoice
              }
              project={project}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {isDraft ? (
          <>
            <Button
              size="small"
              startIcon={<IconTrash size={14} />}
              onClick={() => setPendingDelete(true)}
              sx={{ textTransform: 'none', color: '#EF4444' }}
            >
              Delete draft
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={!dirty || saving}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleOpenEmailEditor('raise')}
              disabled={raising}
              startIcon={<IconSend size={14} />}
              sx={{
                background: tokens.gradients.pinkBlue,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                },
              }}
            >
              Raise & send
            </Button>
          </>
        ) : inv.status === 'Paid' ? (
          <>
            <Button
              size="small"
              startIcon={<IconRotate size={14} />}
              onClick={() => setPendingUnpaid(true)}
              sx={{ textTransform: 'none', color: tokens.colors.lightText }}
            >
              Mark unpaid
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              startIcon={<IconDownload size={14} />}
              onClick={handleDownload}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Download PDF
            </Button>
          </>
        ) : (
          // Raised or Due
          <>
            <Button
              size="small"
              startIcon={<IconMail size={14} />}
              onClick={handleResend}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Resend email
            </Button>
            <Button
              size="small"
              startIcon={<IconDownload size={14} />}
              onClick={handleDownload}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Download PDF
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              startIcon={<IconCash size={14} />}
              onClick={() => setPaidOpen(true)}
              sx={{
                bgcolor: '#10B981',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Mark paid
            </Button>
          </>
        )}
      </DialogActions>

      {/* Mark-paid form */}
      <Dialog open={paidOpen} onClose={() => setPaidOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconCalendarMonth size={16} />
          Mark as paid
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Paid on"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={paidForm.paidOn}
              onChange={(e) => setPaidForm((s) => ({ ...s, paidOn: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Payment reference"
              value={paidForm.paymentReference}
              onChange={(e) => setPaidForm((s) => ({ ...s, paymentReference: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Notes"
              multiline
              minRows={2}
              value={paidForm.paymentNotes}
              onChange={(e) => setPaidForm((s) => ({ ...s, paymentNotes: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaidOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleMarkPaid}
            sx={{
              bgcolor: '#10B981',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Mark paid
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={handleDelete}
        title="Delete this draft?"
        description={`${inv.invoiceNumber} will be removed. A new draft is regenerated only after a fresh approval.`}
        confirmLabel="Delete"
        tone="danger"
      />
      <ConfirmDialog
        open={pendingUnpaid}
        onClose={() => setPendingUnpaid(false)}
        onConfirm={handleMarkUnpaid}
        title="Revert to unpaid?"
        description="The invoice returns to Raised (or Due, if past due) and the payment details are cleared."
        confirmLabel="Revert"
        tone="warning"
      />

      {/* Step 1 of raise: editable email template */}
      <Dialog
        open={emailOpen}
        onClose={raising ? undefined : () => setEmailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <IconSend size={16} />
          {dialogMode === 'resend' ? 'Resend email' : 'Compose email'}
          {dialogMode === 'resend' && inv.emailedAt && (
            <Typography
              variant="caption"
              sx={{
                ml: 1,
                color: tokens.colors.lightTextSecondary,
                fontWeight: 600,
              }}
            >
              · last sent {moment(inv.emailedAt).format('MMM D, YYYY h:mm A')}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <EmailChipInput
              label="To"
              value={emailForm.to}
              onChange={(v) => setEmailForm((s) => ({ ...s, to: v }))}
              helperText="Enter, Tab, or comma adds an address. At least one valid email required."
            />
            <EmailChipInput
              label="CC"
              value={emailForm.cc}
              onChange={(v) => setEmailForm((s) => ({ ...s, cc: v }))}
              helperText="Optional"
            />
            <TextField
              size="small"
              label="Subject"
              value={emailForm.subject}
              onChange={(e) =>
                setEmailForm((s) => ({ ...s, subject: e.target.value }))
              }
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              size="small"
              label="Body"
              multiline
              minRows={5}
              value={emailForm.body}
              onChange={(e) =>
                setEmailForm((s) => ({ ...s, body: e.target.value }))
              }
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {/* Attachments preview — shows exactly what's riding along with
                this email so the admin can spot a missing screenshot before
                hitting send. */}
            <Box
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(tokens.colors.blue, 0.2),
                bgcolor: alpha(tokens.colors.blue, 0.03),
                overflow: 'hidden',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: alpha(tokens.colors.blue, 0.15),
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: tokens.colors.blueDark,
                  }}
                >
                  Attachments
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: tokens.colors.lightTextSecondary }}
                >
                  {loadingAttachments
                    ? 'resolving…'
                    : `${1 + attachmentScreenshots.length} file${
                        attachmentScreenshots.length === 0 ? '' : 's'
                      }`}
                </Typography>
                {loadingAttachments && <CircularProgress size={12} />}
              </Stack>

              <Stack>
                {/* Row 1: the generated invoice PDF */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderBottom:
                      attachmentScreenshots.length > 0
                        ? `1px solid ${alpha(tokens.colors.blue, 0.1)}`
                        : 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: alpha(tokens.colors.pink, 0.1),
                      color: tokens.colors.pinkDark,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                    }}
                  >
                    PDF
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        wordBreak: 'break-all',
                      }}
                    >
                      {inv.invoiceNumber}.pdf
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: tokens.colors.lightTextSecondary }}
                    >
                      generated from the preview on send
                    </Typography>
                  </Box>
                </Stack>

                {/* Row 2+: every week screenshot for this month */}
                {attachmentScreenshots.map((s) => (
                  <Stack
                    key={s._id || s.url}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderTop: `1px solid ${alpha(tokens.colors.blue, 0.08)}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(s.url, '_blank', 'noopener')}
                    >
                      <img
                        src={s.url}
                        alt={s.fileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          wordBreak: 'break-all',
                        }}
                      >
                        {s.fileName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: tokens.colors.lightTextSecondary }}
                      >
                        {s.weekLabel || `${s.weekStart} → ${s.weekEnd}`}
                      </Typography>
                    </Box>
                  </Stack>
                ))}

                {!loadingAttachments && attachmentScreenshots.length === 0 && (
                  <Box sx={{ px: 1.5, py: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: '#B45309', fontWeight: 600 }}
                    >
                      No timesheet screenshots found for {inv.periodMonth}.
                      Upload them on the Timesheets tab before sending if the
                      vendor expects proofs.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmailOpen(false)} disabled={raising}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProceedToConfirm}
            disabled={raising}
            sx={{
              background: tokens.gradients.pinkBlue,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
              },
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Step 2 of send: final confirmation. Same dialog backs raise + resend. */}
      <ConfirmDialog
        open={emailConfirmOpen}
        onClose={() => setEmailConfirmOpen(false)}
        onConfirm={handleSendFromDialog}
        title={
          dialogMode === 'resend' ? 'Resend this invoice?' : 'Send this invoice?'
        }
        description={
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The invoice PDF will be emailed to:
            </Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: alpha(tokens.colors.blue, 0.06),
                border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                mb: 1.5,
              }}
            >
              {project.vendorCompany || project.clientCompany || 'Recipient'}
              {' — '}
              {emailForm.to.join(', ')}
              {emailForm.cc.length > 0 && ` · cc ${emailForm.cc.join(', ')}`}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Total:{' '}
              <Box component="span" sx={{ color: tokens.colors.pinkDark }}>
                {inv.currency} {inv.total.toFixed(2)}
              </Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                display: 'block',
                mt: 0.75,
              }}
            >
              {1 + attachmentScreenshots.length} attachment
              {attachmentScreenshots.length === 0 ? '' : 's'} · PDF
              {attachmentScreenshots.length > 0
                ? ` + ${attachmentScreenshots.length} screenshot${attachmentScreenshots.length === 1 ? '' : 's'}`
                : ''}
            </Typography>
          </Box>
        }
        confirmLabel={raising ? 'Sending…' : 'Send now'}
        tone="neutral"
      />
    </Dialog>
  );
}

function sumLineItems(items: { amount: number }[]): number {
  const s = items.reduce(
    (acc, li) => acc + (Number.isFinite(li.amount) ? li.amount : 0),
    0
  );
  return Math.round(s * 100) / 100;
}

// ─── Chip-style email input ────────────────────────────────────────────────
//
// Used by the compose dialog for both `To` and `CC` fields. The user types
// addresses naturally; on Enter, Tab, comma, semicolon, or blur we commit
// whatever's in the input as a chip. Invalid (non-email) entries are kept as
// red outlined chips so the operator notices and fixes them — we don't
// silently drop typos. Click the X on any chip to remove it.
//
// Backed by MUI Autocomplete in `multiple freeSolo` mode, which gives chip
// rendering, keyboard navigation, and the standard X-to-remove behavior for
// free. Tab + blur commit are added on top because Autocomplete handles
// Enter natively but not those.

function isLikelyEmail(s: string): boolean {
  // Loose validator — same shape the server enforces (`includes("@")`) plus a
  // dot somewhere after to catch the most common typos. Not a full RFC 5322,
  // intentionally; the goal is operator-feedback, not bouncing bad input.
  return /\S+@\S+\.\S+/.test(s);
}

function EmailChipInput({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  helperText?: string;
}) {
  const [input, setInput] = useState('');

  // Split a freeform string into one-or-more email candidates, trim, dedup
  // against the current value, and append.
  const commitInput = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const seen = new Set(value);
    const next = [...value];
    for (const p of parts) {
      if (!seen.has(p)) {
        seen.add(p);
        next.push(p);
      }
    }
    onChange(next);
    setInput('');
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      // No suggestion list — operators paste / type addresses themselves.
      options={[] as string[]}
      value={value}
      inputValue={input}
      onInputChange={(_, v, reason) => {
        // 'reset' fires when Autocomplete clears the input after Enter — we
        // already cleared via setInput('') in commit, so let it through but
        // ignore so we don't fight it.
        if (reason === 'reset') return;
        setInput(v);
      }}
      onChange={(_, v) => {
        // Triggered by the built-in Enter / chip-delete paths. Always trust
        // the array Autocomplete hands us; commitInput doesn't run here.
        onChange(v as string[]);
      }}
      renderTags={(values, getTagProps) =>
        values.map((option, index) => {
          const valid = isLikelyEmail(option);
          const tagProps = getTagProps({ index });
          return (
            <Chip
              {...tagProps}
              key={tagProps.key}
              label={option}
              size="small"
              variant={valid ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                bgcolor: valid
                  ? alpha(tokens.colors.blue, 0.12)
                  : 'transparent',
                color: valid ? tokens.colors.blueDark : '#B91C1C',
                borderColor: valid
                  ? alpha(tokens.colors.blue, 0.3)
                  : '#FCA5A5',
                '& .MuiChip-deleteIcon': {
                  color: valid ? tokens.colors.blueDark : '#B91C1C',
                  '&:hover': {
                    color: valid ? tokens.colors.pinkDark : '#7F1D1D',
                  },
                },
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          helperText={helperText}
          // Tab and the typed delimiters (comma, semicolon) commit whatever
          // is in the input as a chip. Enter is handled by Autocomplete
          // natively. Blur also commits so a half-typed address doesn't get
          // silently lost when the user clicks elsewhere.
          onKeyDown={(e) => {
            if (
              (e.key === 'Tab' || e.key === ',' || e.key === ';') &&
              input.trim()
            ) {
              e.preventDefault();
              commitInput(input);
            }
          }}
          onBlur={() => {
            if (input.trim()) commitInput(input);
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}
    />
  );
}
