import axios from 'axios';
import { ApiQueryRes } from '../Interfaces/apiRes';
import { getJwtToken } from '../utils/utils';
import {
  SupportReport,
  InterviewReport,
  MarketingReport,
} from '../Interfaces/reports';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

export async function getReport<T>(
  type: 'marketing' | 'support' | 'interview',
  fromDate: string,
  toDate: string
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<T>>(
    `${BASE_URL}/reports/${type}?fromDate=${fromDate}&toDate=${toDate}`,
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
