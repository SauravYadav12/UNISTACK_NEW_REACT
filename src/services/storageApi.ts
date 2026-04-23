import { axiosClient } from '../config/axios.config';

/**
 * Upload a file to the backend's storage service.
 *
 * The server exposes a small set of dedicated routes per upload kind (each
 * with its own multer file-size and mime-type policy) plus a generic
 * `/upload/docn` route. A `?bucket=<name>` query on `/upload/docn` can
 * redirect writes to a secondary S3 bucket — today that's used for
 * `'script'` uploads so interview-script PDFs don't live in the same
 * bucket as general document uploads.
 *
 *   storageType       HTTP path                       query
 *   ─────────────────────────────────────────────────────────────────────
 *   'docn' (default)  /storage/upload/docn            —
 *   'logo'            /storage/upload/logo            —
 *   'contract'        /storage/upload/contract        —
 *   'invoice'         /storage/upload/invoice         —
 *   'timesheet-...'   /storage/upload/timesheet-...   —
 *   'script'          /storage/upload/docn            ?bucket=script
 *   'gcp'             /storage/upload/gcp             —   (reserved)
 */
export type StorageType =
  | 'gcp'
  | 'docn'
  | 'contract'
  | 'invoice'
  | 'logo'
  | 'timesheet-screenshot'
  | 'script';

export async function uploadFile(
  file: File,
  storageType: StorageType = 'docn',
) {
  const formData = new FormData();
  formData.append('file', file);

  // 'script' uploads hit the generic /upload/docn endpoint but tell the
  // server to use the secondary bucket via ?bucket=script. Everything else
  // maps 1:1 to a dedicated route.
  const path = storageType === 'script' ? 'docn' : storageType;
  const query = storageType === 'script' ? '?bucket=script' : '';

  const response = await axiosClient.post<{ data: { url: string } }>(
    `/storage/upload/${path}${query}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response;
}
