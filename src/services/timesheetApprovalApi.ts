import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  ITimesheetApproval,
  TimesheetApprovalStatus,
} from '../Interfaces/timesheet';
import { IInvoice } from '../Interfaces/invoice';

export async function getApproval(projectRef: string, periodMonth: string) {
  return axiosClient.get<ApiQueryRes<ITimesheetApproval | null>>(
    `/timesheet-approvals?projectRef=${projectRef}&periodMonth=${periodMonth}`
  );
}

export async function listApprovals(params?: {
  status?: TimesheetApprovalStatus;
  projectRef?: string;
  organizationRef?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.projectRef) q.set('projectRef', params.projectRef);
  if (params?.organizationRef) q.set('organizationRef', params.organizationRef);
  return axiosClient.get<
    ApiQueryRes<{ results: ITimesheetApproval[]; totalDocuments: number }>
  >(`/timesheet-approvals/list?${q.toString()}`);
}

export async function submitApproval(
  projectRef: string,
  periodMonth: string
) {
  return axiosClient.post<ApiQueryRes<ITimesheetApproval>>(
    `/timesheet-approvals/submit`,
    { projectRef, periodMonth }
  );
}

export async function approveApproval(id: string) {
  return axiosClient.post<
    ApiQueryRes<{ approval: ITimesheetApproval; invoice: IInvoice }>
  >(`/timesheet-approvals/${id}/approve`);
}

export async function rejectApproval(id: string, reason: string) {
  return axiosClient.post<ApiQueryRes<ITimesheetApproval>>(
    `/timesheet-approvals/${id}/reject`,
    { reason }
  );
}
