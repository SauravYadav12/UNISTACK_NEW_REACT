import React, { useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';

const salarySchema = z.object({
  basicSalary: z
    .number()
    .min(0, 'Basic salary must be positive')
    .max(10000000, 'Invalid amount'),
  hra: z.number().min(0, 'HRA must be positive').max(5000000, 'Invalid amount'),
  medicalAllowance: z
    .number()
    .min(0, 'Medical allowance must be positive')
    .max(500000, 'Invalid amount'),
  travelAllowance: z
    .number()
    .min(0, 'Travel allowance must be positive')
    .max(500000, 'Invalid amount'),
  foodAllowance: z
    .number()
    .min(0, 'Food allowance must be positive')
    .max(200000, 'Invalid amount'),
  mobileAllowance: z
    .number()
    .min(0, 'Mobile allowance must be positive')
    .max(50000, 'Invalid amount'),
  otherAllowances: z
    .number()
    .min(0, 'Other allowances must be positive')
    .max(2000000, 'Invalid amount'),
  bonus: z
    .array(
      z.object({
        label: z.string().min(1, 'Bonus label is required'),
        amount: z.number().min(0, 'Bonus amount must be positive'),
      })
    )
    .optional(),
  // performanceIncentive: z
  //   .number()
  //   .min(0, 'Performance incentive must be positive')
  //   .max(1000000, 'Invalid amount'),
  // overtimePay: z
  //   .number()
  //   .min(0, 'Overtime pay must be positive')
  //   .max(500000, 'Invalid amount'),
  incomeTax: z
    .number()
    .min(0, 'Income tax must be positive')
    .max(3000000, 'Invalid amount'),
  pfContribution: z
    .number()
    .min(0, 'PF contribution must be positive')
    .max(1000000, 'Invalid amount'),
  esiContribution: z
    .number()
    .min(0, 'ESI contribution must be positive')
    .max(100000, 'Invalid amount'),
  professionalTax: z
    .number()
    .min(0, 'Professional tax must be positive')
    .max(50000, 'Invalid amount'),
  lopDeduction: z
    .number()
    .min(0, 'LOP deduction must be positive')
    .max(1000000, 'Invalid amount'),
  otherDeductions: z
    .number()
    .min(0, 'Other deductions must be positive')
    .max(1000000, 'Invalid amount'),
  // Employer contributions for CTC calculation
  employerPfContribution: z
    .number()
    .min(0, 'Employer PF must be positive')
    .max(1000000, 'Invalid amount'),
  employerEsiContribution: z
    .number()
    .min(0, 'Employer ESI must be positive')
    .max(100000, 'Invalid amount'),
  gratuity: z
    .number()
    .min(0, 'Gratuity must be positive')
    .max(500000, 'Invalid amount'),
});

export type SalaryStructure = z.infer<typeof salarySchema>;

interface FieldConfig {
  name: keyof SalaryStructure;
  label: string;
  type: 'number' | 'text';
  gridSize: { xs: number; md: number };
  placeholder?: string;
  prefix?: string;
}

interface SalaryFormProps {
  initialData?: Partial<SalaryStructure>;
  onSubmit?: (data: SalaryStructure) => void;
  onCancel?: () => void;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

const SalaryForm: React.FC<SalaryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { iUser, myProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const earningsFields: FieldConfig[] = [
    {
      name: 'basicSalary',
      label: 'Basic Salary',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'hra',
      label: 'HRA (House Rent Allowance)',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'medicalAllowance',
      label: 'Medical Allowance',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'travelAllowance',
      label: 'Travel Allowance',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'foodAllowance',
      label: 'Food Allowance',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'mobileAllowance',
      label: 'Mobile/Phone Allowance',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'otherAllowances',
      label: 'Other Allowances',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
  ];

  // const bonusFields: FieldConfig[] = [
  //   {
  //     name: 'performanceIncentive',
  //     label: 'Performance Incentive',
  //     type: 'number',
  //     gridSize: { xs: 12, md: 6 },
  //     prefix: '₹',
  //   },
  //   {
  //     name: 'overtimePay',
  //     label: 'Overtime Pay',
  //     type: 'number',
  //     gridSize: { xs: 12, md: 6 },
  //     prefix: '₹',
  //   },
  // ];

  const deductionFields: FieldConfig[] = [
    {
      name: 'incomeTax',
      label: 'Income Tax',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'pfContribution',
      label: "Employee's PF Contribution",
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'esiContribution',
      label: 'ESI Contribution',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'professionalTax',
      label: 'Professional Tax',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'lopDeduction',
      label: 'LOP (Loss of Pay) Deduction',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'otherDeductions',
      label: 'Other Deductions',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
  ];

  const employerContributionFields: FieldConfig[] = [
    {
      name: 'employerPfContribution',
      label: 'Employer PF Contribution',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'employerEsiContribution',
      label: 'Employer ESI Contribution',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
    {
      name: 'gratuity',
      label: 'Gratuity',
      type: 'number',
      gridSize: { xs: 12, md: 4 },
      prefix: '₹',
    },
  ];

  const defaultValues: SalaryStructure = {
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
    ...initialData,
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<SalaryStructure>({
    resolver: zodResolver(salarySchema),
    defaultValues,
  });

  const watchedValues = watch();

  // Calculate derived values
  const grossSalary =
    watchedValues.basicSalary +
    watchedValues.hra +
    watchedValues.medicalAllowance +
    watchedValues.travelAllowance +
    watchedValues.foodAllowance +
    watchedValues.mobileAllowance +
    watchedValues.otherAllowances +
    (watchedValues.bonus || []).reduce((acc, bonus) => acc + bonus.amount, 0);
  // watchedValues.performanceIncentive +
  // watchedValues.overtimePay;

  const totalDeductions =
    watchedValues.incomeTax +
    watchedValues.pfContribution +
    watchedValues.esiContribution +
    watchedValues.professionalTax +
    watchedValues.lopDeduction +
    watchedValues.otherDeductions;

  const netSalary = grossSalary - totalDeductions;

  // CTC calculation (Cost to Company)
  const ctc =
    grossSalary +
    watchedValues.employerPfContribution +
    watchedValues.employerEsiContribution +
    watchedValues.gratuity;

  const handleFormSubmit = async (data: SalaryStructure) => {
    if (loading) return;
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit?.(data);
      toast.success('Salary details updated successfully!');
      reset(defaultValues);
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error('Failed to update salary details');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const registerOptions =
      field.type === 'number' ? { valueAsNumber: true } : {};

    return (
      <Grid item xs={field.gridSize.xs} md={field.gridSize.md} key={field.name}>
        <TextField
          label={field.label}
          type={field.type}
          fullWidth
          disabled={loading}
          error={!!errors[field.name]}
          helperText={errors[field.name]?.message}
          placeholder={field.placeholder}
          InputProps={
            field.prefix
              ? {
                  startAdornment: (
                    <InputAdornment position="start">
                      {field.prefix}
                    </InputAdornment>
                  ),
                }
              : undefined
          }
          {...register(field.name, registerOptions)}
        />
      </Grid>
    );
  };

  return (
    <Box>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            size="small"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="small"
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'success.main' }}
            >
              💰 Earnings
            </Typography>
          </Grid>

          {earningsFields.map(renderField)}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
              🎁 Bonus & Incentives
            </Typography>
          </Grid>

          {/* {bonusFields.map(renderField)} */}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
              📉 Deductions
            </Typography>
          </Grid>

          {deductionFields.map(renderField)}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              🏢 Employer Contributions (for CTC calculation)
            </Typography>
          </Grid>

          {employerContributionFields.map(renderField)}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              💼 Salary Summary
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
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
                      sx={{
                        fontWeight: 'bold',
                        color: 'info.contrastText',
                      }}
                    >
                      {formatCurrency(ctc)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: 'success.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="success.contrastText"
                    >
                      💰 Gross Salary
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        color: 'success.contrastText',
                      }}
                    >
                      {formatCurrency(grossSalary)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="primary.contrastText"
                    >
                      💵 Net Salary
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.contrastText',
                      }}
                    >
                      {formatCurrency(netSalary)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default SalaryForm;
