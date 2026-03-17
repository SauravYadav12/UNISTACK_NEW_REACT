import React, { useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  earningsFormFields,
  deductionFormFields,
  employerFormFields,
  SalaryFormField,
} from './salaryFields';
import {
  calculateSalary,
  formatCurrency,
} from '../../utils/salaryCalculations';
import salaryStructureApi from '../../services/salaryStructureApi';

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

interface SalaryFormProps {
  initialData?: Partial<SalaryStructure>;
  employeeId?: string;
  onSubmit?: (data: SalaryStructure) => void;
  onCancel?: () => void;
}

// API Payload interface for salary update
export interface SalaryUpdatePayload {
  employeeId?: string;
  salaryStructure: SalaryStructure;
  updatedBy?: string;
  updatedAt?: Date;
}

const SalaryForm: React.FC<SalaryFormProps> = ({
  initialData,
  employeeId,
  onSubmit,
  onCancel,
}) => {
  const { iUser, myProfile } = useAuth();
  const [loading, setLoading] = useState(false);

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
    setValue,
    getValues,
  } = useForm<SalaryStructure>({
    resolver: zodResolver(salarySchema),
    defaultValues,
  });

  const watchedValues = watch();
  const [bonuses, setBonuses] = useState<
    Array<{ label: string; amount: number }>
  >(initialData?.bonus || []);

  // Bonus management functions
  const addBonus = () => {
    const newBonus = { label: '', amount: 0 };
    const updatedBonuses = [...bonuses, newBonus];
    setBonuses(updatedBonuses);
    setValue('bonus', updatedBonuses);
  };

  const removeBonus = (index: number) => {
    const updatedBonuses = bonuses.filter((_, i) => i !== index);
    setBonuses(updatedBonuses);
    setValue('bonus', updatedBonuses);
  };

  const updateBonus = (
    index: number,
    field: 'label' | 'amount',
    value: string | number
  ) => {
    const updatedBonuses = bonuses.map((bonus, i) =>
      i === index ? { ...bonus, [field]: value } : bonus
    );
    setBonuses(updatedBonuses);
    setValue('bonus', updatedBonuses);
  };

  // Use shared salary calculation function
  const { grossSalary, totalDeductions, netSalary, ctc } =
    calculateSalary(watchedValues);

  const preventInvalidNumberInput = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleFormSubmit = async (data: SalaryStructure) => {
    if (loading) return;
    setLoading(true);

    try {
      // Create API payload
      const payload: SalaryUpdatePayload = {
        employeeId,
        salaryStructure: {
          ...data,
          bonus: bonuses,
        },
        updatedBy: `${iUser?.firstName} ${iUser?.lastName}`,
        updatedAt: new Date(),
      };

      console.log('Salary update payload:', payload);

      // Call the actual API with employee ID
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      await salaryStructureApi.save(employeeId, payload.salaryStructure);

      onSubmit?.(payload.salaryStructure);
      toast.success('Salary details updated successfully!');
      setBonuses([]);
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error('Failed to update salary details');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: SalaryFormField) => {
    return (
      <Grid item xs={field.gridSize.xs} md={field.gridSize.md} key={field.key}>
        <TextField
          label={field.label}
          type="number"
          fullWidth
          disabled={loading}
          error={!!errors[field.key]}
          helperText={errors[field.key]?.message}
          placeholder={field.placeholder}
          inputProps={{ min: 0, step: 'any' }}
          onKeyDown={preventInvalidNumberInput}
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
          {...register(field.key, { valueAsNumber: true })}
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
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="small"
            sx={{ borderRadius: 2 }}
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

          {earningsFormFields.map(renderField)}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
              🎁 Bonus & Incentives
            </Typography>
          </Grid>

          {/* Bonus Fields */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addBonus}
                disabled={loading}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Add Bonus
              </Button>
            </Box>

            {bonuses.map((bonus, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Bonus Label"
                        value={bonus.label}
                        onChange={(e) =>
                          updateBonus(index, 'label', e.target.value)
                        }
                        fullWidth
                        disabled={loading}
                        size="small"
                        placeholder="e.g., Performance Bonus, Festival Bonus"
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Bonus Amount"
                        type="number"
                        value={bonus.amount}
                        onChange={(e) =>
                          updateBonus(
                            index,
                            'amount',
                            e.target.value
                          )
                        }
                        fullWidth
                        onKeyDown={preventInvalidNumberInput}
                        disabled={loading}
                        size="small"
                        inputProps={{ min: 0, step: 'any' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <IconButton
                        onClick={() => removeBonus(index)}
                        disabled={loading}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
              📉 Deductions
            </Typography>
          </Grid>

          {deductionFormFields.map(renderField)}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              🏢 Employer Contributions (for CTC calculation)
            </Typography>
          </Grid>

          {employerFormFields.map(renderField)}
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
