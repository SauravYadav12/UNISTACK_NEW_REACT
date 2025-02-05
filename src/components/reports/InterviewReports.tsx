import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomAccordion from '../accordion/CustomAccordion';
import { InterviewReport } from '../../Interfaces/reports';
import { getInterviewReport } from '../../services/reportsApi';
import { toast } from 'react-toastify';
import { MyDataRow, MyReportsProps } from './SupportReports';

export const InterviewReports = ({
  fromDate,
  toDate,
  setMetaText,
  setError,
}: MyReportsProps) => {
  const [report, setReport] = useState<InterviewReport[]>();
  const getReport = async () => {
    try {
      const { data } = await getInterviewReport(fromDate, toDate);
      setReport(data.data?.report);
      setMetaText(`Total Interviews: ${data.data?.totalInterviews || 0}`);
    } catch (error) {
      setError(true);
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
        const href = `/interviews?fromDate=${fromDate}&toDate=${toDate}&marketingPersonRef=${a.id}&`;
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.name}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      href={href + `interviewStatus=Interview Confirm`}
                      label="Total Interview Confirm"
                      value={a['Interview Confirm']}
                    />
                    <MyDataRow
                      href={href + `interviewStatus=Interview Tentative`}
                      label="Total Interview Tentative"
                      value={a['Interview Tentative']}
                    />
                    <MyDataRow
                      href={href + `interviewStatus=Interview Re-Scheduled`}
                      label="Total Interview Re-Scheduled"
                      value={a['Interview Re-Scheduled']}
                    />
                    <MyDataRow
                      href={href + `interviewStatus=Interview Completed`}
                      label="Total Interview Completed"
                      value={a['Interview Completed']}
                    />
                    <MyDataRow
                      href={href + `interviewStatus=Interview Cancelled`}
                      label="Total Interview Cancelled"
                      value={a['Interview Cancelled']}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomAccordion>
          </Box>
        );
      })}
      {!report.length && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <p>Not found</p>
        </Box>
      )}
    </div>
  );
};
