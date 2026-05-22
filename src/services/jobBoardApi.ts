import { axiosClient } from '../config/axios.config';
import { JobSearchRequest, JobSearchResponse } from '../Interfaces/jobBoard';

/**
 * Single entry point into the server-side `/job-search` endpoint.
 *
 * The server is the only thing that knows the RapidAPI key — we never
 * call JSearch directly from the browser. The server also runs the
 * shared cache, so identical queries across teammates return instantly
 * without burning monthly quota.
 */
export async function searchJobs(
  body: JobSearchRequest,
  signal?: AbortSignal,
) {
  const response = await axiosClient.post<JobSearchResponse>(
    `/job-search/search`,
    body,
    { signal },
  );
  return response;
}
