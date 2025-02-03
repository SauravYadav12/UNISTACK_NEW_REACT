import { Box, CircularProgress, Link, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ReportsAccordionContent from '../../pages/Marketing/Reports/ReportsAccordionContent';
import CustomAccordion from '../accordion/CustomAccordion';
import {
  InterviewReport,
  MarketingReport,
  SupportReport,
} from '../../Interfaces/reports';
import {
  getInterviewReport,
  getMarketingReport,
  getSupportReport,
} from '../../services/reportsApi';
import { toast } from 'react-toastify';

interface MyReportsProps {
  fromDate?: string;
  toDate?: string;
  setMetaText: React.Dispatch<React.SetStateAction<string>>;
}

export const SupportReports = ({
  fromDate,
  toDate,
  setMetaText,
}: MyReportsProps) => {
  const [report, setReport] = useState<SupportReport[]>();

  const getReport = async () => {
    try {
      const { data } = await getSupportReport(fromDate, toDate);
      const totalPosition = data.data?.reduce((sum, report) => {
        return sum + (report.totalPositions || 0);
      }, 0);
      setReport(data.data);
      setMetaText(`Total Position: ${totalPosition || 0}`);
    } catch (error) {
      toast.error('Failed to load');
    }
  };

  useEffect(() => {
    setReport(undefined);
    getReport();
  }, [fromDate, toDate]);

  if (!report)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <div>
      {report?.map((a, i) => {
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.name}>
              <Box p={2}>
                <Typography>
                  Total Position Entered: {a.totalPositions || 0}
                </Typography>
                <Typography>
                  Total Position Submitted: {a.Submitted || 0}
                </Typography>
                <Typography>
                  Total Position Cancelled: {a.Cancelled || 0}
                </Typography>
              </Box>
            </CustomAccordion>
          </Box>
        );
      })}
    </div>
  );
};

export const MarketingReports = ({
  fromDate,
  toDate,
  setMetaText,
}: MyReportsProps) => {
  const [report, setReport] = useState<{
    assigned: MarketingReport[];
    unassigned: any[];
  }>();
  const getReport = async () => {
    try {
      const { data } = await getMarketingReport(fromDate, toDate);
      setReport(data.data);
      const totalAssigned = data.data?.assigned?.reduce((sum, report) => {
        return sum + (report.totalAssigned || 0);
      }, 0);
      setMetaText(
        `Assigned: ${totalAssigned || 0} | Unassigned: ${
          data.data?.unassigned.length || 0
        }`
      );
    } catch (error) {
      toast.error('Failed to load');
    }
  };

  useEffect(() => {
    setReport(undefined);
    getReport();
  }, [fromDate, toDate]);

  if (!report)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <div>
      {report?.assigned?.map((a, i) => {
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.marketingPerson}>
              <Box p={2}>
                <Typography>
                  Total Position Assigned: {a.totalAssigned || 0}
                </Typography>
                <Typography>
                  Total Position Submitted: {a.Submitted || 0}
                </Typography>
                <Typography>
                  Total Position Active: {a['Project Active'] || 0}
                </Typography>
                <Typography>
                  Total Position In-Active: {a['Project Inactive'] || 0}
                </Typography>
                <Typography>
                  Total Position Cancelled: {a.Cancelled || 0}
                </Typography>
              </Box>
            </CustomAccordion>
          </Box>
        );
      })}
    </div>
  );
};

export const InterviewReports = ({
  fromDate,
  toDate,
  setMetaText,
}: MyReportsProps) => {
  const [report, setReport] = useState<InterviewReport[]>();
  const getReport = async () => {
    try {
      const { data } = await getInterviewReport(fromDate, toDate);
      setReport(data.data);
      setMetaText(`Total Interviews: ${data.data?.length || 0}`);
    } catch (error) {
      toast.error('Failed to load');
    }
  };

  useEffect(() => {
    setReport(undefined);
    getReport();
  }, [fromDate, toDate]);

  if (!report)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <div>
      {report?.map((a, i) => {
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.name}>
              <Box p={2}>
                <Typography>
                  Total Interview Confirm: {a['Interview Confirm'] || 0}
                </Typography>
                <Typography>
                  Total Interview Tentative: {a['Interview Tentative'] || 0}
                </Typography>
                <Typography>
                  Total Interview Re-Scheduled:{' '}
                  {a['Interview Re-Scheduled'] || 0}
                </Typography>
                <Typography>
                  Total Interview Completed: {a['Interview Completed'] || 0}
                </Typography>
                <Typography>
                  Total Interview Cancelled: {a['Interview Cancelled'] || 0}
                </Typography>
              </Box>
            </CustomAccordion>
          </Box>
        );
      })}
    </div>
  );
};
