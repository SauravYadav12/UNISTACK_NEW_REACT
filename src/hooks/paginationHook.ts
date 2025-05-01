import { useEffect, useRef, useState } from 'react';
import { GridFilterModel, GridPaginationModel } from '@mui/x-data-grid';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import axios, { AxiosResponse } from 'axios';

export const allDoc = 100000000;
export const pageSizeList = [100, 500, 1000, 5000, allDoc];
export const initialPaginationModel: GridPaginationModel = {
  page: 1,
  pageSize: pageSizeList[0] || 100,
};
export const initialSearchModel: GridFilterModel = {
  items: [],
  quickFilterValues: [],
};
export const searchStringKey = 'searchString';
export function usePagination(para: ApiQuery, dependencies: any[]) {
  const [searchModel, setSearchModel] =
    useState<GridFilterModel>(initialSearchModel);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
    initialPaginationModel
  );
  const [gridData, setGridData] = useState<PaginationResult>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const setResults: SetResults = (cb) => {
    const results = cb(gridData?.results || []);
    setGridData((pre) => ({ ...pre, results, totalDocuments: results.length }));
  };

  function createQueryString() {
    let { page, pageSize } = paginationModel;
    let queryString = '';
    searchModel.quickFilterValues?.forEach((v) => {
      queryString = queryString + '&' + searchStringKey + '=' + v;
    });

    queryString =
      queryString +
      '&' +
      (para.queryParams || '') +
      `&page=${page}&limit=${pageSize}`;
    console.log({ queryString });
    return queryString;
  }

  const loadData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setError('');
      setLoading(true);
      const query = createQueryString();
      const { data } = await para.queryFunction(query, signal);
      setGridData(data.data);
      setLoading(false);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      } else {
        setGridData({});
        console.error('Error fetching requirements:', error);
        setError('Failed to load');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [paginationModel]);

  useEffect(() => {
    loadData();
    setPaginationModel(initialPaginationModel);
    console.log('changed');
  }, [searchModel]);

  useEffect(() => {
    loadData();
    setPaginationModel(initialPaginationModel);
    setSearchModel(initialSearchModel);
  }, [...dependencies]);

  return {
    error,
    loading,
    gridData,
    paginationModel,
    searchModel,
    setSearchModel,
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
    query?: string,
    signal?: AbortSignal
  ) => Promise<AxiosResponse<ApiQueryRes<PaginationResult<any>>, any>>;
  queryParams?: string;
}

export type SetResults = <T = any>(cb: (pre: T[]) => T[]) => void;
