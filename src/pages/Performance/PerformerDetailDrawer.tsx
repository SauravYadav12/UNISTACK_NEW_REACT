import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconBriefcase,
  IconChevronDown,
  IconMinus,
  IconPlus,
  IconTicket,
  IconX,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { tokens } from '../../theme/theme';
import {
  ContributorItem,
  Contributors,
  LeaderboardRow,
  MarketingMetrics,
  PerformanceRole,
  ScoreLine,
  SupportMetrics,
} from '../../Interfaces/performance';
import { getInitials } from '../../components/ui/PersonPill';
import RequirementDrawer from '../../components/requirement/RequirementDrawer';
import InterviewDrawer from '../../components/interview/InterviewDrawer';
import { interviewsList } from '../../services/interviewApi';
import { IInterview } from '../../Interfaces/types';

interface Props {
  open: boolean;
  onClose: () => void;
  row: LeaderboardRow<MarketingMetrics | SupportMetrics> | null;
  role: PerformanceRole;
  median: number;
}

export default function PerformerDetailDrawer({
  open,
  onClose,
  row,
  role,
  median,
}: Props) {
  const [openReqID, setOpenReqID] = useState<string | null>(null);
  const [openInterview, setOpenInterview] = useState<IInterview | null>(null);
  const [loadingIntId, setLoadingIntId] = useState<string | null>(null);

  async function handleOpenInterview(intId: string) {
    setLoadingIntId(intId);
    try {
      const res = await interviewsList(`intId=${encodeURIComponent(intId)}`);
      const found = res.data?.data?.results?.[0] as IInterview | undefined;
      if (!found) {
        toast.error(`Interview ${intId} not found`);
        return;
      }
      setOpenInterview(found);
    } catch {
      toast.error(`Failed to load interview ${intId}`);
    } finally {
      setLoadingIntId(null);
    }
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 620,
            maxWidth: '100vw',
            borderRadius: '16px 0 0 16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {row && (
          <>
            {/* Header band */}
            <Box
              sx={{
                position: 'relative',
                background: tokens.gradients.darkSurface,
                color: '#fff',
                px: 3,
                pt: 2.25,
                pb: 2.5,
                overflow: 'hidden',
                borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: tokens.gradients.pinkBlue,
                }}
              />
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: tokens.gradients.pinkBlue,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                  }}
                >
                  {getInitials(row.user.name)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha('#fff', 0.7),
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    RANK #{row.rank} · {role.toUpperCase()}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ color: '#fff' }}
                  >
                    {row.user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#fff', 0.7) }}
                  >
                    {row.user.email}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    color: '#fff',
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': { bgcolor: alpha('#fff', 0.18) },
                  }}
                >
                  <IconX size={18} />
                </IconButton>
              </Stack>
            </Box>

            {/* Score summary */}
            <Box
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'baseline',
                gap: 2,
                borderBottom: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography
                sx={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: tokens.colors.pinkDark,
                }}
              >
                {row.score}
              </Typography>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: tokens.colors.lightTextSecondary,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontSize: '0.66rem',
                    display: 'block',
                  }}
                >
                  Total points
                </Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  Team median: <strong>{median}</strong>
                  {row.score > median
                    ? ` · +${(row.score - median).toFixed(2)} above`
                    : row.score < median
                      ? ` · −${(median - row.score).toFixed(2)} below`
                      : ' · exactly at median'}
                </Typography>
                {row.rawTotal < 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: '#B45309', fontWeight: 600 }}
                  >
                    Raw total was {row.rawTotal} — floored to 0 per policy.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Breakdown */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: tokens.colors.lightTextSecondary,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: '0.66rem',
                  display: 'block',
                  mb: 1,
                }}
              >
                Breakdown
              </Typography>
              <Stack spacing={0.5}>
                {row.breakdown.map((line) => (
                  <BreakdownRow
                    key={line.key}
                    line={line}
                    contributors={row.contributors?.[line.key]}
                    loadingIntId={loadingIntId}
                    onOpenReq={(reqID) => setOpenReqID(reqID)}
                    onOpenInterview={handleOpenInterview}
                  />
                ))}
                <Divider sx={{ my: 1 }} />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 1.5, py: 0.5 }}
                >
                  <Typography fontWeight={800}>Total</Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      color: tokens.colors.pinkDark,
                    }}
                  >
                    {row.score}
                  </Typography>
                </Stack>
              </Stack>

              {/* Fairness hint */}
              <Box
                sx={{
                  mt: 3,
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: alpha(tokens.colors.blue, 0.04),
                  border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: tokens.colors.blueDark,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontSize: '0.62rem',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  How this score was built
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>
                  Every line above comes from the database — no manual
                  adjustments. Weights are set by the super-admin and visible
                  to everyone. Click a chip to open the underlying requirement
                  or interview.
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Drawer>

      {openReqID && (
        <RequirementDrawer
          reqID={openReqID}
          open={!!openReqID}
          onClose={() => setOpenReqID(null)}
          hideButtons
        />
      )}
      {openInterview && (
        <InterviewDrawer
          open={!!openInterview}
          onClose={() => setOpenInterview(null)}
          interview={openInterview}
          setData={() => undefined}
        />
      )}
    </>
  );
}

interface InterviewGroup {
  reqID: string | null;
  intIds: string[];
}

function groupInterviewsByReq(items: ContributorItem[]): InterviewGroup[] {
  const map = new Map<string, InterviewGroup>();
  const orphans: InterviewGroup[] = [];
  for (const c of items) {
    if (c.type !== 'interview') continue;
    const key = c.reqID || '';
    if (!key) {
      orphans.push({ reqID: null, intIds: c.intId ? [c.intId] : [] });
      continue;
    }
    const existing = map.get(key);
    if (existing) {
      if (c.intId) existing.intIds.push(c.intId);
    } else {
      map.set(key, { reqID: c.reqID || null, intIds: c.intId ? [c.intId] : [] });
    }
  }
  return [...map.values(), ...orphans];
}

function BreakdownRow({
  line,
  contributors,
  loadingIntId,
  onOpenReq,
  onOpenInterview,
}: {
  line: ScoreLine;
  contributors?: ContributorItem[];
  loadingIntId: string | null;
  onOpenReq: (reqID: string) => void;
  onOpenInterview: (intId: string) => void;
}) {
  const positive = line.kind === 'positive';
  const color = positive ? tokens.colors.pinkDark : '#EF4444';
  const [expanded, setExpanded] = useState(false);

  const hasContributors = !!contributors && contributors.length > 0;
  const isInterviewMetric = useMemo(
    () => contributors?.some((c) => c.type === 'interview') ?? false,
    [contributors],
  );
  const interviewGroups = useMemo(
    () => (isInterviewMetric && contributors ? groupInterviewsByReq(contributors) : []),
    [contributors, isInterviewMetric],
  );
  const reqContribs = useMemo(
    () => (!isInterviewMetric && contributors
      ? contributors.filter((c) => c.type === 'requirement' && c.reqID)
      : []),
    [contributors, isInterviewMetric],
  );

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        onClick={() => hasContributors && setExpanded((v) => !v)}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: alpha(color, line.count > 0 ? 0.04 : 0),
          cursor: hasContributors ? 'pointer' : 'default',
          '&:hover': hasContributors
            ? { bgcolor: alpha(color, 0.08) }
            : undefined,
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: alpha(color, 0.12),
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {positive ? <IconPlus size={12} /> : <IconMinus size={12} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
            {line.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.7rem',
            }}
          >
            {line.count} × {line.weight}
            {hasContributors && (
              <Box component="span" sx={{ ml: 0.75, opacity: 0.7 }}>
                · click to see records
              </Box>
            )}
          </Typography>
        </Box>
        {hasContributors && (
          <Box
            sx={{
              color,
              display: 'flex',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <IconChevronDown size={14} />
          </Box>
        )}
        <Typography
          sx={{
            fontWeight: 800,
            color,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {line.points > 0 ? '+' : ''}
          {line.points}
        </Typography>
      </Stack>

      {hasContributors && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 5, pr: 1.5, pb: 1, pt: 0.5 }}>
            {isInterviewMetric ? (
              <Stack spacing={0.75}>
                {interviewGroups.map((group, gi) => (
                  <Box key={`${group.reqID ?? 'orphan'}-${gi}`}>
                    {group.reqID && (
                      <ReqChip
                        reqID={group.reqID}
                        onClick={() => onOpenReq(group.reqID as string)}
                      />
                    )}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ flexWrap: 'wrap', mt: group.reqID ? 0.5 : 0, gap: 0.5 }}
                      useFlexGap
                    >
                      {group.intIds.map((intId) => (
                        <InterviewChip
                          key={intId}
                          intId={intId}
                          loading={loadingIntId === intId}
                          onClick={() => onOpenInterview(intId)}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ flexWrap: 'wrap', gap: 0.5 }}
                useFlexGap
              >
                {reqContribs.map((c) => (
                  <ReqChip
                    key={c.reqID}
                    reqID={c.reqID as string}
                    onClick={() => onOpenReq(c.reqID as string)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

function ReqChip({
  reqID,
  onClick,
}: {
  reqID: string;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.875,
        py: 0.25,
        borderRadius: 1.5,
        bgcolor: alpha(tokens.colors.blue, 0.1),
        color: tokens.colors.blueDark,
        fontSize: '0.72rem',
        fontWeight: 700,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        cursor: 'pointer',
        border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
        '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.18) },
      }}
    >
      <IconBriefcase size={12} />
      {reqID}
    </Box>
  );
}

function InterviewChip({
  intId,
  loading,
  onClick,
}: {
  intId: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={loading ? undefined : onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.875,
        py: 0.25,
        borderRadius: 1.5,
        bgcolor: alpha(tokens.colors.pink, 0.1),
        color: tokens.colors.pinkDark,
        fontSize: '0.72rem',
        fontWeight: 700,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        cursor: loading ? 'wait' : 'pointer',
        border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
        opacity: loading ? 0.6 : 1,
        '&:hover': loading
          ? undefined
          : { bgcolor: alpha(tokens.colors.pink, 0.18) },
      }}
    >
      {loading ? <CircularProgress size={10} /> : <IconTicket size={12} />}
      {intId}
    </Box>
  );
}
