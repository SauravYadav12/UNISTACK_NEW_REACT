import { axiosClient } from '../config/axios.config';


export async function uploadFile(
  file: File,
  bucket?: 'script' 
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<{ data: { url: string } }>(
    `/storage/upload/docn?bucket=${bucket || ''}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}
