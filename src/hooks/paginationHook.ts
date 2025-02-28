import { useEffect, useState } from 'react';
import { GridPaginationModel } from '@mui/x-data-grid';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { AxiosResponse } from 'axios';

export const pageSizeList = [100, 500, 1000, 5000];
export const initialPaginationModel: GridPaginationModel = {
  page: 1,
  pageSize: pageSizeList[0] || 100,
};

export function usePagination(para: ApiQuery, dependencies: any[]) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
    initialPaginationModel
  );
  const [gridData, setGridData] = useState<PaginationResult>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const setResults: SetResults = (cb) => {
    const results = cb(gridData?.results || []);
    setGridData((pre) => ({ ...pre, results, totalDocuments: results.length }));
  };

  const loadData = async () => {
    if (loading) return;
    let { page, pageSize } = paginationModel;
    try {
      setError('');
      setLoading(true);
      const query =
        (para.queryParams || '') + `&page=${page}&limit=${pageSize}`;
      const { data } = await para.queryFunction(query);
      setGridData(data.data);
    } catch (error) {
      setGridData({});
      console.error('Error fetching requirements:', error);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paginationModel]);

  useEffect(() => {
    setPaginationModel({ page: 1, pageSize: pageSizeList[0] });
  }, [...dependencies]);

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
