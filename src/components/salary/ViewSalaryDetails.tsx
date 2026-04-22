import { useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Divider,
  IconButton
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import SalaryForm from './SalaryForm';

// Mock salary data - replace with actual API data
const mockSalaryData = {
  basicSalary: 50000,
  hra: 20000,
  medicalAllowance: 5000,
  travelAllowance: 3000,
  foodAllowance: 2000,
  mobileAllowance: 1000,
  otherAllowances: 5000,
  bonusLabel: 'Annual Performance Bonus',
  bonusAmount: 10000,
  performanceIncentive: 8000,
  overtimePay: 3000,
  incomeTax: 12000,
  pfContribution: 6000,
  esiContribution: 750,
  professionalTax: 200,
  lopDeduction: 0,
  otherDeductions: 500,
  employerPfContribution: 6000,
  employerEsiContribution: 800,
  gratuity: 4167,
};

interface ViewSalaryDetailsProps {
  salaryData?: typeof mockSalaryData;
  onUpdate?: (data: any) => void;
}

const ViewSalaryDetails: React.FC<ViewSalaryDetailsProps> = ({ 
  salaryData = mockSalaryData, 
  onUpdate 
}) => {
  const { myProfile, iUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Utility function to format currency
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  // Field configurations for display
  const earningsFields = [
    { key: 'basicSalary', label: 'Basic Salary' },
    { key: 'hra', label: 'HRA (House Rent Allowance)' },
    { key: 'medicalAllowance', label: 'Medical Allowance' },
    { key: 'travelAllowance', label: 'Travel Allowance' },
    { key: 'foodAllowance', label: 'Food Allowance' },
    { key: 'mobileAllowance', label: 'Mobile/Phone Allowance' },
    { key: 'otherAllowances', label: 'Other Allowances' },
  ];

  const bonusFields = [
    { key: 'bonusLabel', label: 'Bonus Description', isText: true },
    { key: 'bonusAmount', label: 'Bonus Amount' },
    { key: 'performanceIncentive', label: 'Performance Incentive' },
    { key: 'overtimePay', label: 'Overtime Pay' },
  ];

  const deductionFields = [
    { key: 'incomeTax', label: 'Income Tax' },
    { key: 'pfContribution', label: "Employee's PF Contribution" },
    { key: 'esiContribution', label: 'ESI Contribution' },
    { key: 'professionalTax', label: 'Professional Tax' },
    { key: 'lopDeduction', label: 'LOP Deduction' },
    { key: 'otherDeductions', label: 'Other Deductions' },
  ];

  const employerFields = [
    { key: 'employerPfContribution', label: 'Employer PF Contribution' },
    { key: 'employerEsiContribution', label: 'Employer ESI Contribution' },
    { key: 'gratuity', label: 'Gratuity' },
  ];

  // Calculate totals
  const grossSalary = earningsFields.reduce((sum, field) => sum + (salaryData[field.key as keyof typeof salaryData] as number || 0), 0) +
                     bonusFields.filter(f => !f.isText).reduce((sum, field) => sum + (salaryData[field.key as keyof typeof salaryData] as number || 0), 0);
  
  const totalDeductions = deductionFields.reduce((sum, field) => sum + (salaryData[field.key as keyof typeof salaryData] as number || 0), 0);
  
  const netSalary = grossSalary - totalDeductions;
  
  const ctc = grossSalary + employerFields.reduce((sum, field) => sum + (salaryData[field.key as keyof typeof salaryData] as number || 0), 0);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (data: any) => {
    onUpdate?.(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderFieldValue = (field: any) => {
    const value = salaryData[field.key as keyof typeof salaryData];
    if (field.isText) {
      return value || 'N/A';
    }
    return formatCurrency(value as number || 0);
  };

  const renderFieldSection = (title: string, fields: any[], icon: string, color: string) => (
    <>
      <Grid size={12} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color, display: 'flex', alignItems: 'center' }}>
          {icon} {title}
        </Typography>
      </Grid>
      {fields.map((field, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.key}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {field.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {renderFieldValue(field)}
            </Typography>
          </Box>
        </Grid>
      ))}
    </>
  );

  // If editing, show the form
  if (isEditing) {
    return (
      <SalaryForm
        initialData={salaryData}
        onSubmit={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // Show view mode
  return (
    <>
      <Grid container spacing={3}>
        {/* Header with Edit Button */}
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Salary Details
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ borderRadius: 2 }}
            >
              Edit Salary
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        {/* Employee Information */}
        <Grid size={12}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Employee Information
          </Typography>
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', gap: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body1">
              <strong>Employee ID:</strong> {myProfile?.employeeId || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Employee Name:</strong>{' '}
              {iUser ? `${iUser.firstName} ${iUser.lastName}` : 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Role:</strong> {iUser?.role || 'N/A'}
            </Typography>
          </Box>
        </Grid>

        {/* Earnings */}
        {renderFieldSection('Earnings', earningsFields, '💰', 'success.main')}

        {/* Bonus & Incentives */}
        {renderFieldSection('Bonus & Incentives', bonusFields, '🎁', 'info.main')}

        {/* Deductions */}
        {renderFieldSection('Deductions', deductionFields, '📉', 'error.main')}

        {/* Employer Contributions */}
        {renderFieldSection('Employer Contributions', employerFields, '🏢', 'secondary.main')}

        {/* Salary Summary */}
        <Grid size={12} sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                💼 Salary Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="info.contrastText">
                      💼 CTC (Cost to Company)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.contrastText' }}>
                      {formatCurrency(ctc)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="success.contrastText">
                      💰 Gross Salary
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>
                      {formatCurrency(grossSalary)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="error.contrastText">
                      📉 Total Deductions
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.contrastText' }}>
                      {formatCurrency(totalDeductions)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="primary.contrastText">
                      💵 Net Salary
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                      {formatCurrency(netSalary)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ViewSalaryDetails;
