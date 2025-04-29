import { useEffect, useState } from 'react';
import { iAttendance, iUser } from '../Interfaces/iUser';
import { getAttendance } from '../services/attendanceApi';
import { dateByUserShift } from '../utils/dateUtil';
import { dateFormate } from '../components/constants';
import { getUserShiftFromToken } from '../utils/utils';
import moment from 'moment';

export function useAttendance(
  para: AttendancePara,
  dependencies?: any[]
): iUseAttendance {
  const shift = getUserShiftFromToken();
  const {
    users,
    fromDate = (shift ? dateByUserShift(shift) : moment()).format(dateFormate),
    toDate = (shift ? dateByUserShift(shift) : moment()).format(dateFormate),
    fetchDataIf = true,
  } = para;
  const [attendance, setAttendance] = useState<iAttendance[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function makeQuery() {
    let q = `fromDate=${fromDate}&toDate=${toDate}`;
    for (const { _id } of users || []) {
      q = q + `&userRef=${_id}`;
    }
    return q;
  }

  const loadData = async () => {
    if (loading || !fetchDataIf || !shift) return;
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
  users?: iUser[];
  fromDate?: string;
  toDate?: string;
  fetchDataIf?: boolean;
}
