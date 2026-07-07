import { Box, Skeleton, Stack, Typography, alpha } from '@mui/material';
import Chart from 'react-apexcharts';
import { useMemo } from 'react';
import { tokens } from '../../theme/theme';
import { ChessLeadStats } from '../../Interfaces/chessLead';
import {
  IconChessKnight,
  IconFlame,
  IconCalendarEvent,
  IconAlertTriangle,
  IconCoin,
} from '@tabler/icons-react';
import { CHESS_STATUS_COLORS } from './chessLeadsValues';

interface Props {
  stats: ChessLeadStats | null;
  loading: boolean;
}

/**
 * Top-of-page header for the Chess Leads module.
 *   • Five compact tiles: Total, Hot leads, Follow-ups due today, Overdue,
 *     Est. MRR (∑ totalIds × pricingPerId across New + Renewed).
 *   • Donut chart of status distribution — same colour palette as the
 *     status chips in the grid so the two read together.
 */
export default function ChessLeadsDashboard({ stats, loading }: Props) {
  const donut = useMemo(() => {
    if (!stats) return { series: [], labels: [] };
    const labels = Object.keys(stats.statusCounts);
    const series = Object.values(stats.statusCounts);
    return { series, labels };
  }, [stats]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 2.5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 1.25,
        }}
      >
        <Tile
          label="Total leads"
          value={stats?.total ?? 0}
          loading={loading}
          icon={<IconChessKnight size={16} />}
          color={tokens.colors.blueDark}
        />
        <Tile
          label="Hot leads"
          value={stats?.priorityCounts.Hot ?? 0}
          loading={loading}
          icon={<IconFlame size={16} />}
          color="#EF4444"
        />
        <Tile
          label="Follow-ups today"
          value={stats?.followUpsDueToday ?? 0}
          loading={loading}
          icon={<IconCalendarEvent size={16} />}
          color={tokens.colors.pinkDark}
        />
        <Tile
          label="Overdue"
          value={stats?.followUpsOverdue ?? 0}
          loading={loading}
          icon={<IconAlertTriangle size={16} />}
          color="#F59E0B"
        />
        <Tile
          label="Est. MRR"
          value={stats?.mrr ?? 0}
          loading={loading}
          icon={<IconCoin size={16} />}
          color="#10B981"
          currency
        />
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(tokens.colors.blue, 0.15)}`,
          bgcolor: '#fff',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', mb: 0.5 }}>
          Status split
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Leads by their current pipeline stage.
        </Typography>
        {loading || !stats ? (
          <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} />
        ) : donut.series.every((v) => v === 0) ? (
          <Box
            sx={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            No leads yet — add one to see the split.
          </Box>
        ) : (
          <Chart
            type="donut"
            height={200}
            series={donut.series}
            options={{
              labels: donut.labels,
              colors: donut.labels.map(
                (l) => CHESS_STATUS_COLORS[l as keyof typeof CHESS_STATUS_COLORS],
              ),
              legend: { position: 'bottom', fontSize: '11px' },
              dataLabels: { enabled: true, formatter: (v: number) => `${Math.round(v)}%` },
              plotOptions: {
                pie: {
                  donut: {
                    size: '65%',
                    labels: {
                      show: true,
                      total: { show: true, label: 'Total', fontSize: '12px', fontWeight: 700 },
                    },
                  },
                },
              },
              stroke: { width: 0 },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function Tile({
  label,
  value,
  loading,
  icon,
  color,
  currency,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  color: string;
  currency?: boolean;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: `1px solid ${alpha(color, 0.25)}`,
        bgcolor: alpha(color, 0.04),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color, mb: 0.5 }}>
        {icon}
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
        >
          {label}
        </Typography>
      </Stack>
      {loading ? (
        <Skeleton width={60} height={28} />
      ) : (
        <Typography sx={{ fontWeight: 900, fontSize: '1.35rem', color }}>
          {currency ? `₹${value.toLocaleString('en-IN')}` : value}
        </Typography>
      )}
    </Box>
  );
}
