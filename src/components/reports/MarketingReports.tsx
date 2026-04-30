import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material';
import CustomAccordion from '../accordion/CustomAccordion';
import { MarketingReport } from '../../Interfaces/reports';
import { MyDataRow, MyReportsProps } from './SupportReports';

export const MarketingReports = ({
  fromDate,
  toDate,
  report,
  loading,
}: MyReportsProps<MarketingReport>) => {
  if (loading)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <div>
      {report?.map((a, i) => {
        const href = `/requirements?fromDate=${fromDate}&toDate=${toDate}&assignedToRef=${a.id}&`;
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.name||'Unknown'}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      href={href}
                      label="Total Position Assigned"
                      value={a.totalAssigned}
                    />
                    <MyDataRow
                      href={href}
                      label="Total Submission In Progress"
                      value={a['Submission In Progress']}
                    />
                    <MyDataRow
                      href={href + `&reqStatus=Submitted`}
                      label="Total Position Submitted"
                      value={a.Submitted}
                    />
                    {/* <MyDataRow
                      href={href + `&reqStatus=Project Active`}
                      label="Total Project Active"
                      value={a['Project Active']}
                    />
                    <MyDataRow
                      href={href + `&reqStatus=Project Inactive`}
                      label="Total Project In-Active"
                      value={a['Project Inactive']}
                    /> */}
                    <MyDataRow
                      href={href + `&reqStatus=Cancelled`}
                      label="Total Position Cancelled"
                      value={a.Cancelled}
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
