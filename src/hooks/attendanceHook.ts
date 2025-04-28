import { useEffect, useState } from 'react';
import { iAttendance, iUser } from '../Interfaces/iUser';
import { getAttendance } from '../services/attendanceApi';
import { dateByUserShift } from '../utils/dateUtil';
import { dateFormate } from '../components/constants';
import moment from 'moment';
import { useAuth } from '../AuthGaurd/AuthContextProvider';

export function useAttendance(
  para: AttendancePara,
  dependencies?: any[]
): iUseAttendance {
  const me = useAuth().iUser;
  const defaultDate = me
    ? dateByUserShift(me.shift).format(dateFormate)
    : moment().format(dateFormate);
  const {
    users,
    fromDate = defaultDate,
    toDate = defaultDate,
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
    if (loading || !fetchDataIf || !me) return;
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
