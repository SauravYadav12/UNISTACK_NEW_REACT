import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { IInvoice, IInvoiceLineItem } from '../Interfaces/invoice';

export async function invoicesList(query: string = '', signal?: AbortSignal) {
  return axiosClient.get<ApiQueryRes<PaginationResult<IInvoice>>>(
    `/invoices/get-invoices?${query}`,
    { signal }
  );
}

export async function getInvoice(id: string) {
  return axiosClient.get<ApiQueryRes<IInvoice>>(`/invoices/${id}`);
}

export async function updateInvoice(
  id: string,
  payload: Partial<{
    lineItems: IInvoiceLineItem[];
    taxPercent: number;
    taxLabel: string;
    notes: string;
    currency: string;
    /** Admin / super-admin only — silently ignored server-side for others. */
    invoiceNumber: string;
    /** Admin / super-admin only — YYYY-MM-DD. */
    issueDate: string;
  }>
) {
  return axiosClient.patch<ApiQueryRes<IInvoice>>(`/invoices/${id}`, payload);
}

export async function raiseInvoice(
  id: string,
  payload: {
    issueDate?: string;
    to?: string[];
    cc?: string[];
    subject?: string;
    body?: string;
    pdfUrl?: string;
  }
) {
  return axiosClient.post<ApiQueryRes<IInvoice>>(
    `/invoices/${id}/raise`,
    payload
  );
}

/**
 * Admin override: create a Draft invoice without the approval handshake.
 * Returns the newly created invoice. 409 if one already exists for that month.
 */
export async function generateInvoiceOverride(
  projectRef: string,
  periodMonth: string
) {
  return axiosClient.post<ApiQueryRes<IInvoice>>(`/invoices/generate-override`, {
    projectRef,
    periodMonth,
  });
}

export async function markInvoicePaid(
  id: string,
  payload: {
    paidOn: string;
    paymentReference?: string;
    paymentNotes?: string;
  }
) {
  return axiosClient.post<ApiQueryRes<IInvoice>>(
    `/invoices/${id}/mark-paid`,
    payload
  );
}

export async function markInvoiceUnpaid(id: string) {
  return axiosClient.post<ApiQueryRes<IInvoice>>(
    `/invoices/${id}/mark-unpaid`
  );
}

/**
 * Resend the invoice email. The compose dialog gathers the full payload
 * (To/CC chips, edited subject + body, freshly-rendered PDF URL) so the
 * server doesn't need to reach back into the project's recipient flags.
 *
 * `recipientOverride` is kept as a deprecated alias for `to` so any direct
 * API tooling that pre-dates the dialog continues to work.
 */
export async function resendInvoiceEmail(
  id: string,
  payload?: {
    to?: string[];
    cc?: string[];
    subject?: string;
    body?: string;
    pdfUrl?: string;
    /** @deprecated pass `to` instead. */
    recipientOverride?: string[];
  }
) {
  return axiosClient.post<ApiQueryRes<IInvoice>>(
    `/invoices/${id}/resend-email`,
    payload || {}
  );
}

export async function deleteInvoice(id: string) {
  return axiosClient.delete<ApiQueryRes<IInvoice>>(`/invoices/${id}`);
}
