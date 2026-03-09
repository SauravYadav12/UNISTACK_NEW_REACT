import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material';
import CustomAccordion from '../accordion/CustomAccordion';
import { InterviewReport } from '../../Interfaces/reports';
import { MyDataRow, MyReportsProps } from './SupportReports';

export const InterviewReports = ({
  fromDate,
  toDate,
  loading,
  report,
}: MyReportsProps<InterviewReport>) => {
  
  if (loading)
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
            <CustomAccordion title={a.name||'Unknown'}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      href={href}
                      label="Total Interviews"
                      value={a.totalInterviews}
                    />
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
      {!report?.length && !loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <p>Not found</p>
        </Box>
      )}
    </div>
  );
};
