import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress,
  FormControl, IconButton, InputLabel, LinearProgress, MenuItem,
  Select, Stack, TextField, Tooltip, Typography, alpha,
} from '@mui/material';
import {
  IconUpload, IconX, IconFileText, IconRefresh, IconCheck,
  IconAlertTriangle, IconFolderOpen,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import JSZip from 'jszip';

import CustomDrawer from '../drawer/CustomDrawer';
import { tokens } from '../../theme/theme';
import { uploadFile } from '../../services/storageApi';
import {
  bulkCreateForm16,
  getForm16Lookup,
} from '../../services/form16Api';
import { Form16BulkRow, Form16LookupEmployee } from '../../Interfaces/form16';
import {
  getCurrentFYStart,
  getFYLabel,
} from '../../utils/fiscalYearUtil';
import {
  parseForm16Filename,
  matchEmployee,
  Form16MatchTier,
} from '../../utils/form16FilenameParser';

const MAX_BYTES = 10 * 1024 * 1024;
const PARALLEL_UPLOADS = 3;

interface Props {
  open: boolean;
  /** FY pre-selected on the admin grid; rows default to it. */
  defaultFYStart: number;
  onClose: () => void;
  /** Called after a successful run so the parent grid can refetch. */
  onUploaded: () => void;
}

type RowStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

interface Row {
  id: string;
  file: File;
  filename: string;
  sizeBytes: number;
  fyStart: number;
  employee?: Form16LookupEmployee;
  matchTier: Form16MatchTier;
  matchScore?: number;
  ambiguous?: boolean;
  status: RowStatus;
  loadedBytes: number;
  uploadedUrl?: string;
  errorMessage?: string;
  previewUrl?: string;          // object URL for the small preview iframe
  /** PAN extracted by the filename parser, surfaced on the row so the
   *  admin can visually verify what we detected even when the display
   *  filename has been ellipsis-truncated. */
  detectedPan?: string;
  /** FY label parsed from the filename (separate from the row's
   *  effective fyStart so the admin can tell when our parser found
   *  one vs. when the row inherits the session default). */
  detectedFYLabel?: string;
  /** Name fragment the parser pulled out, for sanity-checking the
   *  match when no PAN was present. */
  detectedName?: string;
  /** AbortController for the in-flight axios upload — used on cancel. */
  abort?: AbortController;
}

const FY_OPTIONS = (() => {
  const current = getCurrentFYStart();
  return Array.from({ length: 8 }, (_, i) => current - i);
})();

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function tierLabel(tier: Form16MatchTier): { label: string; color: string } | null {
  switch (tier) {
    case 'pan': return { label: 'Matched by PAN', color: '#10B981' };
    case 'employeeId': return { label: 'Matched by Employee ID', color: '#10B981' };
    case 'name-exact': return { label: 'Matched by name', color: '#10B981' };
    case 'name-fuzzy': return { label: 'Likely match (name)', color: '#F59E0B' };
    case 'none': return null;
  }
}

export default function UploadForm16Drawer({
  open,
  defaultFYStart,
  onClose,
  onUploaded,
}: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [employees, setEmployees] = useState<Form16LookupEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<{
    successCount: number;
    failureCount: number;
  } | null>(null);
  // Session-level financial year. Admin MUST pick this before the
  // file drop zone is enabled — guards against the easy mistake of
  // dropping a stack of PDFs and then realising they were all stamped
  // with the wrong FY. Starts unset every time the drawer opens; the
  // grid's selected FY is offered as a one-click "Use FY …" suggestion
  // (see SessionFYSelector below) so the common case stays single-click.
  const [sessionFY, setSessionFY] = useState<number | null>(null);
  // Counter used to mint unique row ids without depending on Date.now()
  // (which is mocked in some test environments).
  const rowSeq = useRef(0);
  // Hidden file input refs so the "Add files" button (which lives inside
  // the drawer body) can drive the underlying input without rendering
  // it visibly.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load the employee lookup list once per drawer open. Re-fetched on
  // each open so a newly-added employee shows up without a full page
  // reload.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setEmployeesLoading(true);
    getForm16Lookup()
      .then((r) => {
        if (cancelled) return;
        setEmployees(r.data || []);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Could not load the employee list for auto-matching.');
        setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  // Reset state every time the drawer opens — closing mid-batch
  // already aborted in-flight uploads; this clears the post-run
  // banner for the next session.
  useEffect(() => {
    if (open) {
      setRows([]);
      setRunning(false);
      setDone(null);
      // Force an explicit FY pick at the start of every session — the
      // grid's selected FY is offered as a one-click suggestion in the
      // selector but the admin still has to confirm it.
      setSessionFY(null);
    } else {
      // Revoke any object URLs we minted for previews so we don't leak.
      rows.forEach((r) => {
        if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function nextId() {
    rowSeq.current += 1;
    return `r${rowSeq.current}`;
  }

  function buildRowFromFile(file: File): Row {
    const parsed = parseForm16Filename(file.name);
    const match = matchEmployee(parsed, employees);
    const previewUrl = URL.createObjectURL(file);
    // Filename-parsed FY wins (handles a ZIP that mixes years), then
    // sessionFY, then the grid's pre-selected default as a last
    // resort. Files can't actually be added without sessionFY set
    // (the intake is gated below), but the chain stays defensive.
    return {
      id: nextId(),
      file,
      filename: file.name,
      sizeBytes: file.size,
      fyStart:
        parsed.fiscalYearStart ?? sessionFY ?? defaultFYStart,
      employee: match.employee,
      matchTier: match.tier,
      matchScore: match.score,
      ambiguous: match.ambiguous,
      detectedPan: parsed.pan,
      detectedFYLabel: parsed.fiscalYearStart
        ? getFYLabel(parsed.fiscalYearStart)
        : undefined,
      detectedName: parsed.employeeName,
      status: 'pending',
      loadedBytes: 0,
      previewUrl,
    };
  }

  /** Walk the file list. Any .zip gets extracted to its PDF entries
   *  in-browser via JSZip; non-PDF entries from inside a ZIP are
   *  silently skipped (with a single toast tally).
   *
   *  Hard cap: total file count (existing rows + this batch) must not
   *  exceed the number of active employees — at most one Form-16 per
   *  employee per FY, and the drawer is one upload session, so anything
   *  beyond that is almost certainly a mistake (wrong ZIP, dupe PDFs,
   *  etc). When the cap would be exceeded we reject the entire batch
   *  with one clear toast rather than silently truncating. */
  async function ingestFiles(files: FileList | File[]) {
    if (sessionFY === null) {
      toast.error('Pick a financial year first, then add your Form-16 files.');
      return;
    }
    if (employeesLoading) {
      toast.info('Hold on — still loading the employee list.');
      return;
    }
    if (employees.length === 0) {
      toast.error('No active employees on file. Add an employee first.');
      return;
    }
    const skippedFromZip: string[] = [];
    const addedRows: Row[] = [];
    for (const f of Array.from(files)) {
      const isZip =
        /\.zip$/i.test(f.name) ||
        f.type === 'application/zip' ||
        f.type === 'application/x-zip-compressed';
      if (isZip) {
        try {
          const zip = await JSZip.loadAsync(f);
          const entries = Object.values(zip.files);
          for (const entry of entries) {
            if (entry.dir) continue;
            if (!/\.pdf$/i.test(entry.name)) {
              skippedFromZip.push(entry.name);
              continue;
            }
            const blob = await entry.async('blob');
            // Some ZIP entries embed the original folder name in the
            // path; trim to just the filename so the matcher sees a
            // clean string.
            const baseName = entry.name.split('/').pop() || entry.name;
            const pdfFile = new File([blob], baseName, {
              type: 'application/pdf',
            });
            addedRows.push(buildRowFromFile(pdfFile));
          }
        } catch (err) {
          console.error('JSZip failed for', f.name, err);
          toast.error(`Could not read ${f.name} — is it a valid ZIP?`);
        }
      } else if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
        addedRows.push(buildRowFromFile(f));
      } else {
        skippedFromZip.push(f.name);
      }
    }

    // Cap check happens AFTER zip extraction so the comparison is
    // against the real PDF count, not the surface-level file count
    // (one ZIP could contain dozens of PDFs).
    const currentCount = rows.length;
    const proposedTotal = currentCount + addedRows.length;
    if (proposedTotal > employees.length) {
      // Revoke the preview URLs we minted for the rejected batch so
      // we don't leak object URLs when the rows never get rendered.
      addedRows.forEach((r) => {
        if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      });
      const remaining = Math.max(0, employees.length - currentCount);
      toast.error(
        `Total files (${proposedTotal}) exceed total active employees (${employees.length}). ` +
          (currentCount > 0
            ? `You can add at most ${remaining} more file${remaining === 1 ? '' : 's'}.`
            : `Pick at most ${employees.length} file${employees.length === 1 ? '' : 's'}.`),
      );
      return;
    }

    if (skippedFromZip.length > 0) {
      toast.info(
        `Skipped ${skippedFromZip.length} non-PDF file${
          skippedFromZip.length === 1 ? '' : 's'
        }.`,
      );
    }
    setRows((prev) => [...prev, ...addedRows]);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (list) void ingestFiles(list);
    // Reset so the SAME file can be re-picked later (the input keeps
    // the selection otherwise and onChange won't refire).
    e.target.value = '';
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (row?.previewUrl) URL.revokeObjectURL(row.previewUrl);
      if (row?.abort) row.abort.abort();
      return prev.filter((r) => r.id !== id);
    });
  }

  function setRowEmployee(id: string, employee: Form16LookupEmployee | null) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              employee: employee || undefined,
              // Manual pick clears any auto-match tier — the chip
              // hides so the admin doesn't see a stale "matched"
              // label after they override.
              matchTier: employee ? 'none' : r.matchTier,
              ambiguous: false,
            }
          : r,
      ),
    );
  }

  function setRowFY(id: string, fy: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, fyStart: fy } : r)),
    );
  }

  // Whether every row is ready for upload (has a file, an employee,
  // a valid FY, and respects the 10 MB cap).
  const allReady = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every(
      (r) =>
        !!r.employee &&
        Number.isFinite(r.fyStart) &&
        r.sizeBytes <= MAX_BYTES,
    );
  }, [rows]);

  const progress = useMemo(() => {
    if (rows.length === 0) return { pct: 0, label: '' };
    const totalBytes = rows.reduce((s, r) => s + r.sizeBytes, 0);
    const loadedBytes = rows.reduce(
      (s, r) => s + (r.status === 'uploaded' ? r.sizeBytes : r.loadedBytes),
      0,
    );
    const pct = totalBytes === 0 ? 0 : Math.min(100, (loadedBytes / totalBytes) * 100);
    const completed = rows.filter(
      (r) => r.status === 'uploaded' || r.status === 'failed',
    ).length;
    const inflight = rows.find((r) => r.status === 'uploading');
    const label = inflight
      ? `Uploading ${completed + 1} of ${rows.length} — ${inflight.employee?.name || inflight.filename}…`
      : `${completed} of ${rows.length} complete`;
    return { pct, label };
  }, [rows]);

  async function uploadRow(rowId: string): Promise<{ ok: boolean }> {
    // Read the latest row each time so updates from other concurrent
    // uploads (progress, status) don't get clobbered. Caller mutates
    // via setRows((prev) => …) below.
    const ctrl = new AbortController();
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, status: 'uploading', loadedBytes: 0, abort: ctrl, errorMessage: undefined }
          : r,
      ),
    );
    const row = await new Promise<Row | undefined>((resolve) => {
      // Read from latest state synchronously by using a setState
      // callback purely as a snapshot (returning prev unchanged).
      setRows((prev) => {
        resolve(prev.find((r) => r.id === rowId));
        return prev;
      });
    });
    if (!row) return { ok: false };

    try {
      const res = await uploadFile(row.file, 'form16', {
        signal: ctrl.signal,
        onProgress: (loaded, total) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, loadedBytes: total ? Math.min(loaded, total) : loaded }
                : r,
            ),
          );
        },
      });
      const url = res.data?.data?.url || '';
      if (!url) throw new Error('Server returned an empty URL.');
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, status: 'uploaded', loadedBytes: r.sizeBytes, uploadedUrl: url }
            : r,
        ),
      );
      return { ok: true };
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        'Upload failed.';
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, status: 'failed', errorMessage: message }
            : r,
        ),
      );
      return { ok: false };
    }
  }

  /** Upload all PENDING / FAILED rows. Failed rows get retried, so
   *  the same handler powers both first-run and the row-level retry
   *  buttons that appear after a partial failure. */
  async function runUploadsAndPublish() {
    if (!allReady) {
      toast.error('Pick an employee for every row before uploading.');
      return;
    }
    setRunning(true);
    setDone(null);

    // Snapshot the row ids we'll work on (PENDING or FAILED).
    const rowSnapshot: Row[] = await new Promise((resolve) => {
      setRows((prev) => {
        resolve(prev);
        return prev;
      });
    });
    const targets = rowSnapshot
      .filter((r) => r.status === 'pending' || r.status === 'failed')
      .map((r) => r.id);

    // Concurrency-capped pool — pull row ids off the queue and spawn
    // workers up to PARALLEL_UPLOADS. Keeps memory bounded even on a
    // 50-PDF batch.
    let cursor = 0;
    async function worker() {
      while (cursor < targets.length) {
        const idx = cursor++;
        const id = targets[idx];
        await uploadRow(id);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL_UPLOADS, targets.length) }, () =>
        worker(),
      ),
    );

    // Read the FINAL row state and post the successful ones to
    // /form16/bulk. One round-trip — server creates + publishes
    // atomically.
    const final: Row[] = await new Promise((resolve) => {
      setRows((prev) => {
        resolve(prev);
        return prev;
      });
    });
    const uploaded = final.filter((r) => r.status === 'uploaded' && r.uploadedUrl);

    let successCount = 0;
    let failureCount = final.filter((r) => r.status === 'failed').length;
    if (uploaded.length > 0) {
      try {
        const bulkRows: Form16BulkRow[] = uploaded.map((r) => ({
          userId: r.employee!.userId,
          fiscalYearStart: r.fyStart,
          fileUrl: r.uploadedUrl!,
          originalFilename: r.filename,
          fileSizeBytes: r.sizeBytes,
        }));
        const resp = await bulkCreateForm16({
          publishImmediately: true,
          rows: bulkRows,
        });
        successCount = resp.data.success.length;
        // The bulk endpoint can fail individual rows even after the
        // file has been uploaded (e.g. user deleted between the
        // upload and the bulk POST). Mark those rows as failed so
        // the admin can retry them.
        const errors = resp.data.errors || [];
        if (errors.length > 0) {
          failureCount += errors.length;
          // Map bulk-row index → row id. The order of `bulkRows`
          // matches the order of `uploaded`.
          const failedIds = new Set(
            errors.map((e) => uploaded[e.index]?.id).filter(Boolean) as string[],
          );
          setRows((prev) =>
            prev.map((r) =>
              failedIds.has(r.id)
                ? { ...r, status: 'failed' as RowStatus, errorMessage: errors.find((e) => uploaded[e.index]?.id === r.id)?.error || 'Publish failed.' }
                : r,
            ),
          );
        }
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ||
          (err as Error)?.message ||
          'Bulk publish failed.';
        toast.error(message);
        // If the bulk call itself failed (network), every uploaded
        // row is in limbo — mark them as failed so the admin can
        // retry. The S3 objects exist but no DB rows yet — the bulk
        // endpoint will overwrite them on retry (idempotent upsert).
        failureCount += uploaded.length;
        setRows((prev) =>
          prev.map((r) =>
            uploaded.some((u) => u.id === r.id)
              ? { ...r, status: 'failed' as RowStatus, errorMessage: message }
              : r,
          ),
        );
      }
    }

    setRunning(false);
    setDone({ successCount, failureCount });
    if (successCount > 0) {
      onUploaded();
    }
  }

  function handleClose() {
    if (running) {
      // Abort any in-flight uploads before closing.
      rows.forEach((r) => {
        if (r.abort && r.status === 'uploading') r.abort.abort();
      });
    }
    onClose();
  }

  return (
    <CustomDrawer
      open={open}
      title={
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <IconUpload size={20} />
          <Typography variant="h6" fontWeight={700}>
            Upload Form-16
          </Typography>
        </Stack>
      }
      subTitle={
        <Typography variant="caption" color="text.secondary">
          Drop PDFs or a ZIP. We&rsquo;ll match each one to an employee by PAN
          (preferred), employee ID, or name. Override anything you need to
          before clicking <strong>Upload &amp; Publish</strong>.
        </Typography>
      }
      closeOnOutSideClick={!running}
      onClose={handleClose}
    >
      <Stack spacing={2.5} sx={{ pb: 4 }}>
        {/* ── Step 1: Financial Year ──────────────────────────────── */}
        {!running && !done && (
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: sessionFY === null
                ? alpha(tokens.colors.pink, 0.45)
                : alpha(tokens.colors.blue, 0.25),
              bgcolor: sessionFY === null
                ? alpha(tokens.colors.pink, 0.05)
                : alpha(tokens.colors.blue, 0.04),
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1.5}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: tokens.colors.pink,
                  }}
                >
                  Step 1 · Financial Year
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 0.25 }}>
                  Which FY are these Form-16s for?
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: tokens.colors.lightTextSecondary,
                    mt: 0.25,
                  }}
                >
                  Files can&rsquo;t be added until this is set. We&rsquo;ll apply it
                  to every row by default — filename-detected FYs override per row.
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Financial year</InputLabel>
                <Select
                  value={sessionFY ?? ''}
                  label="Financial year"
                  onChange={(e) => {
                    const fy = Number(e.target.value);
                    if (!Number.isFinite(fy)) return;
                    setSessionFY(fy);
                    // Sync every PENDING row to the new session FY so
                    // an admin who changes FY mid-pick doesn't end up
                    // with a stale year on existing rows. Don't touch
                    // rows that already uploaded or that have a parsed
                    // FY from their filename — those stay as they are.
                    setRows((prev) =>
                      prev.map((r) => {
                        if (r.status !== 'pending') return r;
                        const parsed = parseForm16Filename(r.filename);
                        if (Number.isFinite(parsed.fiscalYearStart)) return r;
                        return { ...r, fyStart: fy };
                      }),
                    );
                  }}
                >
                  {FY_OPTIONS.map((fy) => (
                    <MenuItem key={fy} value={fy}>
                      FY {getFYLabel(fy)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {sessionFY === null && defaultFYStart && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSessionFY(defaultFYStart);
                  }}
                  sx={{
                    textTransform: 'none',
                    borderColor: alpha(tokens.colors.pink, 0.5),
                    color: tokens.colors.pink,
                  }}
                >
                  Use FY {getFYLabel(defaultFYStart)}
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {/* ── Step 2: File intake ─────────────────────────────────── */}
        {!running && !done && (
          <Box
            onDragOver={(e) => {
              if (sessionFY === null) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (sessionFY === null) {
                e.preventDefault();
                toast.error('Pick a financial year first.');
                return;
              }
              e.preventDefault();
              if (e.dataTransfer.files?.length) ingestFiles(e.dataTransfer.files);
            }}
            sx={{
              border: '2px dashed',
              borderColor: alpha(tokens.colors.pink, 0.3),
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              bgcolor: alpha(tokens.colors.pink, 0.03),
              cursor: sessionFY === null ? 'not-allowed' : 'pointer',
              opacity: sessionFY === null ? 0.55 : 1,
              transition: 'opacity 0.18s ease',
              '&:hover': {
                bgcolor: sessionFY === null
                  ? alpha(tokens.colors.pink, 0.03)
                  : alpha(tokens.colors.pink, 0.06),
              },
            }}
            onClick={() => {
              if (sessionFY === null) {
                toast.error('Pick a financial year first.');
                return;
              }
              fileInputRef.current?.click();
            }}
          >
            <IconFolderOpen size={32} color={tokens.colors.pink} />
            <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 1 }}>
              Click or drop PDFs / ZIP archive here
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: tokens.colors.lightTextSecondary,
                mt: 0.5,
              }}
            >
              PDF only · up to 10 MB per file · ZIP archives unpacked in your browser
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,.zip,application/zip,application/x-zip-compressed"
              multiple
              hidden
              onChange={handleFilePick}
            />
          </Box>
        )}

        {/* ── Loading employee list ───────────────────────────────── */}
        {employeesLoading && rows.length > 0 && (
          <Alert severity="info" icon={<CircularProgress size={16} />}>
            Loading employee list for auto-matching…
          </Alert>
        )}

        {/* ── Done banner ─────────────────────────────────────────── */}
        {done && (
          <Alert
            severity={done.failureCount === 0 ? 'success' : 'warning'}
            sx={{ fontWeight: 600 }}
          >
            {done.failureCount === 0 ? (
              <>Successfully Published {done.successCount} Form-16{done.successCount === 1 ? '' : 's'}.</>
            ) : (
              <>
                Published {done.successCount} of {done.successCount + done.failureCount}. {done.failureCount} failed —
                retry below.
              </>
            )}
          </Alert>
        )}

        {/* ── Progress bar (during run) ──────────────────────────── */}
        {running && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(tokens.colors.pink, 0.05),
              border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              {progress.label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.pct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(tokens.colors.pink, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: tokens.colors.pink,
                },
              }}
            />
            <Typography
              sx={{
                fontSize: 11,
                color: tokens.colors.lightTextSecondary,
                mt: 0.5,
                textAlign: 'right',
              }}
            >
              {Math.round(progress.pct)}%
            </Typography>
          </Box>
        )}

        {/* ── Row list ────────────────────────────────────────────── */}
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <RowCard
              key={row.id}
              row={row}
              employees={employees}
              disabled={running || row.status === 'uploaded'}
              onPickEmployee={(emp) => setRowEmployee(row.id, emp)}
              onPickFY={(fy) => setRowFY(row.id, fy)}
              onRemove={() => removeRow(row.id)}
              onRetry={async () => {
                await uploadRow(row.id);
                // After a single retry succeeds, do one bulk publish
                // for just this row so the admin doesn't need to click
                // again. Simpler than tracking partial state.
                const r = (await new Promise<Row | undefined>((resolve) => {
                  setRows((prev) => {
                    resolve(prev.find((p) => p.id === row.id));
                    return prev;
                  });
                }));
                if (r?.status === 'uploaded' && r.uploadedUrl && r.employee) {
                  try {
                    await bulkCreateForm16({
                      publishImmediately: true,
                      rows: [
                        {
                          userId: r.employee.userId,
                          fiscalYearStart: r.fyStart,
                          fileUrl: r.uploadedUrl,
                          originalFilename: r.filename,
                          fileSizeBytes: r.sizeBytes,
                        },
                      ],
                    });
                    setDone((d) =>
                      d ? { ...d, successCount: d.successCount + 1, failureCount: Math.max(0, d.failureCount - 1) } : d,
                    );
                    onUploaded();
                  } catch (err) {
                    const message =
                      (err as Error)?.message || 'Retry publish failed.';
                    setRows((prev) =>
                      prev.map((p) =>
                        p.id === row.id
                          ? { ...p, status: 'failed' as RowStatus, errorMessage: message }
                          : p,
                      ),
                    );
                  }
                }
              }}
            />
          ))}
        </Stack>

        {/* ── Footer actions ──────────────────────────────────────── */}
        {/* Order is Upload & Publish → Close. Close lives to the right
            of the primary CTA so the eye lands on the primary first
            and Close is only one tab away after the run completes. */}
        {!done && (
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              onClick={runUploadsAndPublish}
              disabled={!allReady || running || employeesLoading || rows.length === 0}
              startIcon={
                running ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <IconUpload size={16} />
                )
              }
              sx={{
                bgcolor: tokens.colors.pink,
                '&:hover': { bgcolor: tokens.colors.pinkDark },
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {running ? 'Uploading…' : `Upload & Publish (${rows.length})`}
            </Button>
            <Button
              onClick={handleClose}
              disabled={running}
              startIcon={<IconX size={16} />}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </Stack>
        )}
        {done && (
          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              onClick={handleClose}
              variant="contained"
              startIcon={<IconCheck size={16} />}
              sx={{
                bgcolor: tokens.colors.pink,
                '&:hover': { bgcolor: tokens.colors.pinkDark },
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Close
            </Button>
          </Stack>
        )}
      </Stack>
    </CustomDrawer>
  );
}

// ─── Row card ────────────────────────────────────────────────────

interface RowCardProps {
  row: Row;
  employees: Form16LookupEmployee[];
  disabled: boolean;
  onPickEmployee: (emp: Form16LookupEmployee | null) => void;
  onPickFY: (fy: number) => void;
  onRemove: () => void;
  onRetry: () => void;
}

function RowCard({
  row, employees, disabled, onPickEmployee, onPickFY, onRemove, onRetry,
}: RowCardProps) {
  const oversize = row.sizeBytes > MAX_BYTES;
  const tier = tierLabel(row.matchTier);

  const statusChip = (() => {
    switch (row.status) {
      case 'pending':
        return null;
      case 'uploading':
        return (
          <Chip
            size="small"
            label="Uploading…"
            color="info"
            icon={<CircularProgress size={12} color="inherit" />}
          />
        );
      case 'uploaded':
        return (
          <Chip
            size="small"
            color="success"
            icon={<IconCheck size={12} />}
            label="Uploaded"
          />
        );
      case 'failed':
        return (
          <Chip
            size="small"
            color="error"
            icon={<IconAlertTriangle size={12} />}
            label="Failed"
          />
        );
    }
  })();

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor:
          row.status === 'failed'
            ? alpha('#EF4444', 0.4)
            : row.status === 'uploaded'
              ? alpha('#10B981', 0.4)
              : 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        p: 1.75,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
        {/* Preview */}
        <Box
          sx={{
            width: { xs: '100%', sm: 110 },
            minWidth: { xs: 0, sm: 110 },
            height: 140,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: '#F4F6F8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {row.previewUrl ? (
            <Box
              component="iframe"
              src={`${row.previewUrl}#view=FitH&toolbar=0&navpanes=0`}
              title={row.filename}
              sx={{ width: '100%', height: '100%', border: 'none', bgcolor: 'white' }}
            />
          ) : (
            <IconFileText size={28} color="#94A3B8" />
          )}
        </Box>

        {/* Details */}
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Tooltip title={row.filename}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: tokens.colors.lightText,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: '100%', sm: 320 },
                }}
              >
                {row.filename}
              </Typography>
            </Tooltip>
            <Typography
              sx={{
                fontSize: 11,
                color: oversize ? '#EF4444' : tokens.colors.lightTextSecondary,
              }}
            >
              · {fmtBytes(row.sizeBytes)}
              {oversize ? ' (over 10 MB cap)' : ''}
            </Typography>
            {statusChip}
          </Stack>

          {/* Parser-detected fields — surfaces PAN / FY / name found
              in the filename so the admin can verify the match wasn't
              fooled by visually-truncated text. Hidden once the row
              has uploaded. */}
          {(row.detectedPan || row.detectedFYLabel || row.detectedName) &&
            row.status !== 'uploaded' && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: -0.5 }}>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: tokens.colors.lightTextSecondary,
                  }}
                >
                  Detected:
                </Typography>
                {row.detectedPan && (
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600 }}>
                    PAN <Box component="span" sx={{ fontFamily: 'monospace', color: '#10B981' }}>
                      {row.detectedPan}
                    </Box>
                  </Typography>
                )}
                {row.detectedFYLabel && (
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600 }}>
                    · FY <Box component="span" sx={{ color: '#10B981' }}>{row.detectedFYLabel}</Box>
                  </Typography>
                )}
                {row.detectedName && (
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600 }}>
                    · Name <Box component="span" sx={{ color: '#37B7EA' }}>{row.detectedName}</Box>
                  </Typography>
                )}
                {!row.detectedPan && !row.detectedFYLabel && !row.detectedName && (
                  <Typography sx={{ fontSize: 10.5, color: '#EF4444', fontWeight: 600 }}>
                    Nothing parsed — pick the employee manually.
                  </Typography>
                )}
              </Stack>
            )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            {tier && row.status === 'pending' && (
              <Chip
                size="small"
                label={tier.label}
                sx={{
                  bgcolor: alpha(tier.color, 0.12),
                  color: tier.color,
                  fontWeight: 600,
                  fontSize: 10.5,
                }}
              />
            )}
            {row.ambiguous && row.status === 'pending' && (
              <Chip
                size="small"
                label="Multiple candidates — pick one"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          {row.errorMessage && (
            <Alert severity="error" sx={{ py: 0.25 }}>
              {row.errorMessage}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <Autocomplete
              size="small"
              fullWidth
              disabled={disabled}
              options={employees}
              value={row.employee || null}
              onChange={(_, v) => onPickEmployee(v)}
              getOptionLabel={(o) =>
                `${o.name}${o.employeeId ? ` · ${o.employeeId}` : ''}`
              }
              isOptionEqualToValue={(opt, val) => opt.userId === val.userId}
              renderInput={(params) => (
                <TextField {...params} label="Employee" placeholder="Search employee…" />
              )}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Financial year</InputLabel>
              <Select
                disabled={disabled}
                value={row.fyStart}
                label="Financial year"
                onChange={(e) => onPickFY(Number(e.target.value))}
              >
                {FY_OPTIONS.map((fy) => (
                  <MenuItem key={fy} value={fy}>
                    FY {getFYLabel(fy)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* Row actions */}
        <Stack direction="column" spacing={0.5} alignItems="center" justifyContent="flex-start">
          {row.status === 'failed' && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={onRetry}>
                <IconRefresh size={16} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Remove">
            <span>
              <IconButton size="small" onClick={onRemove} disabled={disabled && row.status !== 'failed'}>
                <IconX size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
