import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconArrowBackUp,
  IconCheck,
  IconDownload,
  IconFileText,
  IconMail,
  IconTrash,
  IconUserX,
  IconShieldCheck,
  IconUserCheck,
  IconX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import {
  getCandidate,
  startBgCheck,
  completeBgCheck,
  markInfoReceived,
  rejectCandidate,
  resendLink,
  deleteCandidate,
} from '../../services/onboardingApi';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import {
  ONBOARDING_DOC_KINDS,
  ONBOARDING_DOC_LABELS,
  OnboardingCandidate,
  OnboardingDocKind,
} from '../../Interfaces/onboarding';
import DocumentLetterRender from '../../components/onboarding/DocumentLetterRender';
import moment from 'moment';
import RequestInfoDialog from '../../components/onboarding/RequestInfoDialog';
import OfferLetterComposeDialog from '../../components/onboarding/OfferLetterComposeDialog';
import OfferLetterRender from '../../components/onboarding/OfferLetterRender';
import ReasonDialog from '../../components/onboarding/ReasonDialog';
import FormSnapshotPanel from '../../components/onboarding/FormSnapshotPanel';
import OnboardingTimeline from '../../components/onboarding/OnboardingTimeline';
import CandidateHero from '../../components/onboarding/CandidateHero';
import EditCandidateDialog from '../../components/onboarding/EditCandidateDialog';
import AuditLogPanel from '../../components/onboarding/AuditLogPanel';
import { downloadSlipAsPdf } from '../../components/salary/downloadSlipPdf';
import { tokens } from '../../theme';

/**
 * Local helper — which destructive flow is the ReasonDialog open for?
 * Two flows take a free-text reason: rejecting outright at any stage,
 * and failing the background check (which also rejects but stamps
 * the bg-check completion).
 */
type ReasonFlow =
  | null
  | { kind: 'reject' }
  | { kind: 'fail-bg-check' }
  | { kind: 'delete' };

/**
 * Right-side drawer with the candidate's full lifecycle view:
 *   - Vertical Stepper showing the journey.
 *   - Form snapshot (when submitted).
 *   - Contextual actions for the current stage.
 *   - Signed-offer modal when reaching offer-signed.
 */
interface Props {
  candidateId: string | null;
  onClose: () => void;
}

export default function OnboardingCandidateDrawer({
  candidateId,
  onClose,
}: Props) {
  const open = Boolean(candidateId);
  // Hard-delete is super-admin only — the server enforces the same
  // via the route guard, but we hide the button for everyone else
  // so the affordance never appears for HR / Admin users.
  const { iUser } = useAuth();
  const isSuperAdmin = Boolean(
    iUser?.role?.includes(UserRole['super-admin']),
  );
  // Anyone in the team-admin tier (super-admin, admin, HR) can edit
  // the basic candidate details. Server gate enforces the same.
  const canEditDetails = Boolean(
    iUser?.role?.includes(UserRole['super-admin']) ||
      iUser?.role?.includes(UserRole.admin) ||
      iUser?.role?.includes(UserRole.hr),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [doc, setDoc] = useState<OnboardingCandidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  // Which of the five signed docs is shown in the modal. Defaults to
  // the offer letter (the canonical "the offer" doc).
  type SignedTabKey = 'offer-letter' | OnboardingDocKind;
  const [signedTab, setSignedTab] = useState<SignedTabKey>('offer-letter');
  const [reasonFlow, setReasonFlow] = useState<ReasonFlow>(null);
  const signedRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    if (!candidateId) return;
    setLoading(true);
    try {
      const { data } = await getCandidate(candidateId);
      setDoc(data);
    } catch (e) {
      toast.error(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to load candidate.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (candidateId) load();
    else setDoc(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function wrap<T>(fn: () => Promise<T>, success: string): Promise<void> {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Action failed.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function downloadSignedOffer() {
    const el = signedRef.current?.querySelector(
      '.offer-letter-page',
    ) as HTMLElement | null;
    if (!el || !doc) {
      toast.error('Document not ready for download yet.');
      return;
    }
    const labels: Record<string, string> = {
      'offer-letter': 'offer-letter',
      ...ONBOARDING_DOC_KINDS.reduce<Record<string, string>>((acc, k) => {
        acc[k] = ONBOARDING_DOC_LABELS[k].replace(/\s+/g, '-').toLowerCase();
        return acc;
      }, {}),
    };
    const docSlug = labels[signedTab] || 'document';
    const name = `${doc.firstName}-${doc.lastName}-${docSlug}.pdf`
      .toLowerCase()
      .replace(/\s+/g, '-');
    await downloadSlipAsPdf(el, name);
  }

  // The drawer's `title` slot now stays empty — the visual chrome
  // (avatar + name + chips + contact) is the CandidateHero card,
  // rendered as the first child of the drawer body so it gets the
  // full content width.
  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={null}
      closeOnOutSideClick
    >
      {loading && (
        <Stack direction="row" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress size={26} />
        </Stack>
      )}

      {!loading && doc && (
        <Box sx={{ px: 1, pb: 4 }}>
          <Box sx={{ mb: 2.5 }}>
            <CandidateHero
              candidate={doc}
              busy={busy}
              onRefresh={load}
              onEdit={canEditDetails ? () => setEditOpen(true) : undefined}
            />
          </Box>

          {/* ── Progress Stepper ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Box sx={{ mb: 3 }}>
              <OnboardingTimeline candidate={doc} />
              {doc.stage === 'info-requested' && (
                <Box
                  sx={{
                    mt: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(tokens.colors.warning, 0.08),
                    border: '1px solid',
                    borderColor: alpha(tokens.colors.warning, 0.25),
                  }}
                >
                  <Typography
                    sx={{
                      color: tokens.colors.warning,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Awaiting follow-up information from candidate.
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>

          {/* ── Actions panel ─────────────────────────────────── */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Typography fontWeight={800} sx={{ mb: 1.5, fontSize: 13 }}>
              Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {/* Stage-specific buttons */}
              {doc.stage === 'invited' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<IconMail size={14} />}
                  disabled={busy}
                  onClick={() =>
                    wrap(
                      () => resendLink(doc._id, 'onboarding-form'),
                      'Onboarding link re-sent.',
                    )
                  }
                >
                  Resend onboarding link
                </Button>
              )}
              {doc.stage === 'form-submitted' && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<IconMail size={14} />}
                    disabled={busy}
                    onClick={() => setRequestInfoOpen(true)}
                  >
                    Request more info
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<IconShieldCheck size={14} />}
                    disabled={busy}
                    onClick={() =>
                      wrap(
                        () => startBgCheck(doc._id),
                        'Background check started; candidate notified.',
                      )
                    }
                  >
                    Move to BG check
                  </Button>
                </>
              )}
              {doc.stage === 'info-requested' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<IconArrowBackUp size={14} />}
                    disabled={busy}
                    onClick={() =>
                      wrap(
                        () => markInfoReceived(doc._id),
                        'Marked info received — back to Form Submitted.',
                      )
                    }
                  >
                    Mark info received
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<IconMail size={14} />}
                    disabled={busy}
                    onClick={() => setRequestInfoOpen(true)}
                  >
                    Resend ask
                  </Button>
                </>
              )}
              {doc.stage === 'bg-check' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<IconCheck size={14} />}
                    disabled={busy}
                    onClick={() =>
                      wrap(
                        () => completeBgCheck(doc._id, true),
                        'Background check passed.',
                      )
                    }
                  >
                    Mark passed
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<IconUserX size={14} />}
                    disabled={busy}
                    onClick={() => setReasonFlow({ kind: 'fail-bg-check' })}
                  >
                    Mark failed
                  </Button>
                </>
              )}
              {doc.stage === 'bg-check-passed' && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<IconFileText size={14} />}
                  disabled={busy}
                  onClick={() => setOfferOpen(true)}
                >
                  Generate offer letter
                </Button>
              )}
              {doc.stage === 'offer-sent' && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<IconMail size={14} />}
                    disabled={busy}
                    onClick={() =>
                      wrap(
                        () => resendLink(doc._id, 'offer-letter'),
                        'Offer link re-sent.',
                      )
                    }
                  >
                    Resend offer link
                  </Button>
                </>
              )}
              {(doc.stage === 'offer-signed' ||
                doc.stage === 'onboarded') && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<IconUserCheck size={14} />}
                  onClick={() => setSignedOpen(true)}
                >
                  View signed documents
                </Button>
              )}

              {/* Reject — available at any stage except already-signed/rejected */}
              {doc.stage !== 'offer-signed' &&
                doc.stage !== 'onboarded' &&
                doc.stage !== 'rejected' && (
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<IconUserX size={14} />}
                  disabled={busy}
                  onClick={() => setReasonFlow({ kind: 'reject' })}
                >
                  Reject
                </Button>
              )}
            </Stack>
          </Box>

          {/* ── Form snapshot ────────────────────────────────── */}
          {doc.formData?.submittedAt && (
            <FormSnapshotPanel
              formData={doc.formData}
              candidateName={`${doc.firstName} ${doc.lastName}`}
            />
          )}

          {/* ── Audit log ────────────────────────────────────── */}
          <AuditLogPanel entries={doc.auditLog || []} />

          {/* ── Danger zone (super-admin only) ───────────────── */}
          {/*
            Lives outside the workflow "Actions" panel so it stays
            findable for every stage — including terminal ones like
            "Onboarded" and "Rejected" where the actions row is sparse.
            Hard delete cascades to S3 uploads + public-link tokens.
          */}
          {isSuperAdmin && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(tokens.colors.error, 0.3),
                bgcolor: alpha(tokens.colors.error, 0.03),
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      color: tokens.colors.error,
                      lineHeight: 1.15,
                    }}
                  >
                    Danger zone
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Permanently remove this candidate, every uploaded
                    document, and any outstanding magic-links. Use this
                    once they've left the company or the record is no
                    longer needed.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<IconTrash size={14} />}
                  disabled={busy}
                  onClick={() => setReasonFlow({ kind: 'delete' })}
                  sx={{ flexShrink: 0 }}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          )}

          {/* Dialogs */}
          <ReasonDialog
            open={reasonFlow?.kind === 'reject'}
            title={`Reject ${doc.firstName} ${doc.lastName}`}
            description="This permanently rejects the candidate. They keep their record but no further actions are possible. The reason is recorded for audit."
            placeholder="e.g. Position withdrawn, did not respond, declined verbally…"
            confirmLabel="Reject candidate"
            onClose={() => setReasonFlow(null)}
            onConfirm={async (reason) => {
              await rejectCandidate(doc._id, reason);
              toast.success('Candidate rejected.');
              await load();
            }}
          />
          <ReasonDialog
            open={reasonFlow?.kind === 'fail-bg-check'}
            title="Mark background check failed"
            description="This rejects the candidate and stamps the background check completion. Reason is included on the candidate record."
            placeholder="e.g. Discrepancy in employment history, reference unreachable…"
            confirmLabel="Mark failed & reject"
            onClose={() => setReasonFlow(null)}
            onConfirm={async (reason) => {
              await completeBgCheck(doc._id, false, reason);
              toast.success('Background check marked failed.');
              await load();
            }}
          />
          <ReasonDialog
            open={reasonFlow?.kind === 'delete'}
            title={`Delete ${doc.firstName} ${doc.lastName}`}
            description="This permanently removes the candidate, every uploaded document from storage, and any outstanding magic-links. This action cannot be undone."
            placeholder="Why are you deleting this candidate? (audit trail)"
            confirmLabel="Yes, delete permanently"
            onClose={() => setReasonFlow(null)}
            onConfirm={async () => {
              const res = await deleteCandidate(doc._id);
              toast.success(
                `Candidate deleted. ${res.data.filesRemoved}/${res.data.filesAttempted} files removed.`,
              );
              // Close the drawer entirely — there's nothing left to show.
              onClose();
            }}
          />
          <RequestInfoDialog
            open={requestInfoOpen}
            candidateId={doc._id}
            candidateName={`${doc.firstName} ${doc.lastName}`}
            onClose={() => setRequestInfoOpen(false)}
            onSent={load}
          />
          <OfferLetterComposeDialog
            open={offerOpen}
            candidate={doc}
            onClose={() => setOfferOpen(false)}
            onSent={load}
          />
          <EditCandidateDialog
            open={editOpen}
            candidate={doc}
            onClose={() => setEditOpen(false)}
            onSaved={load}
          />

          {/* Signed documents modal — tabs across all five docs so
              HR / super-admin can review and download any of them. */}
          <Dialog
            open={signedOpen}
            onClose={() => setSignedOpen(false)}
            fullWidth
            maxWidth="lg"
          >
            <DialogTitle sx={{ pr: 6, pb: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Typography variant="h6" fontWeight={700}>
                  Signed onboarding documents
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="contained"
                    startIcon={<IconDownload size={16} />}
                    onClick={downloadSignedOffer}
                  >
                    Download PDF
                  </Button>
                </Stack>
              </Stack>
              <Tooltip title="Close" placement="left" arrow>
                <IconButton
                  onClick={() => setSignedOpen(false)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    color: 'text.secondary',
                  }}
                >
                  <IconX size={18} />
                </IconButton>
              </Tooltip>
              {/* Tab bar — one per doc, with a green check next to the
                  ones the candidate has signed. */}
              <Tabs
                value={signedTab}
                onChange={(_, v) => setSignedTab(v as SignedTabKey)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mt: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    minHeight: 36,
                  },
                }}
              >
                <Tab
                  value="offer-letter"
                  label={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                    >
                      <span>Offer Letter</span>
                      {doc.offer?.signedAt && (
                        <IconCheck size={12} color="green" />
                      )}
                    </Stack>
                  }
                />
                {ONBOARDING_DOC_KINDS.map((k) => {
                  const signed = (
                    doc.additionalSignedDocuments || []
                  ).some((d) => d.kind === k);
                  return (
                    <Tab
                      key={k}
                      value={k}
                      label={
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <span>{ONBOARDING_DOC_LABELS[k]}</span>
                          {signed && <IconCheck size={12} color="green" />}
                        </Stack>
                      }
                    />
                  );
                })}
              </Tabs>
            </DialogTitle>
            <DialogContent dividers>
              <Box ref={signedRef}>
                {signedTab === 'offer-letter' &&
                  doc.offer &&
                  doc.offer.templateAtSendTime && (
                    <OfferLetterRender
                      snapshot={doc.offer.snapshot}
                      template={doc.offer.templateAtSendTime}
                      signatureDataUrl={doc.offer.signatureDataUrl}
                      signatureMode={doc.offer.signatureMode}
                      signatureTypedName={doc.offer.signatureTypedName}
                      signedFullName={doc.offer.signedFullName}
                      signatureDate={doc.offer.signatureDate}
                      signedByEmail={doc.offer.signedByEmail}
                      signedFromIp={doc.offer.signedFromIp}
                      signedFromLocation={doc.offer.signedFromLocation}
                    />
                  )}
                {signedTab !== 'offer-letter' &&
                  (() => {
                    const snap = (doc.additionalDocSnapshots || []).find(
                      (s) => s.kind === signedTab,
                    );
                    const signedRecord = (
                      doc.additionalSignedDocuments || []
                    ).find((d) => d.kind === signedTab);
                    if (!snap) {
                      return (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography color="text.secondary">
                            No snapshot of this document exists for this
                            candidate. The offer was likely sent before
                            additional-document support was enabled.
                          </Typography>
                        </Box>
                      );
                    }
                    return (
                      <Box>
                        {!signedRecord && (
                          <Box
                            sx={{
                              mb: 2,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(tokens.colors.warning, 0.08),
                              border: '1px solid',
                              borderColor: alpha(tokens.colors.warning, 0.3),
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: tokens.colors.warning,
                                fontWeight: 700,
                              }}
                            >
                              The candidate hasn't signed this document yet.
                              You're viewing the unsigned snapshot.
                            </Typography>
                          </Box>
                        )}
                        <DocumentLetterRender
                          template={snap}
                          vars={{
                            firstName:
                              doc.offer?.snapshot?.name?.split(' ')[0] ||
                              doc.firstName,
                            lastName:
                              doc.offer?.snapshot?.name
                                ?.split(' ')
                                .slice(1)
                                .join(' ') || doc.lastName,
                            name:
                              doc.offer?.snapshot?.name ||
                              `${doc.firstName} ${doc.lastName}`,
                            position:
                              doc.offer?.snapshot?.position || doc.position,
                            probationMonths:
                              doc.offer?.snapshot?.probationMonths ||
                              doc.probationMonths,
                            startDate: doc.offer?.snapshot?.startDate
                              ? moment(doc.offer.snapshot.startDate).format(
                                  'DD MMM YYYY',
                                )
                              : undefined,
                            annualSalary: doc.offer?.snapshot?.annualSalary
                              ? new Intl.NumberFormat('en-IN').format(
                                  doc.offer.snapshot.annualSalary,
                                )
                              : undefined,
                          }}
                          signed={signedRecord}
                        />
                      </Box>
                    );
                  })()}
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      )}
    </CustomDrawer>
  );
}

