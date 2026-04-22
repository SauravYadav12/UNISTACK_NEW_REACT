import { useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Avatar,
  alpha,
  CircularProgress,
  Link,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  IconTrophy,
  IconFlame,
  IconSparkles,
  IconChartBar,
  IconInbox,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../theme/animations';

const MotionBox = motion.create(Box);

export interface BreakdownSegment {
  /** URL-safe status key, e.g. "Submitted" */
  key: string;
  /** Human-friendly label, e.g. "Submitted" */
  label: string;
  /** Segment color */
  color: string;
  /** Numeric value for this segment */
  value: number;
  /** Optional link for drill-down (e.g. /requirements?...) */
  href?: string;
}

export interface PerformanceRow {
  id?: string;
  /** Name of the person/entity */
  name: string;
  /** The primary (total) value for this row — drives bar distribution + ranking */
  total: number;
  /** Breakdown segments shown as stacked bar + pills underneath */
  breakdown: BreakdownSegment[];
  /** Optional deep-link for the full breakdown */
  totalHref?: string;
}

export interface AwardWinner {
  row: PerformanceRow;
  /** Big headline value, e.g. "92% conversion", "15 submitted" */
  primary: string;
  /** Optional secondary metric, e.g. "11 of 12" */
  secondary?: string;
}

export interface AwardConfig {
  key: string;
  /** Short eyebrow label shown uppercase, e.g. "TOP PERFORMER" */
  label: string;
  /** Tooltip text shown when hovering the label */
  hint?: string;
  icon: React.ReactNode;
  /** Accent color for card border/icon tint */
  accentColor: string;
  /** Optional accent gradient — used for avatar backgrounds */
  accentGradient?: string;
  /** 'hero' = navy gradient banner; 'card' = lighter compact card (default) */
  variant?: 'hero' | 'card';
  /** Picks the winner; return null to hide the award */
  pick: (rows: PerformanceRow[]) => AwardWinner | null;
}

interface Props {
  title: string;
  /** Label describing the "total" value (e.g. "Positions", "Interviews") */
  totalLabel: string;
  /** Short description under the title */
  subtitle?: string;
  rows?: PerformanceRow[];
  loading?: boolean;
  /** Icon for the header */
  icon?: React.ReactNode;
  /** Accent color used across the section */
  accentColor?: string;
  /** Accent gradient */
  accentGradient?: string;
  /**
   * Optional award cards shown in the sidebar.
   * When provided (non-empty), these replace the default single Top Performer card.
   */
  awards?: AwardConfig[];
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  const medalColors: Record<number, { bg: string; color: string; icon: boolean }> = {
    1: { bg: 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)', color: '#7C5800', icon: true },
    2: { bg: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)', color: '#334155', icon: false },
    3: { bg: 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)', color: '#7F1D1D', icon: false },
  };
  const cfg = isTop3 ? medalColors[rank] : undefined;
  return (
    <Box
      sx={{
        minWidth: 34,
        height: 34,
        px: 1,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: cfg?.bg || alpha(tokens.colors.brand, 0.06),
        color: cfg?.color || tokens.colors.brand,
        fontWeight: 800,
        fontSize: '0.78rem',
        border: cfg
          ? `2px solid ${alpha('#fff', 0.5)}`
          : `1.5px solid ${alpha(tokens.colors.brand, 0.08)}`,
        flexShrink: 0,
      }}
    >
      {isTop3 && rank === 1 ? <IconTrophy size={16} /> : `#${rank}`}
    </Box>
  );
}

function StackedBar({ segments, total }: { segments: BreakdownSegment[]; total: number }) {
  if (total === 0) {
    return (
      <Box
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: alpha(tokens.colors.brand, 0.05),
        }}
      />
    );
  }
  return (
    <Box sx={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', bgcolor: alpha(tokens.colors.brand, 0.05) }}>
      {segments.map((seg) => {
        if (!seg.value) return null;
        const pct = (seg.value / total) * 100;
        return (
          <Tooltip
            key={seg.key}
            title={`${seg.label}: ${seg.value} (${pct.toFixed(0)}%)`}
            arrow
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: seg.color,
                height: '100%',
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

/**
 * HeroAwardCard — big navy banner for the signature "Top Performer" slot
 */
function HeroAwardCard({
  award,
  winner,
  accentGradient,
}: {
  award: AwardConfig;
  winner: AwardWinner;
  accentGradient: string;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        background: tokens.gradients.darkSurface,
        color: '#fff',
        p: 2.5,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(award.accentColor, 0.25)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ position: 'relative', zIndex: 1, mb: 1 }}
      >
        <Box sx={{ color: tokens.colors.yellow, display: 'flex' }}>{award.icon}</Box>
        <Tooltip title={award.hint || ''} arrow disableHoverListener={!award.hint}>
          <Typography
            variant="caption"
            sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 600 }}
          >
            {award.label.toUpperCase()}
          </Typography>
        </Tooltip>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            background: award.accentGradient || accentGradient,
            color: '#fff',
            fontWeight: 700,
            boxShadow: tokens.shadows.aiGlow,
          }}
        >
          {getInitials(winner.row.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: '#fff', lineHeight: 1.2 }}
            noWrap
          >
            {winner.row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.85), fontWeight: 600 }}>
            {winner.primary}
          </Typography>
          {winner.secondary && (
            <Typography
              variant="caption"
              sx={{ color: alpha('#fff', 0.55), display: 'block', fontSize: '0.68rem' }}
            >
              {winner.secondary}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

/**
 * CompactAwardCard — lighter card for secondary awards
 */
function CompactAwardCard({
  award,
  winner,
}: {
  award: AwardConfig;
  winner: AwardWinner;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3.5,
        p: 2,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(award.accentColor, 0.3),
          boxShadow: `0 6px 16px ${alpha(award.accentColor, 0.1)}`,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          bgcolor: award.accentColor,
          opacity: 0.9,
        }}
      />
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(award.accentColor, 0.12),
            color: award.accentColor,
            flexShrink: 0,
          }}
        >
          {award.icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Tooltip title={award.hint || ''} arrow disableHoverListener={!award.hint}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                letterSpacing: '0.05em',
                fontWeight: 700,
                display: 'block',
                fontSize: '0.68rem',
              }}
            >
              {award.label.toUpperCase()}
            </Typography>
          </Tooltip>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.primary"
            sx={{ lineHeight: 1.2, mt: 0.25 }}
            noWrap
          >
            {winner.row.name}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="baseline" sx={{ mt: 0.25 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: award.accentColor, fontSize: '0.78rem' }}
            >
              {winner.primary}
            </Typography>
            {winner.secondary && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                · {winner.secondary}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export default function PerformanceLeaderboard({
  title,
  totalLabel,
  subtitle,
  rows,
  loading,
  icon,
  accentColor = tokens.colors.pink,
  accentGradient = tokens.gradients.pinkBlue,
  awards,
}: Props) {
  // Rank and sort
  const rankedRows = useMemo(() => {
    const sorted = [...(rows || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
    return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
  }, [rows]);

  const grandTotal = useMemo(
    () => rankedRows.reduce((sum, r) => sum + (r.total || 0), 0),
    [rankedRows]
  );

  // Aggregate breakdown for funnel view
  const aggregate = useMemo(() => {
    const agg: Record<string, BreakdownSegment> = {};
    rankedRows.forEach((row) => {
      row.breakdown.forEach((seg) => {
        if (!agg[seg.key]) {
          agg[seg.key] = { ...seg, value: 0 };
        }
        agg[seg.key].value += seg.value;
      });
    });
    return Object.values(agg);
  }, [rankedRows]);

  // Resolve awards — run each pick function once and drop nulls.
  // Must be declared before any early returns to preserve hook order.
  const resolvedAwards = useMemo(() => {
    if (!awards || awards.length === 0) return [];
    return awards
      .map((a) => ({ award: a, winner: a.pick(rankedRows) }))
      .filter((x): x is { award: AwardConfig; winner: AwardWinner } => x.winner !== null);
  }, [awards, rankedRows]);

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          p: 6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!rankedRows.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          textAlign: 'center',
          py: 8,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: alpha(accentColor, 0.08),
            color: accentColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <IconInbox size={26} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          No data for this period
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Try a different date range or preset.
        </Typography>
      </Box>
    );
  }

  const topPerformer = rankedRows[0];
  const topPerformerShare =
    grandTotal > 0 ? ((topPerformer.total / grandTotal) * 100).toFixed(0) : '0';
  const teamAverage = rankedRows.length > 0 ? Math.round(grandTotal / rankedRows.length) : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5 }}>
      {/* ── Leaderboard ── */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: accentGradient,
                color: '#fff',
              }}
            >
              {icon || <IconChartBar size={18} />}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          <Chip
            label={`${rankedRows.length} ${rankedRows.length === 1 ? 'person' : 'people'}`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: alpha(accentColor, 0.1),
              color: accentColor,
              border: 'none',
            }}
          />
        </Box>

        <MotionBox
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          sx={{ p: { xs: 1.5, sm: 2 } }}
        >
          <Stack spacing={1}>
            {rankedRows.map((row) => (
              <MotionBox
                key={row.id || row.name}
                variants={staggerItem}
                whileHover={{ y: -1 }}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: row.rank === 1 ? alpha(accentColor, 0.3) : 'divider',
                  bgcolor: row.rank === 1 ? alpha(accentColor, 0.03) : 'background.paper',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: alpha(accentColor, 0.35),
                    boxShadow: `0 4px 12px ${alpha(accentColor, 0.08)}`,
                  },
                }}
              >
                {row.rank === 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 3,
                      background: accentGradient,
                    }}
                  />
                )}

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <RankBadge rank={row.rank} />
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      background: row.rank === 1 ? accentGradient : alpha(accentColor, 0.12),
                      color: row.rank === 1 ? '#fff' : accentColor,
                    }}
                  >
                    {getInitials(row.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {totalLabel}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    {row.totalHref ? (
                      <Link
                        href={row.totalHref}
                        target="_blank"
                        underline="none"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 0.5,
                          color: 'text.primary',
                          '&:hover': { color: accentColor },
                        }}
                      >
                        <AnimatedCounter
                          value={row.total}
                          variant="h4"
                          fontWeight={800}
                          sx={{ lineHeight: 1 }}
                        />
                      </Link>
                    ) : (
                      <AnimatedCounter
                        value={row.total}
                        variant="h4"
                        fontWeight={800}
                        color="text.primary"
                        sx={{ lineHeight: 1 }}
                      />
                    )}
                    {grandTotal > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {((row.total / grandTotal) * 100).toFixed(0)}% share
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <StackedBar segments={row.breakdown} total={row.total} />

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                  {row.breakdown.map((seg) => (
                    <Link
                      key={seg.key}
                      href={seg.href || '#'}
                      target={seg.href ? '_blank' : undefined}
                      underline="none"
                      onClick={(e) => !seg.href && e.preventDefault()}
                      sx={{
                        cursor: seg.href && seg.value > 0 ? 'pointer' : 'default',
                        pointerEvents: seg.value > 0 ? 'auto' : 'none',
                        opacity: seg.value > 0 ? 1 : 0.45,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.625,
                          px: 0.875,
                          py: 0.375,
                          borderRadius: 1.5,
                          bgcolor: alpha(seg.color, 0.1),
                          color: seg.color,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: `1px solid ${alpha(seg.color, 0.15)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': seg.value > 0
                            ? {
                                bgcolor: alpha(seg.color, 0.15),
                                borderColor: alpha(seg.color, 0.25),
                              }
                            : undefined,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: seg.color,
                          }}
                        />
                        {seg.label}: {seg.value}
                      </Box>
                    </Link>
                  ))}
                </Stack>
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>
      </Box>

      {/* ── Insights sidebar ── */}
      <Box sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
        <Stack spacing={2}>
          {/* Awards — either the custom-provided list or the default single top performer */}
          {resolvedAwards.length > 0 ? (
            resolvedAwards.map(({ award, winner }) =>
              award.variant === 'hero' ? (
                <HeroAwardCard
                  key={award.key}
                  award={award}
                  winner={winner}
                  accentGradient={accentGradient}
                />
              ) : (
                <CompactAwardCard key={award.key} award={award} winner={winner} />
              )
            )
          ) : (
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                background: tokens.gradients.darkSurface,
                color: '#fff',
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -20,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(accentColor, 0.25)} 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ position: 'relative', zIndex: 1, mb: 1 }}>
                <IconFlame size={14} color={tokens.colors.yellow} />
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 600 }}>
                  TOP PERFORMER
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    background: accentGradient,
                    color: '#fff',
                    fontWeight: 700,
                    boxShadow: tokens.shadows.aiGlow,
                  }}
                >
                  {getInitials(topPerformer.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }} noWrap>
                    {topPerformer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.75) }}>
                    {topPerformer.total} {totalLabel.toLowerCase()} · {topPerformerShare}% share
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Aggregate breakdown */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              p: 2.5,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
              <IconSparkles size={16} color={accentColor} />
              <Typography variant="subtitle2" fontWeight={700}>
                Team breakdown
              </Typography>
            </Stack>
            <Stack spacing={1.25}>
              {aggregate.map((seg) => {
                const pct = grandTotal > 0 ? (seg.value / grandTotal) * 100 : 0;
                return (
                  <Box key={seg.key}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.375 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seg.color }} />
                        <Typography variant="caption" color="text.primary" fontWeight={600}>
                          {seg.label}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {seg.value} · {pct.toFixed(0)}%
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(seg.color, 0.1), overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          height: '100%',
                          background: seg.color,
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Stack>

            <Box
              sx={{
                mt: 2.5,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 600 }}>
                  GRAND TOTAL
                </Typography>
                <AnimatedCounter value={grandTotal} variant="h5" fontWeight={800} color="text.primary" sx={{ display: 'block', lineHeight: 1, mt: 0.25 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 600 }}>
                  TEAM AVG
                </Typography>
                <AnimatedCounter value={teamAverage} variant="h5" fontWeight={800} color="text.primary" sx={{ display: 'block', lineHeight: 1, mt: 0.25 }} />
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
