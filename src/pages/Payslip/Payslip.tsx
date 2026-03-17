import { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import PayslipPDFViewer from '../../components/payslip/PayslipPDFViewer';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { useFetchData } from '../../hooks/fetchDataHook';
import { payslipApi } from '../../services/payslipApi';
import { Payslip as PayslipType } from '../../Interfaces/payslip';

const Payslip = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipType | null>(
    null
  );

  const { data, error, loading, loadData } = useFetchData(async () => {
    return await payslipApi.listPayslips();
  }, []);

  const handleViewPayslip = (row: PayslipType) => {
    setSelectedPayslip(row);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPayslip(null);
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[month - 1] || 'Unknown';
  };

  const calculateNetSalary = (salaryStructure: any) => {
    if (!salaryStructure) return 0;

    const grossSalary =
      (salaryStructure.basicSalary || 0) +
      (salaryStructure.hra || 0) +
      (salaryStructure.medicalAllowance || 0) +
      (salaryStructure.travelAllowance || 0) +
      (salaryStructure.foodAllowance || 0) +
      (salaryStructure.mobileAllowance || 0) +
      (salaryStructure.otherAllowances || 0);

    const totalDeductions =
      (salaryStructure.incomeTax || 0) +
      (salaryStructure.pfContribution || 0) +
      (salaryStructure.esiContribution || 0) +
      (salaryStructure.professionalTax || 0) +
      (salaryStructure.lopDeduction || 0) +
      (salaryStructure.otherDeductions || 0);

    return grossSalary - totalDeductions;
  };

  return (
    <Box sx={{ width: '100%', my: 4 }}>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={loadData} size="small" sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="payslips table">
            <TableHead>
              <TableRow>
                <TableCell>View PDF</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Month/Year</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Working Days</TableCell>
                <TableCell>Net Salary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.results?.map((row: PayslipType) => (
                <TableRow
                  key={row._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      sx={{ borderRadius: '10px' }}
                      onClick={() => handleViewPayslip(row)}
                    >
                      View PDF
                    </Button>
                  </TableCell>
                  <TableCell>{row.employeeId}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${getMonthName(row.month)} ${row.year}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.workingDays}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      ₹
                      {calculateNetSalary(row.salaryStructure).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {data?.results?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">
                      No payslips found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={
          selectedPayslip ? `Payslip - ${selectedPayslip.name}` : 'Payslip'
        }
        subTitle={
          selectedPayslip
            ? `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year} | Employee ID: ${selectedPayslip.employeeId}`
            : ''
        }
        closeOnOutSideClick={true}
      >
        {selectedPayslip && <PayslipPDFViewer payslipData={selectedPayslip} />}
      </CustomDrawer>
    </Box>
  );
};

export default Payslip;
