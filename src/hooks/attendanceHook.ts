import { useEffect, useState } from 'react';
import { iAttendance, jUser } from '../Interfaces/iUser';
import { getAttendance } from '../services/attendanceApi';
import { dateByUserShift } from '../utils/dateUtil';
import { getJUser } from '../utils/utils';

export function useAttendance(
  para: AttendancePara,
  dependencies?: any[]
): iUseAttendance {
  const defaultDate = dateByUserShift(getJUser()!.shift);
  const { users, fromDate = defaultDate, toDate = defaultDate } = para;
  const [attendance, setAttendance] = useState<iAttendance[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function makeQuery() {
    let q = `fromDate=${fromDate}&toDate=${toDate}`;
    for (const { _id } of users) {
      q = q + `&userRef=${_id}`;
    }
    return q;
  }

  const loadData = async () => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      const { data } = await getAttendance(makeQuery());
      setAttendance(data.data || []);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [...(dependencies || [])]);

  return {
    attendance,
    error,
    loading,
    loadData,
    setResults: setAttendance,
  };
}
export interface iUseAttendance {
  attendance: iAttendance[];
  error: string;
  loading: boolean;
  loadData: () => Promise<void>;
  setResults: React.Dispatch<React.SetStateAction<iAttendance[]>>;
}
interface AttendancePara {
  users: jUser[];
  fromDate?: string;
  toDate?: string;
}
