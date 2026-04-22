import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Tooltip,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { IconArrowDownRight, IconFilter } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../ui/AnimatedCounter';
import { requirementCounts } from '../../services/requirementApi';
import { getInterviewReport } from '../../services/reportsApi';

interface Stage {
  label: string;
  value: number;
  color: string;
  gradient: string;
}

type RangeKey = '7d' | '2w' | '4w' | '6M' | '1Y';

interface RangeConfig {
  key: RangeKey;
  label: string;
  /** Returns [start, end] as moments (end = today) */
  compute: () => { start: moment.Moment; end: moment.Moment };
}

const RANGES: RangeConfig[] = [
  {
    key: '7d',
    label: '7 days',
    compute: () => ({
      start: moment().subtract(6, 'days').startOf('day'),
      end: moment().endOf('day'),
    }),
  },
  {
    key: '2w',
    label: '2 weeks',
    compute: () => ({
      start: moment().subtract(13, 'days').startOf('day'),
      end: moment().endOf('day'),
    }),
  },
  {
    key: '4w',
    label: '4 weeks',
    compute: () => ({
      start: moment().subtract(27, 'days').startOf('day'),
      end: moment().endOf('day'),
    }),
  },
  {
    key: '6M',
    label: '6 months',
    compute: () => ({
      start: moment().subtract(6, 'months').add(1, 'day').startOf('day'),
      end: moment().endOf('day'),
    }),
  },
  {
    key: '1Y',
    label: '1 year',
    compute: () => ({
      start: moment().subtract(1, 'year').add(1, 'day').startOf('day'),
      end: moment().endOf('day'),
    }),
  },
];

const MotionBox = motion.create(Box);

interface Props {
  /** Optional default range — defaults to '4w' */
  defaultRange?: RangeKey;
}

export default function ConversionFunnel({ defaultRange = '4w' }: Props) {
  const [range, setRange] = useState<RangeKey>(defaultRange);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    requirements: 0,
    interviews: 0,
    confirmed: 0,
  });

  const rangeConfig = RANGES.find((r) => r.key === range) || RANGES[2];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { start, end } = rangeConfig.compute();
        const fromDateSlash = start.format('YYYY/MM/DD');
        const toDateSlash = end.format('YYYY/MM/DD');

        // Build the list of dates for requirementCounts
        const dates: string[] = [];
        const cursor = start.clone();
        while (cursor.isSameOrBefore(end, 'day')) {
          dates.push(cursor.format('YYYY-MM-DD'));
          cursor.add(1, 'day');
        }

        const [reqResp, intResp] = await Promise.all([
          requirementCounts(dates, '', false),
          getInterviewReport(fromDateSlash, toDateSlash),
        ]);

        if (cancelled) return;

        // Requirements — sum counts over the range
        const totalRequirements = (reqResp.data || []).reduce(
          (sum, c) => sum + (c.count || 0),
          0
        );

        // Interviews — backend totals
        const totalInterviews = intResp.data.data?.totalInterviews || 0;

        // Confirmed — sum "Interview Confirm" across all rows
        const reportRows = intResp.data.data?.report || [];
        const totalConfirmed = reportRows.reduce(
          (sum, r) => sum + (r['Interview Confirm'] || 0),
          0
        );

        setData({
          requirements: totalRequirements,
          interviews: totalInterviews,
          confirmed: totalConfirmed,
        });
      } catch (e) {
        console.error('ConversionFunnel load error', e);
        if (!cancelled) setData({ requirements: 0, interviews: 0, confirmed: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stages: Stage[] = useMemo(
    () => [
      {
        label: 'Requirements',
        value: data.requirements,
        color: tokens.colors.pink,
        gradient: 'linear-gradient(90deg, #EC4599 0%, #F472B6 100%)',
      },
      {
        label: 'Interviews',
        value: data.interviews,
        color: tokens.colors.blue,
        gradient: 'linear-gradient(90deg, #37B7EA 0%, #5CC8F0 100%)',
      },
      {
        label: 'Confirmed',
        value: data.confirmed,
        color: tokens.colors.success,
        gradient: 'linear-gradient(90deg, #10B981 0%, #6EE7B7 100%)',
      },
    ],
    [data]
  );

  const maxVal = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
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
              bgcolor: alpha(tokens.colors.pink, 0.1),
              color: tokens.colors.pink,
            }}
          >
            <IconFilter size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Conversion funnel
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pipeline drop-off at each stage
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Range filter */}
      <ToggleButtonGroup
        value={range}
        exclusive
        size="small"
        onChange={(_, v) => v && setRange(v as RangeKey)}
        sx={{
          flexWrap: 'wrap',
          mb: 2,
          '& .MuiToggleButton-root': {
            px: 1.25,
            py: 0.375,
            fontSize: '0.68rem',
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

      {loading ? (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : (
        <Stack spacing={1}>
          {stages.map((stage, i) => {
            const widthPct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
            const prev = i > 0 ? stages[i - 1].value : null;
            const conversionPct =
              prev !== null && prev > 0 ? ((stage.value / prev) * 100).toFixed(0) : null;

            return (
              <Box key={stage.label}>
                <MotionBox
                  key={`${range}-${stage.label}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  sx={{ position: 'relative' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.75 }}
                  >
                    <Typography variant="caption" fontWeight={700} color="text.primary">
                      {stage.label}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <AnimatedCounter
                        key={`${range}-${stage.label}-v`}
                        value={stage.value}
                        variant="subtitle2"
                        fontWeight={800}
                        color="text.primary"
                      />
                      {maxVal > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          · {((stage.value / maxVal) * 100).toFixed(0)}%
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                  <Tooltip title={`${stage.value} ${stage.label.toLowerCase()}`} arrow>
                    <Box
                      sx={{
                        height: 14,
                        borderRadius: 2,
                        bgcolor: alpha(stage.color, 0.08),
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        key={`${range}-${stage.label}-bar`}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{
                          duration: 1.2,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.1 + i * 0.1,
                        }}
                        style={{
                          height: '100%',
                          borderRadius: 8,
                          background: stage.gradient,
                          boxShadow: `0 0 10px ${alpha(stage.color, 0.3)}`,
                        }}
                      />
                    </Box>
                  </Tooltip>
                </MotionBox>

                {/* Conversion arrow between stages */}
                {conversionPct !== null && i < stages.length - 1 && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ my: 0.5, pl: 1 }}>
                    <IconArrowDownRight
                      size={12}
                      color={
                        +conversionPct >= 50
                          ? tokens.colors.success
                          : +conversionPct >= 25
                            ? tokens.colors.warning
                            : tokens.colors.error
                      }
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color:
                          +conversionPct >= 50
                            ? tokens.colors.success
                            : +conversionPct >= 25
                              ? tokens.colors.warning
                              : tokens.colors.error,
                      }}
                    >
                      {conversionPct}% → {stages[i + 1].label.toLowerCase()}
                    </Typography>
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Summary */}
      {!loading && (
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: '0.04em', fontWeight: 600 }}
            >
              END-TO-END
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: tokens.colors.pink }}>
              {data.requirements > 0
                ? `${((data.confirmed / data.requirements) * 100).toFixed(0)}%`
                : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: '0.04em', fontWeight: 600 }}
            >
              CONFIRMED
            </Typography>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              {data.confirmed}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
