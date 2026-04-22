import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { IconTrendingUp, IconTrendingDown, IconTrendingUp2 } from '@tabler/icons-react';
import Chart from 'react-apexcharts';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import { requirementCounts } from '../../services/requirementApi';
import AnimatedCounter from '../ui/AnimatedCounter';

type Range = '7d' | '30d' | '90d';

const RANGE_DAYS: Record<Range, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export default function RequirementTrendChart() {
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = RANGE_DAYS[range];
      const endDate = moment();
      const startDate = endDate.clone().subtract(days - 1, 'days');
      const dates: string[] = [];
      const cursor = startDate.clone();
      while (cursor.isSameOrBefore(endDate, 'day')) {
        dates.push(cursor.format('YYYY-MM-DD'));
        cursor.add(1, 'day');
      }
      const response = await requirementCounts(dates, '', false);
      const data = response.data || [];
      // Fill gaps — ensure every date has an entry
      const countMap = new Map<string, number>();
      data.forEach((c) => countMap.set(c.date.slice(0, 10), c.count));
      const filled = dates.map((d) => ({ date: d, count: countMap.get(d) || 0 }));
      setSeries(filled);
    } catch (e) {
      console.error('RequirementTrendChart load error', e);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const { total, average, peak, trend } = useMemo(() => {
    const values = series.map((s) => s.count);
    const t = values.reduce((a, b) => a + b, 0);
    const a = values.length > 0 ? Math.round(t / values.length) : 0;
    const p = Math.max(0, ...values);

    // Compare first half vs second half for trend
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half).reduce((x, y) => x + y, 0);
    const secondHalf = values.slice(half).reduce((x, y) => x + y, 0);
    let tr: 'up' | 'down' | 'flat' = 'flat';
    let trPct = 0;
    if (firstHalf > 0) {
      trPct = ((secondHalf - firstHalf) / firstHalf) * 100;
      if (trPct > 5) tr = 'up';
      else if (trPct < -5) tr = 'down';
    } else if (secondHalf > 0) {
      tr = 'up';
      trPct = 100;
    }
    return { total: t, average: a, peak: p, trend: { dir: tr, pct: Math.round(Math.abs(trPct)) } };
  }, [series]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: "'Inter Variable', 'Inter', sans-serif",
        foreColor: '#5A6B7F',
        sparkline: { enabled: false },
        zoom: { enabled: false },
      },
      colors: [tokens.colors.pink],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 95, 100],
          colorStops: [
            { offset: 0, color: tokens.colors.pink, opacity: 0.35 },
            { offset: 100, color: tokens.colors.blue, opacity: 0.02 },
          ],
        },
      },
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      grid: {
        borderColor: 'rgba(0,0,0,0.06)',
        strokeDashArray: 3,
        padding: { left: 0, right: 10, top: 0, bottom: 0 },
      },
      xaxis: {
        categories: series.map((s) =>
          range === '7d'
            ? moment(s.date).format('ddd')
            : range === '30d'
              ? moment(s.date).format('MMM D')
              : moment(s.date).format('MMM D')
        ),
        labels: {
          style: { fontSize: '0.7rem' },
          rotate: 0,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: range === '90d' ? 6 : range === '30d' ? 6 : 7,
      },
      yaxis: {
        labels: {
          style: { fontSize: '0.7rem' },
          formatter: (v) => Math.round(v).toString(),
        },
        tickAmount: 4,
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (v) => `${v} ${v === 1 ? 'requirement' : 'requirements'}`,
        },
      },
      markers: {
        size: 0,
        hover: { size: 5 },
        strokeColors: '#fff',
        strokeWidth: 2,
      },
      legend: { show: false },
    }),
    [series, range]
  );

  const trendColor =
    trend.dir === 'up' ? tokens.colors.success : trend.dir === 'down' ? tokens.colors.error : tokens.colors.lightTextSecondary;
  const TrendIcon = trend.dir === 'up' ? IconTrendingUp : trend.dir === 'down' ? IconTrendingDown : IconTrendingUp2;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Requirement trend
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Daily intake · last {RANGE_DAYS[range]} days
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={range}
          exclusive
          size="small"
          onChange={(_, v) => v && setRange(v)}
          sx={{
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.5,
              fontSize: '0.72rem',
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
          <ToggleButton value="7d">7d</ToggleButton>
          <ToggleButton value="30d">30d</ToggleButton>
          <ToggleButton value="90d">90d</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Stat ribbon */}
      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            TOTAL
          </Typography>
          <AnimatedCounter
            value={total}
            variant="h4"
            fontWeight={800}
            color="text.primary"
            sx={{ display: 'block', lineHeight: 1 }}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            AVG / DAY
          </Typography>
          <AnimatedCounter
            value={average}
            variant="h4"
            fontWeight={800}
            color="text.primary"
            sx={{ display: 'block', lineHeight: 1 }}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            PEAK
          </Typography>
          <AnimatedCounter
            value={peak}
            variant="h4"
            fontWeight={800}
            color="text.primary"
            sx={{ display: 'block', lineHeight: 1 }}
          />
        </Box>
        {trend.dir !== 'flat' && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 2,
              bgcolor: alpha(trendColor, 0.1),
              color: trendColor,
              alignSelf: 'center',
              ml: 'auto !important',
            }}
          >
            <TrendIcon size={14} />
            <Typography variant="caption" fontWeight={700}>
              {trend.pct}% vs first half
            </Typography>
          </Box>
        )}
      </Stack>

      {loading ? (
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
      ) : (
        <Box sx={{ mx: -1 }}>
          <Chart
            options={chartOptions}
            series={[{ name: 'Requirements', data: series.map((s) => s.count) }]}
            type="area"
            height={240}
          />
        </Box>
      )}
    </Box>
  );
}
