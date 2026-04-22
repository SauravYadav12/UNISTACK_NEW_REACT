import { Box, Typography, Stack, alpha } from '@mui/material';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import Chart from 'react-apexcharts';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../ui/AnimatedCounter';

const MotionBox = motion.create(Box);

interface Props {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  /** Optional 7-day series for sparkline trend */
  sparkline?: number[];
  /** Optional trend override (if not provided, computed from sparkline) */
  trend?: { dir: 'up' | 'down' | 'flat'; pct: number };
  subtitle?: string;
}

function computeTrend(data?: number[]): { dir: 'up' | 'down' | 'flat'; pct: number } {
  if (!data || data.length < 2) return { dir: 'flat', pct: 0 };
  const half = Math.floor(data.length / 2);
  const a = data.slice(0, half).reduce((s, v) => s + v, 0);
  const b = data.slice(half).reduce((s, v) => s + v, 0);
  if (a === 0 && b === 0) return { dir: 'flat', pct: 0 };
  if (a === 0) return { dir: 'up', pct: 100 };
  const p = ((b - a) / a) * 100;
  if (p > 5) return { dir: 'up', pct: Math.round(p) };
  if (p < -5) return { dir: 'down', pct: Math.round(Math.abs(p)) };
  return { dir: 'flat', pct: 0 };
}

export default function PulseStatCard({
  title,
  value,
  icon,
  color,
  sparkline,
  trend: trendProp,
  subtitle,
}: Props) {
  const trend = trendProp || computeTrend(sparkline);

  const sparkOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 800 },
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: [color],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    tooltip: {
      enabled: false,
    },
    markers: { size: 0 },
  };

  const hasSparkline = Array.isArray(sparkline) && sparkline.length > 1;

  const TrendIcon =
    trend.dir === 'up' ? IconTrendingUp : trend.dir === 'down' ? IconTrendingDown : IconMinus;
  const trendColor =
    trend.dir === 'up'
      ? tokens.colors.success
      : trend.dir === 'down'
        ? tokens.colors.error
        : tokens.colors.lightTextSecondary;

  return (
    <MotionBox
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      sx={{
        p: 2.25,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.3),
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: color,
          opacity: 0.75,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        {trend.dir !== 'flat' && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.375,
              px: 0.75,
              py: 0.25,
              borderRadius: 1.25,
              bgcolor: alpha(trendColor, 0.1),
              color: trendColor,
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            <TrendIcon size={12} />
            {trend.pct}%
          </Box>
        )}
      </Stack>

      <AnimatedCounter
        value={value}
        variant="h2"
        fontWeight={800}
        color="text.primary"
        sx={{ lineHeight: 1, display: 'block' }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: alpha(color, 0.8), fontSize: '0.7rem', fontWeight: 600 }}>
          {subtitle}
        </Typography>
      )}

      {hasSparkline && (
        <Box sx={{ mt: 1.5, mx: -1, mb: -1, height: 40 }}>
          <Chart
            options={sparkOptions}
            series={[{ name: title, data: sparkline! }]}
            type="area"
            height={40}
            width="100%"
          />
        </Box>
      )}
    </MotionBox>
  );
}
