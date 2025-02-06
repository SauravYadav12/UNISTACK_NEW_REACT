import axios from 'axios';
import { ApiQueryRes } from '../Interfaces/apiRes';
import { getJwtToken } from '../utils/utils';
import {
  SupportReport,
  InterviewReport,
  MarketingReport,
  DashboardReport,
} from '../Interfaces/reports';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

export async function getReport<T>(
  type: 'marketing' | 'support' | 'interview' | 'dashboard',
  fromDate?: string,
  toDate?: string
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  let query = '';
  if (fromDate) query += `fromDate=${fromDate}&`;
  if (toDate) query += `toDate=${toDate}`;

  const response = await axios.get<ApiQueryRes<T>>(
    `${BASE_URL}/reports/${type}?${query}`,
    {
      headers,
    }
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
