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
  setError
}: MyReportsProps) => {
  const [report, setReport] = useState<InterviewReport[]>();
  const getReport = async () => {
    try {
      const { data } = await getInterviewReport(fromDate, toDate);
      setReport(data.data);
      setMetaText(`Total Interviews: ${data.data?.length || 0}`);
    } catch (error) {
      setError(true)
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
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      label="Total Interview Confirm"
                      value={a['Interview Confirm']}
                    />
                    <MyDataRow
                      label="Total Interview Tentative"
                      value={a['Interview Tentative']}
                    />
                    <MyDataRow
                      label="Total Interview Re-Scheduled"
                      value={a['Interview Re-Scheduled']}
                    />
                    <MyDataRow
                      label="Total Interview Completed"
                      value={a['Interview Completed']}
                    />
                    <MyDataRow
                      label="Total Interview Cancelled"
                      value={a['Interview Completed']}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomAccordion>
          </Box>
        );
      })}
       {!report.length && (
        <Box sx={{ textAlign: 'center',py: 10 }}>
          <p>Not found</p>
        </Box>
      )}
    </div>
  );
};
