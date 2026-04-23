export type InvoiceStatus = 'Draft' | 'Raised' | 'Paid' | 'Due';
export type PaymentTermsPreset =
  | 'Net 15'
  | 'Net 30'
  | 'Net 45'
  | 'Net 60'
  | 'Custom';

export interface IInvoiceLineItem {
  _id?: string;
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  projectRef: string;
  projectId: string;
  organizationRef: string;
  organizationName: string;
  periodMonth: string;

  lineItems: IInvoiceLineItem[];
  subtotal: number;
  taxLabel?: string;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;

  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  paidOn?: string;
  paymentReference?: string;
  paymentNotes?: string;

  emailedTo: string[];
  /** CC list from the most recent send. The Resend dialog uses this to
   *  rebuild the To/CC split; without it CC addresses would land in the
   *  To field on resend. */
  emailedCc?: string[];
  /** Subject + body from the last send — restored verbatim into the Resend
   *  compose dialog so the operator edits the same message that went out. */
  emailedSubject?: string;
  emailedBody?: string;
  emailedAt?: string;
  dueNotifiedAt?: string;

  pdfUrl?: string;
  notes?: string;
  approvalRef: string;

  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEmailTemplateBlock {
  subject: string;
  heading: string;
  bodyLead: string;
  bodyDetails: string;
  signOff: string;
}

export interface IInvoiceEmailSettings {
  _id: string;
  timesheetApprovalRequest: IEmailTemplateBlock;
  raised: IEmailTemplateBlock;
  due: IEmailTemplateBlock;
  updatedAt: string;
}
