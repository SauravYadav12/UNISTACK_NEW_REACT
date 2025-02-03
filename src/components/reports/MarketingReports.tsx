import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomAccordion from '../accordion/CustomAccordion';
import { MarketingReport } from '../../Interfaces/reports';
import { getMarketingReport } from '../../services/reportsApi';
import { toast } from 'react-toastify';
import { MyDataRow, MyReportsProps } from './SupportReports';

export const MarketingReports = ({
  fromDate,
  toDate,
  setMetaText,
  setError
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
      {report?.assigned?.map((a, i) => {
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={a.marketingPerson}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      label="Total Position Assigned"
                      value={a.totalAssigned}
                    />
                    <MyDataRow
                      label="Total Position Submitted"
                      value={a.Submitted}
                    />
                    <MyDataRow
                      label="Total Project Active"
                      value={a['Project Active']}
                    />
                    <MyDataRow
                      label="Total Project In-Active"
                      value={a['Project Inactive']}
                    />
                    <MyDataRow
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
       {!report.assigned.length && (
        <Box sx={{ textAlign: 'center',py: 10 }}>
          <p>Not found</p>
        </Box>
      )}
    </div>
  );
};
