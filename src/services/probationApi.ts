import { axiosClient } from '../config/axios.config';

export interface ProbationPendingRow {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfJoining?: string;
  probationOriginalEndDate?: string;
  probationExtensionDays: number;
  daysOverdue: number | null;
  overdue: boolean;
}

export interface ConfirmProbationResult {
  userId: string;
  probationStatus: 'confirmed';
  probationEndDate: string;
  balancesUpdated: number;
}

export interface ExtendProbationResult {
  userId: string;
  probationOriginalEndDate: string;
  addedDays: number;
  totalExtensionDays: number;
}

/**
 * Admin-facing endpoints for the Employee Management → Probation tab.
 * All three require admin or super-admin auth — calling as a regular
 * user yields a 403.
 */
export async function listPendingProbations() {
  const res = await axiosClient.get<{ data: ProbationPendingRow[] }>(
    '/probation/pending',
  );
  return res.data;
}

export async function confirmProbation(
  userId: string,
  endDate?: string,
) {
  const res = await axiosClient.post<{ data: ConfirmProbationResult }>(
    `/probation/${userId}/confirm`,
    endDate ? { endDate } : {},
  );
  return res.data;
}

export async function extendProbation(
  userId: string,
  days: number,
  reason?: string,
) {
  const res = await axiosClient.post<{ data: ExtendProbationResult }>(
    `/probation/${userId}/extend`,
    { days, reason: reason || undefined },
  );
  return res.data;
}

// ── Joining-date management (Employee Management → Joining dates tab)
//
// Reuses the same /probation/... prefix so the express routing stays
// in one file; the endpoints themselves serve the broader employee
// lifecycle, not probation specifically.

export interface EmployeeJoiningRow {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string[];
  dateOfJoining: string | null;
  probationStatus: 'in_progress' | 'confirmed' | null;
  probationOriginalEndDate: string | null;
  probationEndDate: string | null;
  relievingDate: string | null;
  hasProfile: boolean;
}

export interface UpdateJoiningDateResult {
  userId: string;
  dateOfJoining: string;
  probationOriginalEndDate: string | null;
  balancesUpdated: number;
}

export async function listEmployeesWithJoiningDates() {
  const res = await axiosClient.get<{ data: EmployeeJoiningRow[] }>(
    '/probation/employees',
  );
  return res.data;
}

export async function updateEmployeeJoiningDate(
  userId: string,
  dateOfJoining: string,
) {
  const res = await axiosClient.patch<{ data: UpdateJoiningDateResult }>(
    `/probation/employees/${userId}/joining-date`,
    { dateOfJoining },
  );
  return res.data;
}
