import { axiosClient } from '../config/axios.config';

export interface HolidayNoticeSettings {
  _id?: string;
  enabled: boolean;
  daysBefore: number;
  subject: string;
  heading: string;
  bodyLead: string;
  bodyDetails: string;
  signOff: string;
  updatedAt?: string;
}

export interface HolidayNoticePreview {
  subject: string;
  html: string;
  preview: Record<string, string | number>;
}

export async function getHolidayNoticeSettings() {
  const res = await axiosClient.get<{ data: HolidayNoticeSettings }>(
    '/holiday-notice/settings',
  );
  return res.data;
}

export async function updateHolidayNoticeSettings(payload: Partial<HolidayNoticeSettings>) {
  const res = await axiosClient.patch<{ data: HolidayNoticeSettings }>(
    '/holiday-notice/settings',
    payload,
  );
  return res.data;
}

export async function previewHolidayNotice(opts?: {
  employeeName?: string;
  holidayName?: string;
  holidayDate?: string;
  daysUntil?: number;
  country?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.employeeName) params.set('employeeName', opts.employeeName);
  if (opts?.holidayName) params.set('holidayName', opts.holidayName);
  if (opts?.holidayDate) params.set('holidayDate', opts.holidayDate);
  if (opts?.daysUntil != null) params.set('daysUntil', String(opts.daysUntil));
  if (opts?.country) params.set('country', opts.country);
  const qs = params.toString();
  const res = await axiosClient.get<{ data: HolidayNoticePreview }>(
    `/holiday-notice/preview${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

export async function runHolidayNoticeNow() {
  const res = await axiosClient.post<{ data: { enabled: boolean; holidays: number; emails: number } }>(
    '/holiday-notice/run-now',
  );
  return res.data;
}

export async function clearSentFlagsForFuture() {
  const res = await axiosClient.post<{ data: { cleared: number } }>(
    '/holiday-notice/clear-sent-future',
  );
  return res.data;
}
