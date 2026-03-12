import { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Close, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import SalaryForm, { SalaryStructure } from './SalaryForm';

type FieldLabel = { key: keyof Omit<SalaryStructure, 'bonus'>; label: string };

const mockSalaryData: SalaryStructure = {
  basicSalary: 0,
  hra: 0,
  medicalAllowance: 0,
  travelAllowance: 0,
  foodAllowance: 0,
  mobileAllowance: 0,
  otherAllowances: 0,
  bonus: [],
  // performanceIncentive: 0,
  // overtimePay: 0,
  incomeTax: 0,
  pfContribution: 0,
  esiContribution: 0,
  professionalTax: 0,
  lopDeduction: 0,
  otherDeductions: 0,
  employerPfContribution: 0,
  employerEsiContribution: 0,
  gratuity: 0,
};

interface ViewSalaryDetailsProps {
  salaryData?: SalaryStructure;
  onUpdate?: (data: SalaryStructure) => void;
}

const ViewSalaryDetails: React.FC<ViewSalaryDetailsProps> = ({
  salaryData = mockSalaryData,
  onUpdate,
}) => {
  const { myProfile, iUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const earningsFields: FieldLabel[] = [
    { key: 'basicSalary', label: 'Basic Salary' },
    { key: 'hra', label: 'HRA (House Rent Allowance)' },
    { key: 'medicalAllowance', label: 'Medical Allowance' },
    { key: 'travelAllowance', label: 'Travel Allowance' },
    { key: 'foodAllowance', label: 'Food Allowance' },
    { key: 'mobileAllowance', label: 'Mobile/Phone Allowance' },
    { key: 'otherAllowances', label: 'Other Allowances' },
  ];

  // const bonusFields: FieldLabel[] = [
  //   { key: 'performanceIncentive', label: 'Performance Incentive' },
  //   { key: 'overtimePay', label: 'Overtime Pay' },
  // ];

  const deductionFields: FieldLabel[] = [
    { key: 'incomeTax', label: 'Income Tax' },
    { key: 'pfContribution', label: "Employee's PF Contribution" },
    { key: 'esiContribution', label: 'ESI Contribution' },
    { key: 'professionalTax', label: 'Professional Tax' },
    { key: 'lopDeduction', label: 'LOP Deduction' },
    { key: 'otherDeductions', label: 'Other Deductions' },
  ];

  const employerFields: FieldLabel[] = [
    { key: 'employerPfContribution', label: 'Employer PF Contribution' },
    { key: 'employerEsiContribution', label: 'Employer ESI Contribution' },
    { key: 'gratuity', label: 'Gratuity' },
  ];

  const grossSalary = earningsFields.reduce(
    (sum, field) => sum + (salaryData[field.key] || 0),
    0
  );
  // bonusFields.reduce((sum, field) => sum + (salaryData[field.key] || 0), 0);

  const totalDeductions = deductionFields.reduce(
    (sum, field) => sum + (salaryData[field.key] || 0),
    0
  );

  const netSalary = grossSalary - totalDeductions;

  const ctc =
    grossSalary +
    employerFields.reduce(
      (sum, field) => sum + (salaryData[field.key] || 0),
      0
    );

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (data: SalaryStructure) => {
    onUpdate?.(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderFieldSection = (
    title: string,
    fields: FieldLabel[],
    icon: string,
    color: string
  ) => (
    <>
      <Grid item xs={12}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color, display: 'flex', alignItems: 'center' }}
        >
          {icon} {title}
        </Typography>
        <Divider />
      </Grid>
      {fields.map((field, index) => (
        <Grid item xs={12} sm={6} md={4} key={field.key}>
          <Box
            sx={{
              px: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {field.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {formatCurrency(salaryData[field.key])}
            </Typography>
          </Box>
        </Grid>
      ))}
    </>
  );

  if (isEditing) {
    return (
      <SalaryForm
        initialData={salaryData}
        onSubmit={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: 2,
              gap: 2,
            }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ borderRadius: 2 }}
            >
              Edit
            </Button>
          </Box>
        </Grid>

        {renderFieldSection('Earnings', earningsFields, '💰', 'success.main')}

        {/* {renderFieldSection(
          'Bonus & Incentives',
          bonusFields,
          '🎁',
          'info.main'
        )} */}

        {renderFieldSection('Deductions', deductionFields, '📉', 'error.main')}

        {renderFieldSection(
          'Employer Contributions',
          employerFields,
          '🏢',
          'secondary.main'
        )}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            💼 Salary Summary
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'info.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="info.contrastText">
                  💼 CTC (Cost to Company)
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: 'info.contrastText' }}
                >
                  {formatCurrency(ctc)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'success.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="success.contrastText">
                  💰 Gross Salary
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: 'success.contrastText' }}
                >
                  {formatCurrency(grossSalary)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'error.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="error.contrastText">
                  📉 Total Deductions
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: 'error.contrastText' }}
                >
                  {formatCurrency(totalDeductions)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="primary.contrastText">
                  💵 Net Salary
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}
                >
                  {formatCurrency(netSalary)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ViewSalaryDetails;
