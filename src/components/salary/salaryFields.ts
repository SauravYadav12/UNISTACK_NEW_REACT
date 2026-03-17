import { SalaryStructure } from './SalaryForm';

export interface SalaryField {
  key: keyof Omit<SalaryStructure, 'bonus'>;
  label: string;
}

export interface SalaryFormField extends SalaryField {
  type: 'number';
  gridSize: { xs: number; md: number };
  placeholder?: string;
  prefix?: string;
}

export const earningsFormFields: SalaryFormField[] = [
  {
    key: 'basicSalary',
    label: 'Basic Salary',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'hra',
    label: 'HRA (House Rent Allowance)',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'medicalAllowance',
    label: 'Medical Allowance',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'travelAllowance',
    label: 'Travel Allowance',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'foodAllowance',
    label: 'Food Allowance',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'mobileAllowance',
    label: 'Mobile/Phone Allowance',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'otherAllowances',
    label: 'Other Allowances',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
];

export const deductionFormFields: SalaryFormField[] = [
  {
    key: 'incomeTax',
    label: 'Income Tax',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'pfContribution',
    label: "Employee's PF Contribution",
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'esiContribution',
    label: 'ESI Contribution',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'professionalTax',
    label: 'Professional Tax',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'lopDeduction',
    label: 'LOP (Loss of Pay) Deduction',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'otherDeductions',
    label: 'Other Deductions',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
];

export const employerFormFields: SalaryFormField[] = [
  {
    key: 'employerPfContribution',
    label: 'Employer PF Contribution',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'employerEsiContribution',
    label: 'Employer ESI Contribution',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
  {
    key: 'gratuity',
    label: 'Gratuity',
    type: 'number',
    gridSize: { xs: 12, md: 4 },
    prefix: '₹',
  },
];