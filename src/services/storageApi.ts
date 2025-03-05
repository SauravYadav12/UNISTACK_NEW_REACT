import axios from 'axios';
import { getJwtToken } from '../utils/utils';

const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

export async function uploadFile(file: File, storageType: 'gcp' | '' = '') {
  const formData = new FormData();
  formData.append('file', file);
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'multipart/form-data',
    Authorization: token,
  };
  const response = await axios.post<{ data: { url: string } }>(
    `${BASE_URL}/storage/upload/${storageType}`,
    formData,
    {
      headers,
    }
  );
  return response;
}
