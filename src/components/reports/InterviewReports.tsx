import { useMemo } from 'react';
import { InterviewReport } from '../../Interfaces/reports';
import PerformanceLeaderboard, { PerformanceRow } from './PerformanceLeaderboard';
import { MyReportsProps } from './SupportReports';
import { IconCalendarEvent } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

export const InterviewReports = ({
  fromDate,
  toDate,
  loading,
  report,
}: MyReportsProps<InterviewReport>) => {
  const rows: PerformanceRow[] = useMemo(() => {
    return (report || []).map((a) => {
      const base = `/interviews?fromDate=${fromDate}&toDate=${toDate}&marketingPersonRef=${a.id}`;
      return {
        id: a.id,
        name: a.name || 'Unknown',
        total: a.totalInterviews || 0,
        totalHref: base,
        breakdown: [
          {
            key: 'Interview Confirm',
            label: 'Confirmed',
            color: tokens.colors.success,
            value: a['Interview Confirm'] || 0,
            href: `${base}&interviewStatus=Interview Confirm`,
          },
          {
            key: 'Interview Tentative',
            label: 'Tentative',
            color: tokens.colors.warning,
            value: a['Interview Tentative'] || 0,
            href: `${base}&interviewStatus=Interview Tentative`,
          },
          {
            key: 'Interview Completed',
            label: 'Completed',
            color: tokens.colors.blue,
            value: a['Interview Completed'] || 0,
            href: `${base}&interviewStatus=Interview Completed`,
          },
          {
            key: 'Interview Re-Scheduled',
            label: 'Re-Scheduled',
            color: '#7C3AED',
            value: a['Interview Re-Scheduled'] || 0,
            href: `${base}&interviewStatus=Interview Re-Scheduled`,
          },
          {
            key: 'Interview Cancelled',
            label: 'Cancelled',
            color: tokens.colors.error,
            value: a['Interview Cancelled'] || 0,
            href: `${base}&interviewStatus=Interview Cancelled`,
          },
        ],
      };
    });
  }, [report, fromDate, toDate]);

  return (
    <PerformanceLeaderboard
      title="Interview leaderboard"
      subtitle="Interviews scheduled by each marketer"
      totalLabel="Interviews scheduled"
      rows={rows}
      loading={loading}
      icon={<IconCalendarEvent size={18} />}
      accentColor="#7C3AED"
      accentGradient="linear-gradient(135deg, #7C3AED 0%, #EC4599 100%)"
    />
  );
};
