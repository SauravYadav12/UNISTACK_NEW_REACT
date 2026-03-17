import { SalaryStructure } from '../components/salary/SalaryForm';

export interface Payslip {
  _id: string;
  employeeId: string;
  user: string;
  profile: string;
  month: number;
  year: number;
  email: string;
  dob: string;
  name: string;
  workingDays: number;
  designation: string;
  dateOfJoining: string;
  salaryStructure: SalaryStructure;
  createdAt: string;
  updatedAt: string;
}
