import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  IEmailTemplateBlock,
  IInvoiceEmailSettings,
} from '../Interfaces/invoice';

export async function getInvoiceEmailSettings() {
  return axiosClient.get<ApiQueryRes<IInvoiceEmailSettings>>(
    `/invoice-email-settings`
  );
}

export async function updateInvoiceEmailSettings(payload: Partial<{
  timesheetApprovalRequest: Partial<IEmailTemplateBlock>;
  raised: Partial<IEmailTemplateBlock>;
  due: Partial<IEmailTemplateBlock>;
}>) {
  return axiosClient.patch<ApiQueryRes<IInvoiceEmailSettings>>(
    `/invoice-email-settings`,
    payload
  );
}
