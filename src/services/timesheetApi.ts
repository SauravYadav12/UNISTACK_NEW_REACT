import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { ITimesheet, ITimesheetEntry } from '../Interfaces/timesheet';

export async function timesheetsList(query: string = '', signal?: AbortSignal) {
  return axiosClient.get<ApiQueryRes<PaginationResult<ITimesheet>>>(
    `/timesheets/get-timesheets?${query}`,
    { signal }
  );
}

export async function getTimesheetByMonth(
  projectRef: string,
  periodMonth: string
) {
  return axiosClient.get<ApiQueryRes<ITimesheet | null>>(
    `/timesheets/by-month?projectRef=${projectRef}&periodMonth=${periodMonth}`
  );
}

export async function upsertTimesheet(payload: {
  projectRef: string;
  periodMonth: string;
  entries: ITimesheetEntry[];
  notes?: string;
}) {
  return axiosClient.post<ApiQueryRes<ITimesheet>>(
    `/timesheets/upsert`,
    payload
  );
}

export async function deleteTimesheet(id: string) {
  return axiosClient.delete<ApiQueryRes<ITimesheet>>(`/timesheets/${id}`);
}

export async function markTimesheetComplete(
  projectRef: string,
  periodMonth: string
) {
  return axiosClient.post<ApiQueryRes<ITimesheet>>(
    `/timesheets/mark-complete`,
    { projectRef, periodMonth }
  );
}

export async function addTimesheetScreenshot(
  timesheetId: string,
  payload:
    | {
        slotId: string;
        url: string;
        fileName: string;
        sizeBytes?: number;
        weekLabel?: string;
      }
    | {
        weekStart: string;
        weekEnd: string;
        weekLabel?: string;
        url: string;
        fileName: string;
        sizeBytes?: number;
      }
) {
  return axiosClient.post<ApiQueryRes<ITimesheet>>(
    `/timesheets/${timesheetId}/screenshots`,
    payload
  );
}

export async function removeTimesheetScreenshot(
  timesheetId: string,
  shotId: string
) {
  return axiosClient.delete<ApiQueryRes<ITimesheet>>(
    `/timesheets/${timesheetId}/screenshots/${shotId}`
  );
}

export async function setTimesheetScreenshotSlots(
  timesheetId: string,
  slots: Array<{
    _id?: string;
    label: string;
    /** First-save backfill hint — pairs any unbound legacy screenshot
     *  whose weekStart/weekEnd match this slot to its newly-issued _id. */
    weekStart?: string;
    weekEnd?: string;
  }>
) {
  return axiosClient.put<ApiQueryRes<ITimesheet>>(
    `/timesheets/${timesheetId}/screenshot-slots`,
    { slots }
  );
}
