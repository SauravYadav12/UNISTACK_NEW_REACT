export interface SalaryConfig {
  _id?: string;
  user: string;
  /** Monthly CTC used to derive Basic / HRA / Mobile / Books via the fixed formula. */
  ctc: number;
  basic: number;
  hra: number;
  mobileReimbursement: number;
  booksReimbursement: number;
  specialAllowances: number;
  incentives: number;
  pf: number;
  tds: number;
  otherDeductions: number;
  country: 'IN' | 'US';
  currency: 'INR' | 'USD';
  effectiveFrom?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  _id?: string;
  user: string | { _id: string; firstName?: string; lastName?: string; email?: string; active?: boolean };
  year: number;
  leaveType: string | LeaveType;
  allocated: number;
  used: number;
  // Server-computed — how many days the user can still avail this month,
  // taking into account carry-forward from earlier months. Only present on
  // responses from /leave-balances/my/:year and /leave-balances/user/:id/:year.
  monthlyAvailable?: number;
  notes?: string;
}

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  paid: boolean;
  defaultAllocationPerYear: number;
  // Null/undefined means no monthly cap (UL, ML).
  monthlyQuota?: number | null;
  isUnpaidBucket: boolean;
  active: boolean;
}

export interface SalarySlipEarnings {
  basic: number;
  hra: number;
  mobileReimbursement: number;
  booksReimbursement: number;
  specialAllowances: number;
  incentives: number;
  total: number;
}

export interface SalarySlipDeductions {
  pf: number;
  tds: number;
  otherDeductions: number;
  lopDeduction: number;
  total: number;
}

export interface SalarySlipLeaveBreakdown {
  paidAccrued: number;
  paidUsed: number;
  paidBalance: number;
  medicalAccrued: number;
  medicalUsed: number;
  medicalBalance: number;
  unpaidDays: number;
  bonusPaid: number;
  bonusMedical: number;
}

export interface SalarySlip {
  _id?: string;
  user: string;
  year: number;
  month: number;
  employeeName: string;
  employeeId: string;
  designation: string;
  dateOfJoining?: string;
  country: 'IN' | 'US';
  currency: 'INR' | 'USD';
  totalDays: number;
  weekendDays: number;
  holidays: number;
  workingDays: number;
  presentDays: number;
  earnings: SalarySlipEarnings;
  deductions: SalarySlipDeductions;
  leaves: SalarySlipLeaveBreakdown;
  perDayRate: number;
  netPay: number;
  netPayWords: string;
  generatedAt?: string;
}
