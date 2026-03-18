import { useState, useMemo } from 'react';
import { Button, Box, Typography, IconButton } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Sync } from '@mui/icons-material';
import ViewSalaryDetails from '../../components/salary/ViewSalaryDetails';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import { useFetchData } from '../../hooks/fetchDataHook';
import salaryStructureApi, {
  SalaryStructRes,
} from '../../services/salaryStructureApi';

const Salary = () => {
  const [selectedSalary, setSelectedSalary] = useState<SalaryStructRes | null>(
    null
  );

  const { data, error, loading, loadData } = useFetchData(async () => {
    return await salaryStructureApi.list();
  }, []);

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
        field: 'phoneNumber',
        headerName: 'Phone Number',
        width: 250,
      },
      {
        field: 'basicSalary',
        headerName: 'Basic Salary',
        width: 250,
        valueGetter: (value, row) => {
          const basicSalary = row.salaryStructure?.basicSalary;
          return basicSalary ? `₹${basicSalary.toLocaleString()}` : 'N/A';
        },
      },
    ],
    []
  );

  function MySalaryTable() {
    if (error) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }

    return (
      <DataGrid
        loading={loading}
        rows={data?.results || []}
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
    );
  }

  return (
    <Box display={'flex'} flexDirection={'column'} height={'100%'}>
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight="bold">
          Salary Structures
        </Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </Box>

      <MySalaryTable />

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
              loadData();
            }}
          />
        )}
      </CustomDrawer>
    </Box>
  );
};

export default Salary;
