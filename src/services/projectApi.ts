import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { IProject, ContractScope } from '../Interfaces/project';

export async function projectsList(query: string = '', signal?: AbortSignal) {
  return axiosClient.get<ApiQueryRes<PaginationResult<IProject>>>(
    `/projects/get-projects?${query}`,
    { signal }
  );
}

export async function getProject(id: string) {
  return axiosClient.get<ApiQueryRes<IProject>>(`/projects/get-project/${id}`);
}

export async function createProjectFromReq(
  reqID: string,
  organizationId: string,
  projectId?: string
) {
  return axiosClient.post<ApiQueryRes<IProject>>(`/projects/create-project`, {
    reqID,
    organizationId,
    projectId,
  });
}

/** Fetch the next auto-increment project ID for pre-filling the form. */
export async function suggestProjectId() {
  return axiosClient.get<ApiQueryRes<{ projectId: string }>>(
    `/projects/suggest-project-id`
  );
}

export async function updateProject(id: string, values: Partial<IProject>) {
  return axiosClient.patch<ApiQueryRes<IProject>>(
    `/projects/update-project/${id}`,
    values
  );
}

export async function deleteProject(id: string) {
  return axiosClient.delete<ApiQueryRes<IProject>>(
    `/projects/delete-project/${id}`
  );
}

export interface HardDeleteProjectSummary {
  projectId: string;
  projectIdStr: string;
  counts: {
    timesheets: number;
    approvals: number;
    invoices: number;
    notifications: number;
    s3Deleted: number;
    s3Failed: number;
  };
}

/**
 * Super-admin only. Cascades: Timesheets + TimesheetApprovals + Invoices
 * + Notifications (by link.projectId) + every S3 blob owned by the
 * project or its dependents. Server returns per-collection counts.
 */
export async function hardDeleteProject(id: string) {
  return axiosClient.delete<ApiQueryRes<HardDeleteProjectSummary>>(
    `/projects/hard-delete/${id}`
  );
}

// ── Additional details ──

export async function addAdditionalDetail(
  id: string,
  payload: { key: string; value: string }
) {
  return axiosClient.post<ApiQueryRes<IProject>>(
    `/projects/${id}/additional-details`,
    payload
  );
}

export async function updateAdditionalDetail(
  id: string,
  detailId: string,
  payload: { key?: string; value?: string }
) {
  return axiosClient.patch<ApiQueryRes<IProject>>(
    `/projects/${id}/additional-details/${detailId}`,
    payload
  );
}

export async function removeAdditionalDetail(id: string, detailId: string) {
  return axiosClient.delete<ApiQueryRes<IProject>>(
    `/projects/${id}/additional-details/${detailId}`
  );
}

// ── Contracts ──

export async function addContract(
  id: string,
  payload: {
    scope: ContractScope;
    url: string;
    fileName: string;
    sizeBytes?: number;
    label?: string;
  }
) {
  return axiosClient.post<ApiQueryRes<IProject>>(
    `/projects/${id}/contracts`,
    payload
  );
}

export async function removeContract(id: string, contractId: string) {
  return axiosClient.delete<ApiQueryRes<IProject>>(
    `/projects/${id}/contracts/${contractId}`
  );
}
