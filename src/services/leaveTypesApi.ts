import { axiosClient } from '../config/axios.config';
import { LeaveType, LeaveBalance } from '../Interfaces/salary';

export async function listLeaveTypes(includeInactive = false) {
  const res = await axiosClient.get<{ data: LeaveType[] }>(
    `/leave-types?includeInactive=${includeInactive}`,
  );
  return res.data;
}

export async function getSuggestedCode(name: string) {
  const res = await axiosClient.get<{ code: string }>(
    `/leave-types/suggest-code?name=${encodeURIComponent(name)}`,
  );
  return res.data;
}

export async function createLeaveType(payload: Partial<LeaveType>) {
  const res = await axiosClient.post<{ data: LeaveType }>(
    `/leave-types`,
    payload,
  );
  return res.data;
}

export async function updateLeaveType(id: string, payload: Partial<LeaveType>) {
  const res = await axiosClient.patch<{ data: LeaveType }>(
    `/leave-types/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteLeaveType(id: string) {
  const res = await axiosClient.delete<{ data: LeaveType }>(
    `/leave-types/${id}`,
  );
  return res.data;
}

export async function getMyBalances(year: number) {
  const res = await axiosClient.get<{ data: LeaveBalance[] }>(
    `/leave-balances/my/${year}`,
  );
  return res.data;
}

export async function getYearBalances(year: number) {
  const res = await axiosClient.get<{ data: LeaveBalance[] }>(
    `/leave-balances/year/${year}`,
  );
  return res.data;
}

export async function getUserBalances(userId: string, year: number) {
  const res = await axiosClient.get<{ data: LeaveBalance[] }>(
    `/leave-balances/user/${userId}/${year}`,
  );
  return res.data;
}

/**
 * Upsert a user's allocation. `monthlyQuota` is an optional per-user
 * override of the LeaveType's global monthly accrual cap:
 *   - omit → leave existing override untouched
 *   - number → set override (e.g. 0 to disable accrual, 1 instead of 1.5)
 *   - null  → clear override and revert to the type default
 */
export async function updateAllocation(
  userId: string,
  year: number,
  leaveTypeId: string,
  allocated: number,
  monthlyQuota?: number | null,
) {
  const body: { allocated: number; monthlyQuota?: number | null } = {
    allocated,
  };
  if (monthlyQuota !== undefined) body.monthlyQuota = monthlyQuota;
  const res = await axiosClient.patch<{ data: LeaveBalance }>(
    `/leave-balances/user/${userId}/${year}/${leaveTypeId}`,
    body,
  );
  return res.data;
}

export interface ProbationStatus {
  onProbation: boolean;
  /**
   * True when probation is still 'in_progress' AND the original 90-day
   * window has elapsed. Signals to the user dashboard that an admin
   * needs to confirm before leaves accrue.
   */
  awaitingConfirmation?: boolean;
  dateOfJoining?: string;
  probationEnd?: string;
  /** Explicit status from the new probation workflow. `null` for
   *  legacy users where status hasn't been stamped. */
  probationStatus?: "in_progress" | "confirmed" | null;
  /** Admin-chosen end date once confirmed (may be backdated). */
  probationConfirmedEnd?: string;
}

/**
 * Fetches the calling user's probation snapshot. The ApplyLeave form
 * uses this to filter the leave-type picker (probationary employees
 * see only UL) and to render a notice explaining the policy.
 */
export async function getMyProbationStatus() {
  const res = await axiosClient.get<{ data: ProbationStatus }>(
    `/leaves/me/probation`,
  );
  return res.data;
}

export async function triggerYearlyReset(year: number, force = false) {
  const res = await axiosClient.post<{ data: { year: number; users: number; types: number; upserted: number } }>(
    `/leave-balances/reset/${year}?force=${force}`,
  );
  return res.data;
}
