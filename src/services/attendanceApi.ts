import { ApiQueryRes } from '../Interfaces/apiRes';
import { AttendanceStatus, iAttendance, iUser } from '../Interfaces/iUser';
import { axiosClient } from '../config/axios.config';
export async function getAttendance(query = '') {
  const response = await axiosClient.get<ApiQueryRes<iAttendance[]>>(
    `/attendance?${query}`
  );

  return response;
}
export async function markAttendance(
  user: iUser,
  date: string,
  status: AttendanceStatus
) {
  const response = await axiosClient.post<ApiQueryRes<iAttendance>>(
    `/attendance/`,
    {
      userRef: user._id,
      date,
      status,
    }
  );
  return response;
}

export async function updateAttendance(
  attendanceRef: string,
  body: Partial<Omit<iAttendance, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const response = await axiosClient.patch<ApiQueryRes<iAttendance>>(
    `/attendance/${attendanceRef}`,
    {
      ...body,
      ...(body.status && {
        checkIn: body.status === AttendanceStatus.Absent ? '' : new Date(),
      }),
      ...(body.status === AttendanceStatus.Absent && {
        checkOut: '',
        checkIn: '',
      }),
    }
  );
  return response;
}
export async function deleteAttendance(id: string) {
  const response = await axiosClient.delete(`/attendance/${id}`);
  return response;
}
