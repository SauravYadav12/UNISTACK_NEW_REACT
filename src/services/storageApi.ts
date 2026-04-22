import { axiosClient } from '../config/axios.config';


export async function uploadFile(
  file: File,
  storageType:
    | 'gcp'
    | 'docn'
    | 'contract'
    | 'invoice'
    | 'logo'
    | 'timesheet-screenshot' = 'docn'
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<{ data: { url: string } }>(
    `/storage/upload/${storageType}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}
