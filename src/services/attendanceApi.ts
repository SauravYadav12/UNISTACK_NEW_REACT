import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { BASE_URL } from './userProfileApi';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  AttendanceStatus,
  iAttendance,
  iUser,
} from '../Interfaces/iUser';
export async function getAttendance(query = '') {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<iAttendance[]>>(
    `${BASE_URL}/attendance?${query}`,

    {
      headers,
    }
  );
  return response;
}
export async function markAttendance(
  user: iUser,
  date:string,
  status: AttendanceStatus
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<ApiQueryRes<iAttendance>>(
    `${BASE_URL}/attendance/`,
    {
      userRef: user._id,
      date,
      status,
    },
    {
      headers,
    }
  );
  return response;
}

export async function updateAttendance(
  attendanceRef: string,
  body: Partial<Omit<iAttendance, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch<ApiQueryRes<iAttendance>>(
    `${BASE_URL}/attendance/${attendanceRef}`,
    {
      ...body,
      ...(body.status && {
        checkIn: body.status === AttendanceStatus.Absent ? '' : new Date(),
      }),
      ...(body.status === AttendanceStatus.Absent && {
        checkOut: '',
        checkIn: '',
      }),
    },
    {
      headers,
    }
  );
  return response;
}
export async function deleteAttendance(id: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/attendance/${id}`,

    {
      headers,
    }
  );
  return response;
}
