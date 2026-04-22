import { useMemo } from 'react';
import { MarketingReport } from '../../Interfaces/reports';
import PerformanceLeaderboard, { PerformanceRow } from './PerformanceLeaderboard';
import { MyReportsProps } from './SupportReports';
import { IconTargetArrow } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

export const MarketingReports = ({
  fromDate,
  toDate,
  report,
  loading,
}: MyReportsProps<MarketingReport>) => {
  const rows: PerformanceRow[] = useMemo(() => {
    return (report || []).map((a) => {
      const base = `/requirements?fromDate=${fromDate}&toDate=${toDate}&assignedToRef=${a.id}`;
      return {
        id: a.id,
        name: a.name || 'Unknown',
        total: a.totalAssigned || 0,
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
            key: 'Project Active',
            label: 'Active',
            color: tokens.colors.blue,
            value: a['Project Active'] || 0,
            href: `${base}&reqStatus=Project Active`,
          },
          {
            key: 'Project Inactive',
            label: 'Inactive',
            color: tokens.colors.warning,
            value: a['Project Inactive'] || 0,
            href: `${base}&reqStatus=Project Inactive`,
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

  return (
    <PerformanceLeaderboard
      title="Marketing leaderboard"
      subtitle="Positions assigned to each marketer"
      totalLabel="Positions assigned"
      rows={rows}
      loading={loading}
      icon={<IconTargetArrow size={18} />}
      accentColor={tokens.colors.pink}
      accentGradient={tokens.gradients.pinkBlue}
    />
  );
};
