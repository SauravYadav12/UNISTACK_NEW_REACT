import {
  Box,
  CircularProgress,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomAccordion from '../accordion/CustomAccordion';
import { SupportReport } from '../../Interfaces/reports';
import { getSupportReport } from '../../services/reportsApi';
import SyncIcon from '@mui/icons-material/Sync';
export interface MyReportsProps {
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
  const [error, setError] = useState('');
  const getReport = async () => {
    try {
      setError('');
      const { data } = await getSupportReport(fromDate, toDate);
      const totalPosition = data.data?.reduce((sum, report) => {
        return sum + (report.totalPositions || 0);
      }, 0);
      setReport(data.data);
      setMetaText(`Total Position: ${totalPosition || 0}`);
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
        const title = a.name
          ? a.name.slice(0, 1).toUpperCase() + a.name.slice(1)
          : 'NA';
        const href = `/requirements?fromDate=${fromDate}&toDate=${toDate}&reqEnteredByRef=${a.id}&`;
        return (
          <Box mb={1} key={i}>
            <CustomAccordion title={title}>
              <TableContainer>
                <Table sx={{ maxWidth: 'max-content' }}>
                  <TableBody>
                    <MyDataRow
                      href={href}
                      label="Total Position Entered"
                      value={a.totalPositions}
                    />
                    <MyDataRow
                      href={href + `reqStatus=Submitted`}
                      label="Total Position Submitted"
                      value={a.Submitted}
                    />
                    <MyDataRow
                      href={href + `reqStatus=Cancelled`}
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

export const MyDataRow = ({
  label,
  value,
  href,
}: {
  label: string;
  value: any;
  href?: string;
}) => {
  return (
    <TableRow>
      <TableCell sx={{ border: 'none', py: 1 }}>
        <Typography>{label}:</Typography>
      </TableCell>
      <TableCell sx={{ border: 'none', py: 1 }}>
        <Typography>
          {value ? (
            <Link target="_blank" href={href || '#'}>
              {value}
            </Link>
          ) : (
            0
          )}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
