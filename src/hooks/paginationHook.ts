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
    // Build segment by segment + join with a single `&`. Previously this
    // function prepended `&` to each segment even when the prefix was
    // empty, producing malformed URLs like `?&&page=1&limit=100` when the
    // search and queryParams were both empty.
    const { page, pageSize } = paginationModel;
    const parts: string[] = [];

    if (searchModel.items.length) {
      const { operator, field, value } = searchModel.items[0];
      if (value?.toString().trim()) {
        if (operator === SearchOperator.Contains) {
          parts.push(`${searchStringKey}=${value}`);
          parts.push(`${searchFieldKey}=${field}`);
        } else if (operator === SearchOperator.Equals) {
          parts.push(`${field}=${value}`);
          parts.push(`${caseInsensitiveSearchFieldsKey}=${field}`);
        }
      }
    }

    const searchText = searchModel.quickFilterValues?.join(' ').trim();
    if (searchText) {
      parts.push(`${searchStringKey}=${searchText}`);
    }

    const iQuery = para.queryParams || '';
    if (iQuery) parts.push(iQuery);

    parts.push(`page=${page}`);
    parts.push(`limit=${pageSize}`);

    return parts.join('&');
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

  // Single fetching effect — picks up every meaningful change. Previously
  // there were three separate effects that all called loadData(), plus the
  // cascading state resets in `[searchModel]` and `[dependencies]` each
  // re-triggered the `[paginationModel]` effect, producing 2-3 redundant
  // requests on mount and every filter change. `para.queryParams` is in
  // the dep array so callers no longer need their own `reload()` effect.
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, searchModel, para.queryParams, ...dependencies]);

  // Reset side-effects — they only mutate state. The fetching effect above
  // picks up the resulting paginationModel/searchModel change and fires
  // exactly once per logical state transition.
  useEffect(() => {
    setPaginationModel(initialPaginationModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchModel]);

  useEffect(() => {
    setPaginationModel(initialPaginationModel);
    setSearchModel(initialSearchModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
