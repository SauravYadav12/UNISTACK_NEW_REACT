import { useEffect, useState } from 'react';
import { GridPaginationModel } from '@mui/x-data-grid';
import { ApiQueryRes, PaginationInstance } from '../Interfaces/apiRes';
import { AxiosResponse } from 'axios';

export function usePagination(para: ApiQuery, dependencies: any[]) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 100,
  });
  const [gridData, setGridData] = useState<PaginationInstance>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const loadData = async () => {
    let { page, pageSize } = paginationModel;
    page = page + 1;
    try {
      setError('');
      setLoading(true);
      const query =
        (para.queryParams || '') + `&page=${page}&limit=${pageSize}`;
      const { data } = await para.queryFunction(query);
      // searchParams.toString() + `&page=${page}&limit=${pageSize}`
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
    console.log('loading');
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
  };
}

interface ApiQuery {
  queryFunction: (
    query?: string
  ) => Promise<AxiosResponse<ApiQueryRes<PaginationInstance<any>>, any>>;
  queryParams?: string;
}
