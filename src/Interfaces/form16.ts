/**
 * Form-16 module — shared types between admin and employee surfaces.
 */

/** Admin grid + admin create/list responses. */
export interface Form16 {
  _id: string;
  user: string;
  fiscalYearStart: number;
  fiscalYearLabel: string;
  fileUrl: string;
  originalFilename?: string;
  fileSizeBytes?: number;
  employeeName: string;
  employeeId?: string;
  published: boolean;
  publishedAt?: string;
  publishedBy?: string;
  uploadedAt: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Employee-facing list — strict subset, no admin-only fields. */
export interface MyForm16 {
  fiscalYearStart: number;
  fiscalYearLabel: string;
  fileUrl: string;
  originalFilename?: string;
  fileSizeBytes?: number;
  publishedAt?: string;
}

/** Compact list returned by the form16 lookup endpoint, fed into the
 *  filename matcher inside the upload drawer. */
export interface Form16LookupEmployee {
  userId: string;
  name: string;
  email: string;
  employeeId?: string;
  panNumber?: string;
  designation?: string;
}

/** Per-row payload for the bulk endpoint. */
export interface Form16BulkRow {
  userId: string;
  fiscalYearStart: number;
  fileUrl: string;
  originalFilename?: string;
  fileSizeBytes?: number;
}

export interface Form16BulkResult {
  success: Form16[];
  errors: Array<{ index: number; userId?: string; error: string }>;
  publishedImmediately: boolean;
}
