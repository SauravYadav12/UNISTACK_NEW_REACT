import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import { iAccessControl } from '../utils/accessControlUtil';

export async function getAccessControl() {
  const url = `/access-control`;
  const response = await axiosClient.get<ApiQueryRes<iAccessControl>>(url);
  return response;
}
export async function updateAccessControl(
  id: string,
  values: Partial<iAccessControl>
) {
  const response = await axiosClient.patch<ApiQueryRes<iAccessControl>>(
    `/access-control/${id}`,
    values
  );
  return response;
}
