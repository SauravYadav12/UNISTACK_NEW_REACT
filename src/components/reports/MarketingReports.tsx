import { useMemo, useState } from 'react';
import { MarketingReport } from '../../Interfaces/reports';
import PerformanceLeaderboard, { PerformanceRow } from './PerformanceLeaderboard';
import { MyReportsProps } from './SupportReports';
import { IconTargetArrow } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import MarketingPositionsDrawer from './MarketingPositionsDrawer';

export const MarketingReports = ({
  fromDate,
  toDate,
  report,
  loading,
}: MyReportsProps<MarketingReport>) => {
  // The clicked number opens an in-app drawer (person + optional status).
  const [drawer, setDrawer] = useState<{
    person: { id: string; name: string };
    status?: string;
  } | null>(null);

  const rows: PerformanceRow[] = useMemo(() => {
    return (report || []).map((a) => {
      const person = { id: a.id || '', name: a.name || 'Unknown' };
      const open = (status?: string) => setDrawer({ person, status });
      return {
        id: a.id,
        name: a.name || 'Unknown',
        total: a.totalAssigned || 0,
        onTotalClick: () => open(),
        breakdown: [
          {
            key: 'Submission in progress',
            label: 'In progress',
            color: tokens.colors.warning,
            value: a['Submission in progress'] || 0,
            onClick: () => open('Submission in progress'),
          },
          {
            key: 'Submitted',
            label: 'Submitted',
            color: tokens.colors.success,
            value: a.Submitted || 0,
            onClick: () => open('Submitted'),
          },
          {
            key: 'Interviewed',
            label: 'Interviewed',
            color: tokens.colors.blue,
            value: a.Interviewed || 0,
            onClick: () => open('Interviewed'),
          },
          {
            key: 'Cancelled',
            label: 'Cancelled',
            color: tokens.colors.error,
            value: a.Cancelled || 0,
            onClick: () => open('Cancelled'),
          },
        ],
      };
    });
  }, [report]);

  return (
    <>
      <PerformanceLeaderboard
        title="Marketing leaderboard"
        subtitle="Positions by current status — dated by when the status changed"
        totalLabel="Positions"
        rows={rows}
        loading={loading}
        icon={<IconTargetArrow size={18} />}
        accentColor={tokens.colors.pink}
        accentGradient={tokens.gradients.pinkBlue}
      />
      <MarketingPositionsDrawer
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        person={drawer?.person || null}
        status={drawer?.status}
        fromDate={fromDate || ''}
        toDate={toDate || ''}
      />
    </>
  );
};
