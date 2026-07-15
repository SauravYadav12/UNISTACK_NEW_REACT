import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  PulseBucket,
  PulseBundle,
  PulseEmployeeRow,
  PulseGroupBy,
  PulseMetric,
  PulseReqFilter,
  PulseStatusDrilldownReq,
} from '../Interfaces/employeePulse';

export interface EmployeePulseParams {
  userIds: string[];
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  groupBy: PulseGroupBy;
  bucket: PulseBucket;
  metric: PulseMetric;
  reqFilter?: PulseReqFilter;
}

function toQuery(params: EmployeePulseParams): string {
  const sp = new URLSearchParams();
  sp.set('userIds', params.userIds.join(','));
  sp.set('fromDate', params.fromDate);
  sp.set('toDate', params.toDate);
  sp.set('groupBy', params.groupBy);
  sp.set('bucket', params.bucket);
  sp.set('metric', params.metric);
  const f = params.reqFilter || {};
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      sp.set(k, v.join(','));
    } else {
      sp.set(k, String(v));
    }
  }
  return sp.toString();
}

export async function getEmployeePulse(params: EmployeePulseParams) {
  return axiosClient.get<ApiQueryRes<PulseBundle>>(
    `/employee-pulse?${toQuery(params)}`,
  );
}

export async function listPulseEmployees() {
  return axiosClient.get<ApiQueryRes<PulseEmployeeRow[]>>(
    `/employee-pulse/employees`,
  );
}

export interface StatusDrilldownParams {
  userId: string;
  statusKey: string;
  fromDate: string;
  toDate: string;
  reqFilter?: PulseReqFilter;
}

export interface StatusDrilldownResponse {
  window: { from: string; to: string };
  statusKey: string;
  rows: PulseStatusDrilldownReq[];
}

export async function getStatusDrilldown(params: StatusDrilldownParams) {
  const sp = new URLSearchParams();
  sp.set('userId', params.userId);
  sp.set('statusKey', params.statusKey);
  sp.set('fromDate', params.fromDate);
  sp.set('toDate', params.toDate);
  const f = params.reqFilter || {};
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      sp.set(k, v.join(','));
    } else {
      sp.set(k, String(v));
    }
  }
  return axiosClient.get<ApiQueryRes<StatusDrilldownResponse>>(
    `/employee-pulse/status-drilldown?${sp.toString()}`,
  );
}
