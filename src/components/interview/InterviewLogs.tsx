import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DifferenceIcon from '@mui/icons-material/CompareArrows';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { InterviewLog } from '../../Interfaces/interview';

/**
 * Interview activity log — visual mirror of `RequirementLogs`. Accordion
 * list, one entry per log row, expand to see a diff table of the changed
 * fields. Field labels are interview-specific (intId, interviewDate,
 * interviewStatus, …); everything else (diff layout, op chip, render of
 * URLs / comments / fallback JSON) follows the requirement-log behaviour
 * so the UX is consistent across the two surfaces.
 */

export type InterviewOperation = 'create' | 'update' | 'delete';

export type InterviewLogsProps = {
  logs: InterviewLog[];
  fieldLabels?: Partial<Record<string, string>>;
  hideEmpty?: boolean;
  formatDate?: (d: string | Date) => string;
  bodyMaxHeight?: number;
  expandFirst?: boolean;
};

const DEFAULT_LABELS: Record<string, string> = {
  intId: 'Interview ID',
  reqID: 'Requirement ID',
  interviewDate: 'Interview Date',
  interviewTime: 'Interview Time',
  timeZone: 'Time Zone',
  interviewType: 'Interview Type',
  interviewStatus: 'Interview Status',
  interviewWith: 'Interview With',
  intResult: 'Interview Result',
  consultant: 'Consultant',
  consultantRef: 'Consultant (Ref)',
  marketingPerson: 'Marketing Person',
  marketingPersonRef: 'Marketing Person (Ref)',
  candidate: 'Candidate',
  candidateRef: 'Candidate (Ref)',
  companyName: 'Company',
  primeVendorCompany: 'Prime Vendor Company',
  vendorCompany: 'Vendor Company',
  contactPerson: 'Contact Person',
  contactPhone: 'Contact Phone',
  contactEmail: 'Contact Email',
  resume: 'Resume Link',
  resumeUpload: 'Resume Upload',
  tentativeReason: 'Tentative Reason',
  gitHubLink: 'GitHub Link',
  codeLink: 'Code Link',
  result: 'Result',
  feedback: 'Feedback',
  remarks: 'Remarks',
  specialNote: 'Special Note',
  script: 'Script',
  duration: 'Duration',
  teamRef: 'Team (Ref)',
  updatedBy: 'Updated By',
};

const defaultFormatDate = (d: string | Date) => new Date(d).toLocaleString();

function startCaseFromKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}
function labelForKey(key: string, overrides?: Partial<Record<string, string>>) {
  return overrides?.[key] ?? DEFAULT_LABELS[key] ?? startCaseFromKey(key);
}
function isEmptyValue(v: unknown) {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}

type DiffRow = { key: string; label: string; before?: any; after?: any };
type BuildRowsOpts = {
  hideEmpty: boolean;
  labels?: Partial<Record<string, string>>;
};

function buildRowsForLogAtIndex(
  logs: InterviewLog[],
  i: number,
  opts: BuildRowsOpts,
): { rows: DiffRow[]; op: InterviewOperation } {
  // Internal bookkeeping fields and any FK refs we don't want surfaced
  // in the diff — keeps the user-facing table focused on real changes.
  const excludeFields = [
    'createdAt',
    'updatedAt',
    'consultantRef',
    'marketingPersonRef',
    'candidateRef',
    'teamRef',
    '_id',
    '__v',
    // perf-scoring bookkeeping — not user-visible
    '_perfConfirmedAt',
    '_perfCompletedAt',
    '_perfOfferAt',
    '_perfStaleConfirmFiredAt',
  ];
  const log = logs[i];
  const op = log.operation;
  const afterObj = (log.newData ?? {}) as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(afterObj)]))
    .filter((k) => !excludeFields.includes(k))
    .sort();

  const rows: DiffRow[] = [];

  if (op === 'delete') {
    return { rows, op };
  }

  keys.forEach((k) => {
    const after = afterObj[k];

    if (opts.hideEmpty && isEmptyValue(after)) return;

    rows.push({ key: k, label: labelForKey(k, opts.labels), after });
  });

  return { rows, op };
}

function renderValue(v: unknown): React.ReactNode {
  if (v == null) return <em>—</em>;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    const isUrl = /^https?:\/\//i.test(v);
    return isUrl ? (
      <a href={v} target="_blank" rel="noreferrer">
        {v}
      </a>
    ) : (
      v
    );
  }
  if (
    (Array.isArray(v) && (v[0] as { comment?: unknown })?.comment) ||
    (typeof v === 'object' && v !== null && 'comment' in v)
  ) {
    return (
      <Stack direction="column" spacing={1}>
        {[v].flat().map((item: any, idx: number) => {
          if (
            item &&
            typeof item === 'object' &&
            item.username &&
            item.date &&
            item.comment
          ) {
            return (
              <Box
                key={idx}
                sx={{
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Alert severity="info" sx={{ py: 0 }}>
                  New Added comments
                </Alert>
                <Divider />
                <Typography variant="body2">
                  <strong>{item.username}</strong> (
                  {new Date(item.date).toLocaleString()}):
                </Typography>
                <Typography variant="body2">{item.comment || '-'}</Typography>
              </Box>
            );
          }
          return <Chip key={idx} label={String(item)} size="small" />;
        })}
      </Stack>
    );
  }
  return (
    <Tooltip title={JSON.stringify(v)}>
      <Typography component="span" sx={{ fontFamily: 'monospace' }}>
        {JSON.stringify(v)}
      </Typography>
    </Tooltip>
  );
}

function OpAvatar({ op }: { op: InterviewOperation }) {
  const map = {
    create: {
      icon: <AddCircleOutlineIcon />,
      bg: 'success.main',
      title: 'Created',
    },
    update: { icon: <DifferenceIcon />, bg: 'info.main', title: 'Updated' },
    delete: { icon: <DeleteOutlineIcon />, bg: 'error.main', title: 'Deleted' },
  } as const;
  const cfg = map[op];
  return (
    <Tooltip title={cfg.title}>
      <Avatar sx={{ bgcolor: cfg.bg }}>{cfg.icon}</Avatar>
    </Tooltip>
  );
}

function SummaryLine({
  op,
  user,
  when,
  changeCount,
}: {
  op: InterviewOperation;
  user: string;
  when: string;
  changeCount: number;
}) {
  const title = op.charAt(0).toUpperCase() + op.slice(1);
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ width: '100%' }}
    >
      <OpAvatar op={op} />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        by {user} • {when}
      </Typography>
      <Chip
        size="small"
        label={`${changeCount} change${changeCount === 1 ? '' : 's'}`}
      />
    </Stack>
  );
}

export default function InterviewLogs({
  logs,
  fieldLabels,
  hideEmpty = false,
  formatDate = defaultFormatDate,
  bodyMaxHeight = 360,
  expandFirst = true,
}: InterviewLogsProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Interview Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            No activity yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={1.5}>
      {logs.map((log, i) => {
        const { rows, op } = buildRowsForLogAtIndex(logs, i, {
          hideEmpty,
          labels: fieldLabels,
        });

        const showAfter = op !== 'delete';
        const when = formatDate(log.createdAt);
        const changeCount = rows.length;

        return (
          <Accordion
            key={log._id || `${log.operation}-${String(log.createdAt)}-${i}`}
            defaultExpanded={expandFirst && i === 0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SummaryLine
                op={op}
                user={log.userName}
                when={when}
                changeCount={changeCount}
              />
            </AccordionSummary>
            <AccordionDetails>
              {rows.length === 0 ? (
                <Box p={1}>
                  <Typography variant="body2" color="text.secondary">
                    No visible changes.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: bodyMaxHeight }}>
                  <Table
                    stickyHeader
                    size="small"
                    aria-label="interview change table"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 280 }}>Field</TableCell>
                        {showAfter && <TableCell>Updated</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.key} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {r.label}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              <code>{r.key}</code>
                            </Typography>
                          </TableCell>
                          {showAfter && (
                            <TableCell>{renderValue(r.after)}</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Divider sx={{ mt: 1 }} />
              <Box p={1}>
                <Typography variant="caption" color="text.secondary">
                  Log ID: {log._id || '—'}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
