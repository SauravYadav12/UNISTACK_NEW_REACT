import { ApiQueryRes } from '../Interfaces/apiRes';
import { Holiday } from '../Interfaces/holiday';
import { axiosClient } from '../config/axios.config';
export async function getHolidays(query = '') {
  const response = await axiosClient.get<ApiQueryRes<Holiday[]>>(
    `/holidays?${query}`
  );
  return response;
}
export async function markHoliday(
  body: Partial<Omit<Holiday, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const response = await axiosClient.post<ApiQueryRes<Holiday>>(
    `/holidays/`,
    body
  );
  return response;
}

export async function updateHoliday(
  id: string,
  body: Partial<Omit<Holiday, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const response = await axiosClient.patch<ApiQueryRes<Holiday>>(
    `/holidays/${id}`,
    body
  );
  return response;
}
export async function deleteHoliday(id: string, notify = false) {
  // `notify=true` tells the server to email all staff that the holiday is
  // cancelled and the office will be open as usual (super-admin opt-in).
  const response = await axiosClient.delete(`/holidays/${id}?notify=${notify}`);
  return response;
}
