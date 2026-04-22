import { axiosClient } from '../config/axios.config';
import { SalaryConfig, SalarySlip } from '../Interfaces/salary';

export async function getSalaryConfig(userId: string) {
  const res = await axiosClient.get<{ data: SalaryConfig | null }>(
    `/salary/config/${userId}`
  );
  return res.data;
}

export async function upsertSalaryConfig(
  userId: string,
  payload: Partial<SalaryConfig>
) {
  const res = await axiosClient.patch<{ data: SalaryConfig }>(
    `/salary/config/${userId}`,
    payload
  );
  return res.data;
}

export async function generateSlipsForMonth(year: number, month: number) {
  const res = await axiosClient.post<{ year: number; month: number; ok: number; failed: number }>(
    `/salary/generate/${year}/${month}`
  );
  return res.data;
}

export async function generateSlipForUser(
  userId: string,
  year: number,
  month: number
) {
  const res = await axiosClient.post<{ data: SalarySlip }>(
    `/salary/generate/${userId}/${year}/${month}`
  );
  return res.data;
}

export async function getSlipsForMonth(year: number, month: number) {
  const res = await axiosClient.get<{ data: SalarySlip[] }>(
    `/salary/slips/${year}/${month}`
  );
  return res.data;
}

export async function updateSlip(slipId: string, payload: Partial<SalarySlip>) {
  const res = await axiosClient.patch<{ data: SalarySlip }>(
    `/salary/slip/${slipId}`,
    payload,
  );
  return res.data;
}

export async function getMySlip(year: number, month: number) {
  const res = await axiosClient.get<{ data: SalarySlip }>(
    `/salary/my-slip/${year}/${month}`
  );
  return res.data;
}

export async function getMySlipsList() {
  const res = await axiosClient.get<{ data: Array<Pick<SalarySlip, 'year' | 'month' | 'netPay' | 'currency' | 'generatedAt'>> }>(
    `/salary/my-slips`
  );
  return res.data;
}

export function monthlyReportCsvUrl(year: number, month: number) {
  return `/salary/report/${year}/${month}.csv`;
}

export interface SyncCountryResult {
  country: 'IN' | 'US';
  upserted: number;
  skipped: number;
  error?: string;
  source?: 'nager' | 'fallback';
}
export interface SyncHolidaysResult {
  year: number;
  india?: SyncCountryResult;
  us?: SyncCountryResult;
}

export async function syncHolidays(year: number, country?: 'IN' | 'US') {
  const url = `/salary/holidays/sync/${year}${country ? `?country=${country}` : ''}`;
  const res = await axiosClient.post<{ data: SyncHolidaysResult }>(url);
  return res.data;
}
