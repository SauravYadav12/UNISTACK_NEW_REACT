import {
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomAccordion from '../accordion/CustomAccordion';
import { MarketingReport } from '../../Interfaces/reports';
import { getMarketingReport } from '../../services/reportsApi';
import { MyDataRow, MyReportsProps } from './SupportReports';
import SyncIcon from '@mui/icons-material/Sync';

export const MarketingReports = ({
  fromDate,
  toDate,
  setMetaText,
}: MyReportsProps) => {
  const [report, setReport] = useState<MarketingReport[]>();
  const [error, setError] = useState('');

  const getReport = async () => {
    try {
      setError('');
      const { data } = await getMarketingReport(fromDate, toDate);
      setReport(data.data);
      const totalAssigned = data.data?.reduce((sum, report) => {
        return sum + (report.totalAssigned || 0);
      }, 0);
      setMetaText(`Total Assigned: ${totalAssigned || 0} `);
    } catch (error) {
      setError('Failed to load');
      setMetaText('Failed');
    }
  };

  useEffect(() => {
    setReport(undefined);
    getReport();
  }, [fromDate, toDate]);

  if (!report && !error)
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
            <CustomAccordion title={a.name}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      href={href}
                      label="Total Position Assigned"
                      value={a.totalAssigned}
                    />
                    <MyDataRow
                      href={href + `&reqStatus=Submitted`}
                      label="Total Position Submitted"
                      value={a.Submitted}
                    />
                    <MyDataRow
                      href={href + `&reqStatus=Project Active`}
                      label="Total Project Active"
                      value={a['Project Active']}
                    />
                    <MyDataRow
                      href={href + `&reqStatus=Project Inactive`}
                      label="Total Project In-Active"
                      value={a['Project Inactive']}
                    />
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
      {!report?.length && !error && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <p>Not found</p>
        </Box>
      )}
      {error && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={getReport}>
            <SyncIcon color="primary" />
          </IconButton>
        </Box>
      )}
    </div>
  );
};
