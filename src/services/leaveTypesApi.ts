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

export async function updateAllocation(
  userId: string,
  year: number,
  leaveTypeId: string,
  allocated: number,
) {
  const res = await axiosClient.patch<{ data: LeaveBalance }>(
    `/leave-balances/user/${userId}/${year}/${leaveTypeId}`,
    { allocated },
  );
  return res.data;
}

export async function triggerYearlyReset(year: number, force = false) {
  const res = await axiosClient.post<{ data: { year: number; users: number; types: number; upserted: number } }>(
    `/leave-balances/reset/${year}?force=${force}`,
  );
  return res.data;
}
