import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Tooltip,
  Skeleton,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { IconFlame, IconRefresh } from '@tabler/icons-react';
import moment from 'moment';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';
import { requirementCounts } from '../../services/requirementApi';

type RangeKey = '7d' | '2w' | '12w' | '26w' | '52w';

interface RangeConfig {
  key: RangeKey;
  label: string;
  /** compute [startDate, endDate] inclusive */
  compute: () => { start: moment.Moment; end: moment.Moment };
}

const RANGES: RangeConfig[] = [
  {
    key: '7d',
    label: '7 days',
    compute: () => {
      const end = moment().startOf('day');
      const start = end.clone().subtract(6, 'days');
      return { start, end };
    },
  },
  {
    key: '2w',
    label: '2 weeks',
    compute: () => {
      const end = moment().startOf('day');
      const start = end.clone().subtract(13, 'days');
      return { start, end };
    },
  },
  {
    key: '12w',
    label: '12 weeks',
    compute: () => {
      const end = moment().day(6).startOf('day'); // this Saturday
      const start = end.clone().subtract(12 * 7 - 1, 'days');
      return { start, end };
    },
  },
  {
    key: '26w',
    label: '6 months',
    compute: () => {
      const end = moment().day(6).startOf('day');
      const start = end.clone().subtract(26 * 7 - 1, 'days');
      return { start, end };
    },
  },
  {
    key: '52w',
    label: '1 year',
    compute: () => {
      const end = moment().day(6).startOf('day');
      const start = end.clone().subtract(52 * 7 - 1, 'days');
      return { start, end };
    },
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface HeatCell {
  date: moment.Moment;
  count: number;
  intensity: number;
}

function getIntensityColor(intensity: number, baseColor: string) {
  if (intensity === 0) return alpha(tokens.colors.brand, 0.06);
  const pct = intensity <= 0.25 ? 0.2 : intensity <= 0.5 ? 0.45 : intensity <= 0.75 ? 0.7 : 1;
  return alpha(baseColor, pct);
}

export default function ActivityHeatmap() {
  const [range, setRange] = useState<RangeKey>('12w');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ date: string; count: number }[]>([]);

  const rangeConfig = RANGES.find((r) => r.key === range) || RANGES[2];

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = rangeConfig.compute();
      const dates: string[] = [];
      const cursor = start.clone();
      while (cursor.isSameOrBefore(end, 'day')) {
        dates.push(cursor.format('YYYY-MM-DD'));
        cursor.add(1, 'day');
      }
      const response = await requirementCounts(dates, '', false);
      const data = response.data || [];
      setCounts(data);
    } catch (e) {
      console.error('ActivityHeatmap load error', e);
      setCounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Layout mode — "horizontal strip" for very short ranges, "columnar" for longer
  const isHorizontal = range === '7d';
  const isCompactGrid = range === '2w';

  // Build data structures
  const { weeks, horizontalCells, maxCount, totalCount, activeDays, bestDay } = useMemo((): {
    weeks: (HeatCell | null)[][];
    horizontalCells: HeatCell[];
    maxCount: number;
    totalCount: number;
    activeDays: number;
    bestDay: HeatCell | null;
  } => {
    const { start, end } = rangeConfig.compute();

    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c.date.slice(0, 10), c.count));

    const allCells: HeatCell[] = [];
    const cursor = start.clone();
    while (cursor.isSameOrBefore(end, 'day')) {
      const key = cursor.format('YYYY-MM-DD');
      const count = countMap.get(key) || 0;
      allCells.push({ date: cursor.clone(), count, intensity: 0 });
      cursor.add(1, 'day');
    }

    const max = allCells.reduce((m, c) => Math.max(m, c.count), 0);
    let total = 0;
    let active = 0;
    let best: HeatCell | null = null;

    allCells.forEach((c) => {
      c.intensity = max > 0 ? c.count / max : 0;
      if (c.count > 0) {
        total += c.count;
        active += 1;
        if (!best || c.count > (best as HeatCell).count) best = c;
      }
    });

    // Build weekly columns for columnar layout (pad to full weeks)
    const weeksData: (HeatCell | null)[][] = [];
    if (!isHorizontal && allCells.length > 0) {
      // Pad start to Monday
      const firstDayIndex = (allCells[0].date.isoWeekday() - 1 + 7) % 7;
      let padded: (HeatCell | null)[] = [];
      for (let i = 0; i < firstDayIndex; i++) padded.push(null);
      padded = padded.concat(allCells);
      // Pad end to Sunday
      while (padded.length % 7 !== 0) padded.push(null);

      for (let w = 0; w < padded.length / 7; w++) {
        weeksData.push(padded.slice(w * 7, (w + 1) * 7));
      }
    }

    return {
      weeks: weeksData,
      horizontalCells: allCells,
      maxCount: max,
      totalCount: total,
      activeDays: active,
      bestDay: best,
    };
  }, [counts, rangeConfig, isHorizontal]);

  // Month labels for columnar layout
  const monthLabels = useMemo(() => {
    const labels: { week: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      const firstReal = w.find((c) => c !== null);
      if (!firstReal) return;
      const m = firstReal.date.month();
      if (m !== lastMonth) {
        labels.push({ week: i, label: firstReal.date.format('MMM') });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  // Cell height gets a little bigger for shorter ranges so the card still feels proportioned
  const cellGap = 3;
  const cellMaxSize = isHorizontal
    ? 72
    : isCompactGrid
      ? 48
      : range === '12w'
        ? 24
        : range === '26w'
          ? 18
          : 14;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5 },
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
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
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              boxShadow: tokens.shadows.glow,
            }}
          >
            <IconFlame size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Requirement activity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Daily heatmap · every cell = one day of new requirements
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(_, v) => v && setRange(v as RangeKey)}
            sx={{
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                px: 1.25,
                py: 0.5,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'none',
                border: '1px solid',
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: alpha(tokens.colors.pink, 0.1),
                  color: tokens.colors.pinkDark,
                  borderColor: alpha(tokens.colors.pink, 0.3),
                },
              },
            }}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.key} value={r.key}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadData}
              sx={{ color: 'text.secondary' }}
            >
              <IconRefresh size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Summary stats */}
      <Stack direction="row" spacing={2.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 600 }}>
            TOTAL
          </Typography>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
            {totalCount}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 600 }}>
            ACTIVE DAYS
          </Typography>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
            {activeDays}
          </Typography>
        </Box>
        {bestDay && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 600 }}>
              BEST DAY
            </Typography>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {bestDay.count} · {bestDay.date.format('MMM D')}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Grid */}
      {loading ? (
        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 2 }} />
      ) : isHorizontal ? (
        // ── Horizontal strip for 7d / 1w ──
        <HorizontalStrip cells={horizontalCells} cellGap={cellGap} maxCellSize={cellMaxSize} />
      ) : (
        // ── Columnar weeks × days grid (fills full width) ──
        <ColumnarGrid
          weeks={weeks}
          monthLabels={monthLabels}
          cellGap={cellGap}
          cellMaxSize={cellMaxSize}
        />
      )}

      {/* Legend */}
      {!loading && (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          {[0, 0.25, 0.5, 0.75, 1].map((lvl) => (
            <Box
              key={lvl}
              sx={{
                width: 11,
                height: 11,
                borderRadius: 0.75,
                bgcolor: getIntensityColor(lvl, tokens.colors.pink),
                border: `1px solid ${alpha(tokens.colors.brand, 0.04)}`,
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
          {maxCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              · Peak {maxCount}/day
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

/**
 * ColumnarGrid — classic weeks-as-columns layout with flex:1 columns
 * so the heatmap always fills the full card width, regardless of how
 * many weeks are in the range.
 */
function ColumnarGrid({
  weeks,
  monthLabels,
  cellGap,
  cellMaxSize,
}: {
  weeks: (HeatCell | null)[][];
  monthLabels: { week: number; label: string }[];
  cellGap: number;
  cellMaxSize: number;
}) {
  const today = moment();
  return (
    <Box sx={{ width: '100%' }}>
      {/* Month labels row */}
      <Box
        sx={{
          display: 'flex',
          gap: `${cellGap}px`,
          pl: '32px',
          mb: 0.5,
          height: 14,
        }}
      >
        {weeks.map((_, i) => {
          const label = monthLabels.find((m) => m.week === i);
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.66rem',
                color: 'text.secondary',
                fontWeight: 600,
                position: 'relative',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {label?.label || ''}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: `${cellGap}px`, alignItems: 'flex-start' }}>
        {/* Day labels column */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${cellGap}px`,
            width: 28,
            flexShrink: 0,
            mr: 0.5,
          }}
        >
          {DAYS.map((d, i) => (
            <Box
              key={d}
              sx={{
                flex: 1,
                fontSize: '0.62rem',
                color: 'text.secondary',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                visibility: i % 2 === 1 ? 'visible' : 'hidden',
              }}
            >
              {d}
            </Box>
          ))}
        </Box>

        {/* Week columns — flex:1 so they evenly fill card width */}
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: `${cellGap}px`,
            }}
          >
            {week.map((cell, di) => {
              if (!cell) {
                // padding cell
                return (
                  <Box
                    key={di}
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      maxHeight: cellMaxSize,
                      borderRadius: 0.75,
                      bgcolor: 'transparent',
                    }}
                  />
                );
              }
              const color = getIntensityColor(cell.intensity, tokens.colors.pink);
              const isFuture = cell.date.isAfter(today, 'day');
              return (
                <Tooltip
                  key={di}
                  title={
                    isFuture
                      ? ''
                      : `${cell.count} ${cell.count === 1 ? 'requirement' : 'requirements'} · ${cell.date.format('ddd, MMM D YYYY')}`
                  }
                  arrow
                  disableHoverListener={isFuture}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: isFuture ? 0.25 : 1, scale: 1 }}
                    transition={{
                      delay: (wi * 7 + di) * 0.002,
                      duration: 0.25,
                    }}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      maxHeight: cellMaxSize,
                      borderRadius: 4,
                      background: color,
                      border: `1px solid ${alpha(tokens.colors.brand, 0.04)}`,
                      cursor: isFuture ? 'default' : 'pointer',
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * HorizontalStrip — one-row layout for very short ranges (7d / 1w)
 * with day labels and dates shown under each cell, filling full width.
 */
function HorizontalStrip({
  cells,
  cellGap,
  maxCellSize,
}: {
  cells: HeatCell[];
  cellGap: number;
  maxCellSize: number;
}) {
  const today = moment();
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: `${cellGap * 2}px`, width: '100%' }}>
        {cells.map((cell, i) => {
          const color = getIntensityColor(cell.intensity, tokens.colors.pink);
          const isFuture = cell.date.isAfter(today, 'day');
          const isToday = cell.date.isSame(today, 'day');
          return (
            <Tooltip
              key={i}
              title={
                isFuture
                  ? `${cell.date.format('ddd, MMM D')} · upcoming`
                  : `${cell.count} ${cell.count === 1 ? 'requirement' : 'requirements'} · ${cell.date.format('ddd, MMM D YYYY')}`
              }
              arrow
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0.75,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: isFuture ? 0.3 : 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: maxCellSize,
                    borderRadius: 10,
                    background: color,
                    border: isToday
                      ? `2px solid ${tokens.colors.pink}`
                      : `1px solid ${alpha(tokens.colors.brand, 0.06)}`,
                    boxShadow: cell.intensity > 0.6 ? `0 4px 14px ${alpha(tokens.colors.pink, 0.25)}` : 'none',
                    cursor: isFuture ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cell.count > 0 && (
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      sx={{
                        color: cell.intensity > 0.5 ? '#fff' : tokens.colors.pinkDark,
                        fontSize: '1rem',
                        textShadow: cell.intensity > 0.5 ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {cell.count}
                    </Typography>
                  )}
                </motion.div>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: isToday ? tokens.colors.pink : 'text.primary',
                      lineHeight: 1.1,
                    }}
                  >
                    {cell.date.format('ddd')}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.65rem' }}
                  >
                    {cell.date.format('MMM D')}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
