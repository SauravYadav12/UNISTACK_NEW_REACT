import {
  Box,
  Collapse,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { IconChevronDown, IconInfoCircle } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import {
  LeaderboardResponse,
  MarketingMetrics,
  PerformanceRole,
  ScoreLine,
  SupportMetrics,
} from '../../Interfaces/performance';
import { getInitials } from '../../components/ui/PersonPill';
import PerformerDetailDrawer from './PerformerDetailDrawer';

interface Props {
  role: PerformanceRole;
  data: LeaderboardResponse<MarketingMetrics | SupportMetrics> | null;
}

const RANK_COLORS = ['#F59E0B', '#8593A3', '#B45309'];

interface ScoringLine {
  kind: 'earn' | 'lose';
  text: string;
}

function scoringLinesForRole(
  role: PerformanceRole,
  w: Record<string, number>,
): ScoringLine[] {
  if (role === 'marketing') {
    return [
      {
        kind: 'earn',
        text: `+${w.SUBMISSION_WEIGHT ?? 2} points for every requirement you submit`,
      },
      {
        kind: 'earn',
        text: `+${w.INTERVIEW_CONFIRM_WEIGHT ?? 3} points for every client interview that lands in Confirmed (partial credit — confirms that never complete get clawed back below)`,
      },
      {
        kind: 'earn',
        text: `+${w.INTERVIEW_COMPLETED_WEIGHT ?? 10} points for every client interview that reaches Completed (the real win)`,
      },
      {
        kind: 'earn',
        text: `+${w.CONVERSION_BONUS ?? 0.5} bonus points per 1% of your submit-to-interview conversion rate`,
      },
      {
        kind: 'lose',
        text: `−${w.STALE_CONFIRM_PENALTY ?? 2} points for each Confirmed client interview whose scheduled date passed by more than ${w.STALE_CONFIRM_DAYS ?? 14} days without reaching Completed (reschedule / no-show / dropped)`,
      },
      {
        kind: 'lose',
        text: `−${w.STALE_SUBMISSION_PENALTY ?? 1} point for each of your submissions still sitting in Submitted status with no updates for more than ${w.STALE_SUBMISSION_DAYS ?? 14} days`,
      },
      {
        kind: 'lose',
        text: `−${w.UNWORKED_REQ_PENALTY ?? 1} point for each requirement assigned to you that's still in New Working (never moved forward) after ${w.UNWORKED_REQ_DAYS ?? 7} days`,
      },
    ];
  }
  return [
    {
      kind: 'earn',
      text: `+${w.REQ_ENTRY_WEIGHT ?? 1} point for every requirement you enter`,
    },
    {
      kind: 'earn',
      text: `+${w.REQ_SUBMITTED_WEIGHT ?? 3} points when a requirement you entered reaches Submitted`,
    },
    {
      kind: 'earn',
      text: `+${w.REQ_INTERVIEWED_WEIGHT ?? 6} points when a requirement you entered reaches Interviewed (requires at least one client-facing interview on record)`,
    },
    {
      kind: 'earn',
      text: `+${w.REQ_PROJECT_WEIGHT ?? 10} points when a requirement you entered reaches Project stage (Active / Inactive)`,
    },
    {
      kind: 'lose',
      text: `−${w.UNPROGRESSED_REQ_PENALTY ?? 0.5} point for each requirement you entered that's still in New Working (never moved forward) after ${w.UNPROGRESSED_REQ_DAYS ?? 14} days`,
    },
    {
      kind: 'lose',
      text: `−${w.DUPLICATE_PENALTY ?? 1} point for every duplicate entry`,
    },
  ];
}

export default function Leaderboard({ role, data }: Props) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [showScoring, setShowScoring] = useState(false);

  const rows = data?.rows || [];
  const median = useMemo(() => {
    if (rows.length === 0) return 0;
    const sorted = rows.map((r) => r.score).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }, [rows]);

  if (!data) {
    return (
      <Box
        sx={{
          py: 6,
          textAlign: 'center',
          borderRadius: 3,
          border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
          bgcolor: alpha(tokens.colors.blue, 0.03),
        }}
      >
        <Typography>Pick a range to see the scoreboard.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* "How it's scored" strip — plain English so anyone can follow. */}
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: alpha(tokens.colors.blue, 0.04),
          border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={() => setShowScoring((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowScoring((v) => !v);
            }
          }}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            px: 1.75,
            py: 1.25,
            '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.06) },
          }}
        >
          <Box sx={{ color: tokens.colors.blueDark, display: 'flex' }}>
            <IconInfoCircle size={16} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.blueDark,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.66rem',
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              How this is scored
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.primary' }}>
              {role === 'marketing'
                ? 'Earn points when you submit candidates and book real interviews. Stale or untouched requirements cost a little.'
                : 'Earn points for entering quality requirements — more points when they actually move forward. Duplicates and stuck entries cost a little.'}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: tokens.colors.pinkDark,
              whiteSpace: 'nowrap',
            }}
          >
            {showScoring ? 'Hide details' : 'Show details'}
          </Typography>
          <Box
            sx={{
              color: tokens.colors.pinkDark,
              display: 'flex',
              transform: showScoring ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <IconChevronDown size={16} />
          </Box>
        </Stack>

        <Collapse in={showScoring} timeout="auto" unmountOnExit>
          <Box sx={{ px: 1.75, pb: 1.5, pt: 0.25 }}>
            <Stack spacing={0.75}>
              {scoringLinesForRole(role, data.weights).map((line, i) => {
                const good = line.kind === 'earn';
                const color = good ? tokens.colors.success : '#EF4444';
                return (
                  <Stack
                    key={i}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        mt: '2px',
                        px: 0.75,
                        py: 0.125,
                        borderRadius: 1.25,
                        bgcolor: alpha(color, 0.12),
                        color,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {good ? 'EARN' : 'LOSE'}
                    </Box>
                    <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                      {line.text}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1.25,
                color: 'text.secondary',
                fontSize: '0.72rem',
                fontStyle: 'italic',
              }}
            >
              Your total score can never drop below zero — penalties only shave
              your upside, they don&apos;t put you in the red.
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {rows.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>No one to rank yet</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Pick a different window or check back later.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {rows.map((row, idx) => {
            const top3Colour = idx < 3 ? RANK_COLORS[idx] : tokens.colors.blueDark;
            const positive = row.breakdown.filter((b) => b.kind === 'positive');
            const penalties = row.breakdown.filter((b) => b.kind === 'penalty');
            return (
              <Box
                key={row.user._id}
                onClick={() => setSelectedRow(idx)}
                sx={{
                  cursor: 'pointer',
                  p: 1.75,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: idx < 3 ? alpha(top3Colour, 0.3) : 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: idx < 3 ? alpha(top3Colour, 0.03) : 'background.paper',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: alpha(top3Colour, 0.5),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(top3Colour, 0.1)}`,
                  },
                }}
              >
                {/* Rank */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: idx < 3 ? alpha(top3Colour, 0.15) : alpha(tokens.colors.blue, 0.08),
                    color: top3Colour,
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  #{row.rank}
                </Box>

                {/* Avatar + name */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: tokens.gradients.pinkBlue,
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(row.user.name)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={800}>{row.user.name}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.72rem' }}
                  >
                    {row.user.email}
                    {row.score >= median + 0.01
                      ? ' · above median'
                      : row.score <= median - 0.01
                        ? ' · below median'
                        : ' · at median'}
                  </Typography>
                </Box>

                {/* Metric chips */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {positive.slice(0, 3).map((b) => (
                    <MetricChip key={b.key} line={b} tint="pink" />
                  ))}
                  {penalties
                    .filter((p) => p.count > 0)
                    .map((b) => (
                      <MetricChip key={b.key} line={b} tint="red" />
                    ))}
                </Stack>

                {/* Score */}
                <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                  <Typography
                    sx={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: top3Colour,
                      lineHeight: 1,
                    }}
                  >
                    {row.score}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontWeight: 700,
                    }}
                  >
                    points
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      <PerformerDetailDrawer
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        row={selectedRow !== null ? rows[selectedRow] : null}
        role={role}
        median={median}
      />
    </Box>
  );
}

function MetricChip({
  line,
  tint,
}: {
  line: ScoreLine;
  tint: 'pink' | 'red';
}) {
  const color = tint === 'red' ? '#EF4444' : tokens.colors.pinkDark;
  const bg = tint === 'red' ? alpha('#EF4444', 0.08) : alpha(tokens.colors.pink, 0.08);
  const signed = `${line.points > 0 ? '+' : ''}${line.points}`;
  return (
    <Tooltip title={`${line.label}: ${line.count} × ${line.weight} = ${signed}`}>
      <Box
        sx={{
          px: 0.875,
          py: 0.25,
          borderRadius: 1.5,
          bgcolor: bg,
          color,
          fontSize: '0.7rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {line.count}
        </Box>
        <Box component="span" sx={{ opacity: 0.6 }}>·</Box>
        <Box component="span">{signed}</Box>
      </Box>
    </Tooltip>
  );
}
