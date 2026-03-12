import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import ViewSalaryDetails from '../../components/salary/ViewSalaryDetails';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { useFetchData } from '../../hooks/fetchDataHook';
import salaryStructureApi, { SalaryStructRes } from '../../services/salaryStructureApi';


const Salary = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryStructRes | null>(null);

  const { data, error, loading, loadData } = useFetchData(async () => {
    return await salaryStructureApi.list();
  }, []);

  const handleViewDetails = (row: SalaryStructRes) => {
    setSelectedSalary(row);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedSalary(null);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Salary Structures
        </Typography>
      </Box>

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
          <Table sx={{ minWidth: 650 }} aria-label="salary structures table">
            <TableHead>
              <TableRow>
                <TableCell>View</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Basic Salary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.results?.map((row) => (
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
                      onClick={() => handleViewDetails(row)}
                    >
                      View
                    </Button>
                  </TableCell>
                  <TableCell>{row.employeeId}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email.official}</TableCell>
                  <TableCell>{row.phoneNumber}</TableCell>
                  <TableCell>
                    {row.salaryStructure?.basicSalary 
                      ? `₹${row.salaryStructure.basicSalary.toLocaleString()}` 
                      : 'N/A'
                    }
                  </TableCell>
                </TableRow>
              ))}
              {data?.results?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary">
                      No salary structures found
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
        title={selectedSalary ? `Salary Details - ${selectedSalary.name}` : 'Salary Details'}
        subTitle={selectedSalary ? `Employee ID: ${selectedSalary.employeeId}` : ''}
        closeOnOutSideClick={true}
      >
        {selectedSalary && (
          <ViewSalaryDetails
            salaryData={selectedSalary.salaryStructure}
            onUpdate={(data) => {
              // Handle salary update if needed
              console.log('Salary updated:', data);
              loadData(); // Refresh data after update
            }}
          />
        )}
      </CustomDrawer>
    </Box>
  );
};

export default Salary;
