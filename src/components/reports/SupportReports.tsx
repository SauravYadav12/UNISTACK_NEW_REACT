import {
  Box,
  CircularProgress,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import CustomAccordion from '../accordion/CustomAccordion';
import { SupportReport } from '../../Interfaces/reports';
export interface MyReportsProps<T> {
  report?: T[];
  loading?: boolean;
  fromDate?: string;
  toDate?: string;
}

export const SupportReports = ({
  report,
  loading,
  fromDate,
  toDate,
}: MyReportsProps<SupportReport>) => {
  if (loading)
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
      {!report?.length && !loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <p>Not found</p>
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
