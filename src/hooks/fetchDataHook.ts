import { useEffect, useState } from 'react';
import { getJUser } from '../utils/utils';

export function useFetchData<T = any>(
  queryFunction: () => Promise<T>,
  dependencies?: any[]
): iFetchData<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    if (loading||!getJUser()) return;
    try {
      setError('');
      setLoading(true);
      const res = await queryFunction();
      setData(res);
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
    data,
    error,
    loading,
    loadData,
    setData,
  };
}
export interface iFetchData<T> {
  data?: T;
  error: string;
  loading: boolean;
  loadData: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T|undefined>>;
}
