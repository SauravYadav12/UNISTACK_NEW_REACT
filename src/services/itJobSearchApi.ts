import { axiosClient } from '../config/axios.config';
import {
  SourcedJob,
  SourcedJobListResponse,
  SourcedJobEditable,
  SourcedJobStatus,
} from '../Interfaces/sourcedJob';

type Res<T> = { status: string; data: T };

export async function listSourcedJobs(params: {
  status?: SourcedJobStatus | 'all';
  source?: string;
  hasVendorContact?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.source) q.set('source', params.source);
  if (params.hasVendorContact) q.set('hasVendorContact', 'true');
  if (params.q) q.set('q', params.q);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  return axiosClient.get<Res<SourcedJobListResponse>>(
    `/it-job-search?${q.toString()}`
  );
}

export async function getSourcedJob(id: string) {
  return axiosClient.get<Res<SourcedJob>>(`/it-job-search/${id}`);
}

export async function updateSourcedJob(id: string, patch: SourcedJobEditable) {
  return axiosClient.patch<Res<SourcedJob>>(`/it-job-search/${id}`, patch);
}

export async function approveSourcedJob(id: string) {
  return axiosClient.post<Res<{ requirement: unknown; sourcedJob: SourcedJob }>>(
    `/it-job-search/${id}/approve`
  );
}

export async function rejectSourcedJob(id: string) {
  return axiosClient.post<Res<SourcedJob>>(`/it-job-search/${id}/reject`);
}

export async function runEmailIngest() {
  return axiosClient.post<Res<Record<string, number | boolean>>>(
    `/it-job-search/ingest/run`
  );
}

export async function runJsearchIngest() {
  return axiosClient.post<Res<Record<string, number | boolean>>>(
    `/it-job-search/ingest/jsearch`
  );
}
