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
