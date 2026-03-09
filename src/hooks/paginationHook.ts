import { useEffect, useRef, useState } from 'react';
import { GridFilterModel, GridPaginationModel } from '@mui/x-data-grid';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import axios, { AxiosResponse } from 'axios';

export const allDoc = 100000000;
export const pageSizeList = [100, 500, 1000, 2500, 5000, allDoc];
export const initialPaginationModel: GridPaginationModel = {
  page: 1,
  pageSize: pageSizeList[0] || 100,
};
export const initialSearchModel: GridFilterModel = {
  items: [],
  quickFilterValues: [],
};
export const searchStringKey = 'searchString';
export const searchFieldKey = 'searchField';
export const caseInsensitiveSearchFieldsKey = 'caseInsensitiveFields';

export enum SearchOperator {
  Equals = 'equals',
  Contains = 'contains',
}

export function usePagination(para: ApiQuery, dependencies: unknown[]) {
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
    const results = typeof cb === 'function' ? cb(gridData?.results || []) : cb;
    setGridData((pre) => ({
      ...pre,
      results,
      totalDocuments: results?.length || 0,
    }));
  };

  function createQueryString() {
    const { page, pageSize } = paginationModel;
    const iQuery = para.queryParams || '';
    let queryString = '';
    if (searchModel.items.length) {
      const { operator, field, value } = searchModel.items[0];
      if (value?.toString().trim()) {
        if (operator === SearchOperator.Contains) {
          queryString = `${queryString}&${searchStringKey}=${value}&${searchFieldKey}=${field}`;
        } else if (operator === SearchOperator.Equals) {
          queryString = `${queryString}&${field}=${value}&${caseInsensitiveSearchFieldsKey}=${field}`;
        }
      }
    }

    const searchText = searchModel.quickFilterValues?.join(' ').trim();
    if (searchText) {
      queryString = `${queryString}&${searchStringKey}=${searchText}`;
    }

    queryString = `${queryString}&${iQuery}&page=${page}&limit=${pageSize}`;

    return queryString;
  }

  function handleSetSearchModel(model: GridFilterModel) {
    setSearchModel(model);
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
    setSearchModel: handleSetSearchModel,
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

export type SetResults = React.Dispatch<
  React.SetStateAction<NonNullable<PaginationResult['results']>>
>;
