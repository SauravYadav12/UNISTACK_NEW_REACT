import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  SupportReport,
  InterviewReport,
  MarketingReport,
  DashboardReport,
} from '../Interfaces/reports';
import { axiosClient } from '../config/axios.config';


export async function getReport<T>(
  type: 'marketing' | 'support' | 'interview' | 'dashboard',
  fromDate?: string,
  toDate?: string
) {
  let query = '';
  if (fromDate) query += `fromDate=${fromDate}&`;
  if (toDate) query += `toDate=${toDate}`;

  const response = await axiosClient.get<ApiQueryRes<T>>(
    `/reports/${type}?${query}`
  );
  return response;
}

const d = new Date().toISOString();

export async function getSupportReport(
  fromDate: string = d,
  toDate: string = d
) {
  return await getReport<SupportReport[]>('support', fromDate, toDate);
}

export async function getMarketingReport(
  fromDate: string = d,
  toDate: string = d
) {
  return await getReport<MarketingReport[]>('marketing', fromDate, toDate);
}

export async function getInterviewReport(
  fromDate: string = d,
  toDate: string = d
) {
  return await getReport<{
    report: InterviewReport[];
    totalInterviews: number;
  }>('interview', fromDate, toDate);
}
export async function getDashboardReport() {
  return await getReport<DashboardReport>('dashboard');
}

/** One position behind a clicked number in the marketing report. */
export interface MarketingPosition {
  _id: string;
  reqID: string;
  reqStatus?: string;
  appliedFor?: string;
  assignedTo?: string;
  _perfInProgressAt?: string;
  _perfSubmittedAt?: string;
  _perfInterviewedAt?: string;
  _perfCancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * The positions behind a marketing-report number (same status-date filter as
 * the counts). `status` omitted → the person's total across all four buckets.
 */
export async function getMarketingPositions(params: {
  assignedToRef: string;
  status?: string;
  fromDate: string;
  toDate: string;
}) {
  const q = new URLSearchParams();
  q.set('assignedToRef', params.assignedToRef);
  if (params.status) q.set('status', params.status);
  q.set('fromDate', params.fromDate);
  q.set('toDate', params.toDate);
  const res = await axiosClient.get<ApiQueryRes<MarketingPosition[]>>(
    `/reports/marketing/positions?${q.toString()}`
  );
  return res.data.data;
}
