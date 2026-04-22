import { useMemo } from 'react';
import { SupportReport } from '../../Interfaces/reports';
import PerformanceLeaderboard, {
  AwardConfig,
  PerformanceRow,
} from './PerformanceLeaderboard';
import {
  IconHeadset,
  IconFlame,
  IconBolt,
  IconClipboardList,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

export interface MyReportsProps<T> {
  report?: T[];
  loading?: boolean;
  fromDate?: string;
  toDate?: string;
}

// Minimum entered positions required for the conversion-ratio award so a person
// who entered only 1 and submitted 1 doesn't game the "Top Performer" slot.
const MIN_ENTRIES_FOR_RATIO = 3;

const getSubmitted = (row: PerformanceRow) =>
  row.breakdown.find((s) => s.key === 'Submitted')?.value || 0;

export const SupportReports = ({
  report,
  loading,
  fromDate,
  toDate,
}: MyReportsProps<SupportReport>) => {
  const rows: PerformanceRow[] = useMemo(() => {
    return (report || []).map((a) => {
      const base = `/requirements?fromDate=${fromDate}&toDate=${toDate}&reqEnteredByRef=${a.id}`;
      const title = a.name ? a.name.slice(0, 1).toUpperCase() + a.name.slice(1) : 'Unknown';
      return {
        id: a.id,
        name: title,
        total: a.totalPositions || 0,
        totalHref: base,
        breakdown: [
          {
            key: 'Submitted',
            label: 'Submitted',
            color: tokens.colors.success,
            value: a.Submitted || 0,
            href: `${base}&reqStatus=Submitted`,
          },
          {
            key: 'Cancelled',
            label: 'Cancelled',
            color: tokens.colors.error,
            value: a.Cancelled || 0,
            href: `${base}&reqStatus=Cancelled`,
          },
        ],
      };
    });
  }, [report, fromDate, toDate]);

  const awards: AwardConfig[] = useMemo(
    () => [
      {
        key: 'top-performer',
        label: 'Top Performer',
        hint: 'Best submitted-to-entered conversion ratio',
        icon: <IconFlame size={14} />,
        accentColor: tokens.colors.pink,
        accentGradient: tokens.gradients.pinkBlue,
        variant: 'hero',
        pick: (all) => {
          // Prefer people who entered ≥ threshold; fallback to any with entries
          const eligible = all.filter((r) => r.total >= MIN_ENTRIES_FOR_RATIO);
          const pool = eligible.length > 0 ? eligible : all.filter((r) => r.total > 0);
          if (!pool.length) return null;
          const best = pool.reduce((a, b) =>
            getSubmitted(b) / b.total > getSubmitted(a) / a.total ? b : a
          );
          const submitted = getSubmitted(best);
          const pct = ((submitted / best.total) * 100).toFixed(0);
          return {
            row: best,
            primary: `${pct}% conversion`,
            secondary: `${submitted} submitted of ${best.total} entered`,
          };
        },
      },
      {
        key: 'good-positions',
        label: 'Good Positions',
        hint: 'Most positions submitted',
        icon: <IconBolt size={18} />,
        accentColor: tokens.colors.success,
        variant: 'card',
        pick: (all) => {
          const pool = all.filter((r) => getSubmitted(r) > 0);
          if (!pool.length) return null;
          const best = pool.reduce((a, b) => (getSubmitted(b) > getSubmitted(a) ? b : a));
          const submitted = getSubmitted(best);
          return {
            row: best,
            primary: `${submitted} submitted`,
            secondary: `${best.total} entered`,
          };
        },
      },
      {
        key: 'most-entered',
        label: 'Most Position Entered',
        hint: 'Most positions entered into the system',
        icon: <IconClipboardList size={18} />,
        accentColor: tokens.colors.blue,
        variant: 'card',
        pick: (all) => {
          const pool = all.filter((r) => r.total > 0);
          if (!pool.length) return null;
          const best = pool.reduce((a, b) => (b.total > a.total ? b : a));
          return {
            row: best,
            primary: `${best.total} entered`,
            secondary: `${getSubmitted(best)} submitted`,
          };
        },
      },
    ],
    []
  );

  return (
    <PerformanceLeaderboard
      title="Support leaderboard"
      subtitle="Positions entered by each teammate"
      totalLabel="Positions entered"
      rows={rows}
      loading={loading}
      icon={<IconHeadset size={18} />}
      accentColor={tokens.colors.blue}
      accentGradient="linear-gradient(135deg, #37B7EA 0%, #1A9FD4 100%)"
      awards={awards}
    />
  );
};
