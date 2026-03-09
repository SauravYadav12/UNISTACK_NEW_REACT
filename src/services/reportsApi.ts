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
