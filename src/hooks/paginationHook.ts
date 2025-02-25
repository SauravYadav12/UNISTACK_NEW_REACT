import { useEffect, useState } from 'react';
import { GridPaginationModel } from '@mui/x-data-grid';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { AxiosResponse } from 'axios';

export function usePagination(para: ApiQuery, dependencies: any[]) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 100,
  });
  const [gridData, setGridData] = useState<PaginationResult>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const setResults: SetResults = (cb) => {
    const results = cb(gridData?.results || []);
    setGridData((pre) => ({ ...pre, results }));
  };

  const loadData = async () => {
    if (loading) return;
    let { page, pageSize } = paginationModel;
    page = page + 1;
    console.log('loading');
    try {
      setError('');
      setLoading(true);
      const query =
        (para.queryParams || '') + `&page=${page}&limit=${pageSize}`;
      const { data } = await para.queryFunction(query);
      setGridData(data.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [...dependencies, paginationModel]);

  return {
    error,
    loading,
    gridData,
    paginationModel,
    setPaginationModel,
    setGridData,
    setError,
    setLoading,
    reload: loadData,
    setResults,
  };
}

interface ApiQuery {
  queryFunction: (
    query?: string
  ) => Promise<AxiosResponse<ApiQueryRes<PaginationResult<any>>, any>>;
  queryParams?: string;
}

export type SetResults = <T = any>(cb: (pre: T[]) => T[]) => void;
