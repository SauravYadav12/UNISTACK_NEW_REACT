import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  ChessLead,
  ChessLeadListResponse,
  ChessLeadLog,
  ChessLeadPayload,
  ChessLeadStats,
} from '../Interfaces/chessLead';

export async function listChessLeads(query: string = '') {
  return axiosClient.get<ApiQueryRes<ChessLeadListResponse>>(
    `/chess-leads?${query}`
  );
}

export async function getChessLead(id: string) {
  return axiosClient.get<ApiQueryRes<ChessLead>>(`/chess-leads/${id}`);
}

export async function createChessLead(payload: ChessLeadPayload) {
  return axiosClient.post<ApiQueryRes<ChessLead>>(`/chess-leads`, payload);
}

export async function updateChessLead(id: string, payload: ChessLeadPayload) {
  return axiosClient.patch<ApiQueryRes<ChessLead>>(`/chess-leads/${id}`, payload);
}

export async function deleteChessLead(id: string) {
  return axiosClient.delete<ApiQueryRes<ChessLead>>(`/chess-leads/${id}`);
}

export async function getChessLeadStats() {
  return axiosClient.get<ApiQueryRes<ChessLeadStats>>(`/chess-leads/stats`);
}

export async function getChessLeadLogs(leadRef: string) {
  return axiosClient.get<ApiQueryRes<ChessLeadLog[]>>(
    `/chess-leads/logs?leadRef=${leadRef}`
  );
}

/**
 * Client-fired audit entry for update / delete. Server writes a
 * create-log automatically (it owns the newly-minted leadRef).
 */
export async function createChessLeadLog(payload: {
  leadRef: string;
  leadId: string;
  operation: 'update' | 'delete';
  userName: string;
  userRef: string;
  oldData?: Partial<ChessLead>;
  newData?: Partial<ChessLead>;
}) {
  return axiosClient.post<ApiQueryRes<ChessLeadLog>>(
    `/chess-leads/logs`,
    payload
  );
}
