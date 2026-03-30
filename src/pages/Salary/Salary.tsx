import { useState, useMemo } from 'react';
import { EditNote } from '@mui/icons-material';
import { Button, Box, Typography, IconButton } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Sync } from '@mui/icons-material';
import ViewSalaryDetails from '../../components/salary/ViewSalaryDetails';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { useFetchData } from '../../hooks/fetchDataHook';
import salaryStructureApi, {
  SalaryStructRes,
} from '../../services/salaryStructureApi';
import { salaryDefaultValues } from '../../components/salary/salaryFields';
import { SalaryStructure } from '../../components/salary/SalaryForm';
import GeneratePayslip from '../../components/payslip/ViewPayslip';
import { payslipApi } from '../../services/payslipApi';
import { currentSalaryPeriod } from '../../utils/payslip.util';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Payslip } from '../../Interfaces/payslip';
const Salary = () => {
  const period = currentSalaryPeriod();
  const [selectedSalary, setSelectedSalary] = useState<SalaryStructRes | null>(
    null
  );

  const [paySlip, setPaySlip] = useState<SalaryStructure | Payslip>();

  const recentPaySlips = useFetchData(async () => {
    const { month, year } = currentSalaryPeriod();
    return await payslipApi.listPayslips(`month=${month}&year=${year}`);
  }, []);

  const salaryStructureState = useFetchData(async () => {
    return await salaryStructureApi.list();
  }, []);
  const error = recentPaySlips.error || salaryStructureState.error;
  const loading = recentPaySlips.loading || salaryStructureState.loading;
  const loadData = () => {
    recentPaySlips.loadData();
    salaryStructureState.loadData();
  };
  const handleViewDetails = (row: SalaryStructRes) => {
    setSelectedSalary(row);
  };

  const handleCloseDrawer = () => {
    setSelectedSalary(null);
  };

  const columns = useMemo<GridColDef<SalaryStructRes>[]>(
    () => [
      {
        field: 'view',
        headerName: 'View',
        width: 150,
        renderCell: (params) => (
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ borderRadius: '10px' }}
            onClick={() => handleViewDetails(params.row)}
          >
            View
          </Button>
        ),
        filterable: false,
        sortable: false,
      },
      {
        field: 'employeeId',
        headerName: 'Employee ID',
        width: 220,
      },
      {
        field: 'name',
        headerName: 'Employee Name',
        width: 200,
      },
      {
        field: 'email',
        headerName: 'Email',
        width: 250,
        valueGetter: (value, row) => row.email?.official || 'N/A',
      },
      {
        field: 'payslip',
        headerName: `Payslip (${period.monthName}/${period.year})`,
        width: 250,
        renderCell: (params) => {
          const paySlip = params.row.user
            ? recentPaySlips.data?.results?.find(
                (p) => p.user === params.row.user
              )
            : null;
          return (
            <Button
              size="small"
              variant={paySlip ? 'contained' : 'outlined'}
              color={paySlip ? 'success' : 'warning'}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
              onClick={() =>
                setPaySlip(params.row.salaryStructure || salaryDefaultValues)
              }
              startIcon={
                !paySlip ? <EditNote /> : <CheckCircleIcon color="success" />
              }
            >
              {paySlip ? 'View Payslip' : 'Generate Payslip'}
            </Button>
          );
        },
        filterable: false,
        sortable: false,
      },
    ],
    []
  );

  return (
    <>
      <Box display={'flex'} flexDirection={'column'} height={'100%'}>
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            Salary Structures
          </Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>

        {error ? (
          <>
            <Box textAlign={'center'}>
              <Typography color="error">{error}</Typography>
              <IconButton onClick={loadData}>
                <Sync color="primary" />
              </IconButton>
            </Box>
          </>
        ) : (
          <>
            <DataGrid
              loading={loading}
              rows={salaryStructureState.data?.results || []}
              columns={columns}
              getRowId={(row) => row._id}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              sx={{
                flex: 1,
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                  color: '#504e4e',
                },
                '& .MuiDataGrid-scrollbar': {
                  scrollbarWidth: 'thin',
                },
              }}
            />
          </>
        )}

        <CustomDrawer
          open={Boolean(selectedSalary)}
          onClose={handleCloseDrawer}
          title={
            selectedSalary
              ? `Salary Details - ${selectedSalary.name}`
              : 'Salary Details'
          }
          subTitle={
            selectedSalary ? `Employee ID: ${selectedSalary.employeeId}` : ''
          }
          closeOnOutSideClick={true}
        >
          {selectedSalary && (
            <ViewSalaryDetails
              salaryData={selectedSalary.salaryStructure}
              salaryId={selectedSalary._id}
              onUpdate={(data) => {
                console.log('Salary updated:', data);
                setSelectedSalary((prev) =>
                  prev
                    ? {
                        ...prev,
                        salaryStructure: data,
                      }
                    : null
                );
                loadData();
              }}
            />
          )}
        </CustomDrawer>
      </Box>
      {paySlip && (
        <GeneratePayslip
          {...('_id' in paySlip
            ? { mode: 'view', paySlip }
            : { mode: 'generate', salaryStructure: paySlip })}
          open={Boolean(paySlip)}
          onClose={() => setPaySlip(undefined)}
        />
      )}
    </>
  );
};

export default Salary;
