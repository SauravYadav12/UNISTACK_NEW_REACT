import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  LeaderboardResponse,
  MarketingMetrics,
  PerformanceRole,
  SupportMetrics,
  WeightsResponse,
} from '../Interfaces/performance';

function rangeQS(from?: string, to?: string): string {
  const qs = new URLSearchParams();
  if (from) qs.set('fromDate', from);
  if (to) qs.set('toDate', to);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function getMarketingLeaderboard(
  from?: string,
  to?: string
) {
  return axiosClient.get<ApiQueryRes<LeaderboardResponse<MarketingMetrics>>>(
    `/performance/marketing${rangeQS(from, to)}`
  );
}

export async function getSupportLeaderboard(from?: string, to?: string) {
  return axiosClient.get<ApiQueryRes<LeaderboardResponse<SupportMetrics>>>(
    `/performance/support${rangeQS(from, to)}`
  );
}

export async function getPerformanceWeights() {
  return axiosClient.get<ApiQueryRes<WeightsResponse>>(`/performance/weights`);
}

export async function updatePerformanceWeights(payload: {
  role: PerformanceRole;
  weights: Record<string, number>;
  reason?: string;
}) {
  return axiosClient.patch<ApiQueryRes<unknown>>(`/performance/weights`, payload);
}

export async function resetPerformanceWeights(role: PerformanceRole) {
  return axiosClient.post<ApiQueryRes<unknown>>(`/performance/weights/reset`, {
    role,
  });
}
