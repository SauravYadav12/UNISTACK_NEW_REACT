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
  /** Standard statutory deduction — flat ₹208 / month for every employee
   *  (Karnataka PT slab). Defaulted by the server schema so legacy configs
   *  without the field also resolve to 208 on read. */
  professionalTax: number;
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
  /**
   * Per-user override of the LeaveType's global `monthlyQuota`. `null` /
   * missing → use the type default. Number → this user accrues at this
   * rate instead. Set by an admin for mid-year joiners to avoid the
   * cumulative ceiling unlocking the full balance on month 1.
   */
  monthlyQuota?: number | null;
  /**
   * 1-indexed month within `year` that monthly accrual begins. `null` /
   * missing → January (legacy / full-year employee). Set to a value
   * 2..12 for probationary new joiners so accrual is re-anchored.
   * Example: an April joiner gets `leaveStartMonth: 7`, meaning July is
   * treated as accrual-month #1 with `1 × monthlyQuota` available.
   */
  leaveStartMonth?: number | null;
  // Server-computed — how many days the user can still avail this month,
  // taking into account carry-forward from earlier months. Only present on
  // responses from /leave-balances/my/:year and /leave-balances/user/:id/:year.
  monthlyAvailable?: number;
  /**
   * Server-computed — fresh remaining accrual for the CURRENT calendar
   * month only (effectiveQuota − usedThisMonth). This is the number the
   * UI shows as "Available this month" — the older `monthlyAvailable`
   * still exists but represents the cumulative paid pool used by the
   * split logic.
   */
  remainingThisMonth?: number;
  /** Days already burned this calendar month (paired with remainingThisMonth). */
  usedThisMonth?: number;
  /** Yearly allocation minus total used across the whole year. */
  yearlyRemaining?: number;
  /**
   * Server-computed effective per-month accrual rate. Resolves through:
   *   per-user override → type uncapped check → allocated/12 default.
   * `null` means uncapped (UL / ML without an override). Same response
   * channels as `monthlyAvailable`.
   */
  effectiveMonthlyQuota?: number | null;
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
  /** When true, the apply-leave form requires at least one
   *  attachment. Used for Medical Leave (supporting documentation). */
  requiresAttachment?: boolean;
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
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  lopDeduction: number;
  total: number;
}

export interface SalarySlipLeaveBreakdown {
  // YTD figures — kept on the type for back-compat with old slips. The
  // printable slip no longer surfaces them to avoid misleading
  // employees ("8 yearly available, why am I being deducted?").
  paidAccrued: number;
  paidUsed: number;
  paidBalance: number;
  medicalAccrued: number;
  medicalUsed: number;
  medicalBalance: number;
  // ── This-month figures ──
  // What the employee was entitled to + actually used in the payroll
  // period. Optional so reads of legacy slips don't crash; the
  // renderer falls back to the YTD numbers when absent.
  paidMonthlyQuota?: number;
  paidUsedThisMonth?: number;
  medicalMonthlyQuota?: number;
  medicalUsedThisMonth?: number;
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
  /** Publish gate — until HR flips this, the employee endpoints
   *  (`getMySlip`, `getMySlipsList`) hide the slip. */
  published?: boolean;
  publishedAt?: string;
}
