import { SalaryStructure } from '../components/salary/SalaryForm';
import { deductionFormFields, earningsFormFields, employerFormFields } from '../components/salary/salaryFields';

export interface SalaryCalculationResult {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  ctc: number;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export function calculateSalary(data: SalaryStructure): SalaryCalculationResult {
  // Calculate gross salary from earnings fields + bonus
  const grossSalary = 
    earningsFormFields.reduce((sum, field) => sum + (data[field.key] || 0), 0) +
    (data.bonus || []).reduce((acc, bonus) => {
      const amount = typeof bonus.amount === 'number' && !isNaN(bonus.amount) ? bonus.amount : 0;
      return acc + amount;
    }, 0);

  // Calculate total deductions
  const totalDeductions = deductionFormFields.reduce(
    (sum, field) => sum + (data[field.key] || 0),
    0
  );

  // Calculate net salary
  const netSalary = grossSalary - totalDeductions;

  // Calculate CTC (Cost to Company)
  const ctc = grossSalary + employerFormFields.reduce(
    (sum, field) => sum + (data[field.key] || 0),
    0
  );

  return {
    grossSalary,
    totalDeductions,
    netSalary,
    ctc,
  };
}