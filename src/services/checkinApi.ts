import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  ICheckInSession,
  CurrentSessionResponse,
  CheckInLogsResponse,
  CheckInLogScope,
} from '../Interfaces/checkin';

// Start a working-hours session (also marks the day Present server-side).
export async function checkIn() {
  return axiosClient.post<ApiQueryRes<ICheckInSession>>('/checkin', {});
}

// Close the current session. `source` distinguishes a Check-Out click from
// a Logout-triggered close in the admin log.
export async function checkOut(source: 'manual' | 'logout' = 'manual') {
  return axiosClient.post<ApiQueryRes<ICheckInSession | null>>('/checkin/out', {
    source,
  });
}

// The caller's currently-open session (+ server time for elapsed calc).
export async function getCurrentSession() {
  return axiosClient.get<ApiQueryRes<CurrentSessionResponse>>(
    '/checkin/current'
  );
}

// Day/week/month log. Super-admin may pass userRef to scope to one person;
// non-super-admins always get only their own regardless of params.
export async function getCheckInLogs(params: {
  scope: CheckInLogScope;
  date?: string; // YYYY-MM-DD anchor; defaults to today server-side
  userRef?: string;
}) {
  const q = new URLSearchParams();
  q.set('scope', params.scope);
  if (params.date) q.set('date', params.date);
  if (params.userRef) q.set('userRef', params.userRef);
  return axiosClient.get<ApiQueryRes<CheckInLogsResponse>>(
    `/checkin/logs?${q.toString()}`
  );
}
