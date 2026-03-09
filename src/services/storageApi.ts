import { axiosClient } from '../config/axios.config';

export async function uploadFile(
  file: File,
  storageType: 'gcp' | 'docn' = 'docn'
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<{ data: { url: string } }>(
    `/storage/upload/${storageType}`,
    formData
  );
  return response;
}
