import { useState } from 'react';
import { Grid, Typography, Box, Button, Divider } from '@mui/material';
import { Edit as EditIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import SalaryForm, { SalaryStructure } from './SalaryForm';
import {
  calculateSalary,
  formatCurrency,
} from '../../utils/salaryCalculations';
import {
  deductionFormFields,
  earningsFormFields,
  employerFormFields,
  salaryDefaultValues,
  SalaryFormField,
} from './salaryFields';
import Payslip from '../../pages/Payslip/Payslip';
import GeneratePayslip from '../payslip/ViewPayslip';

interface ViewSalaryDetailsProps {
  salaryData?: SalaryStructure;
  salaryId: string;
  onUpdate?: (data: SalaryStructure) => void;
}

const ViewSalaryDetails: React.FC<ViewSalaryDetailsProps> = ({
  salaryData = salaryDefaultValues,
  salaryId,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratePayslipOpen, setIsGeneratePayslipOpen] = useState(false);

  const { grossSalary, totalDeductions, netSalary, ctc } =
    calculateSalary(salaryData);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleGeneratePayslip = () => {
    setIsGeneratePayslipOpen(true);
  };

  const handleCloseGeneratePayslip = () => {
    setIsGeneratePayslipOpen(false);
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
    fields: SalaryFormField[],
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
        salaryId={salaryId}
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
              // mb: 2,
              gap: 2,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={handleGeneratePayslip}
              sx={{ borderRadius: 2 }}
              color="success"
            >
              Generate Payslip
            </Button>
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

        {renderFieldSection(
          'Earnings',
          earningsFormFields,
          '💰',
          'success.main'
        )}

        {salaryData.bonus && salaryData.bonus.length > 0 && (
          <>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: 'info.main',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                🎁 Bonus & Incentives
              </Typography>
              <Divider />
            </Grid>
            {salaryData.bonus.map((bonus, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {bonus.label || `Bonus ${index + 1}`}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {formatCurrency(bonus.amount)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </>
        )}

        {renderFieldSection(
          'Deductions',
          deductionFormFields,
          '📉',
          'error.main'
        )}

        {renderFieldSection(
          'Employer Contributions',
          employerFormFields,
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

      <Payslip/>

      <GeneratePayslip
      mode='generate'
        salaryStructure={salaryData}
        open={isGeneratePayslipOpen}
        onClose={handleCloseGeneratePayslip}
      />
    </>
  );
};

export default ViewSalaryDetails;
