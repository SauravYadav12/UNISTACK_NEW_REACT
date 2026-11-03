import { axiosClient } from '../config/axios.config';
import { Pip, PipReason } from '../Interfaces/pip';

type Data<T> = { data: T };

export interface CreatePipPayload {
  employeeRef: string;
  reasons: PipReason[];
  otherReason?: string;
  emailSubject: string;
  emailBody: string;
  send?: boolean;
}

export async function listPips(status?: string): Promise<Pip[]> {
  const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await axiosClient.get<Data<Pip[]>>(`/pip${q}`);
  return res.data.data;
}

export async function previewPipDraft(payload: {
  employeeRef?: string;
  reasons: PipReason[];
  otherReason?: string;
}): Promise<{ subject: string; body: string }> {
  const res = await axiosClient.post<Data<{ subject: string; body: string }>>(
    `/pip/preview`,
    payload
  );
  return res.data.data;
}

export async function createPip(payload: CreatePipPayload): Promise<Pip> {
  const res = await axiosClient.post<Data<Pip>>(`/pip`, payload);
  return res.data.data;
}

export async function updatePip(
  id: string,
  patch: Partial<Pick<CreatePipPayload, 'reasons' | 'otherReason' | 'emailSubject' | 'emailBody'>>
): Promise<Pip> {
  const res = await axiosClient.patch<Data<Pip>>(`/pip/${id}`, patch);
  return res.data.data;
}

export async function sendPip(id: string): Promise<Pip> {
  const res = await axiosClient.post<Data<Pip>>(`/pip/${id}/send`);
  return res.data.data;
}

export async function extendPip(id: string, days: number): Promise<Pip> {
  const res = await axiosClient.post<Data<Pip>>(`/pip/${id}/extend`, { days });
  return res.data.data;
}

export async function resolvePip(
  id: string,
  outcome: 'successful' | 'failed',
  note?: string
): Promise<Pip> {
  const res = await axiosClient.post<Data<Pip>>(`/pip/${id}/resolve`, {
    outcome,
    note,
  });
  return res.data.data;
}

export async function deletePip(id: string): Promise<void> {
  await axiosClient.delete(`/pip/${id}`);
}
