import { AxiosResponse } from 'axios';
import moment from 'moment';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';

interface iOptions {
  viewDataState: [any, (s: any) => void];
  queryFunction: (
    query?: string
  ) => Promise<AxiosResponse<ApiQueryRes<PaginationResult<any>>, any>>;
  setResults: (cb: (pre: any[]) => any[]) => void;
}
export async function syncDataById(iData: any, options: iOptions) {
  const { _id } = iData;
  const { viewDataState, queryFunction, setResults } = options;
  try {
    const res = await queryFunction(`_id=${_id}`);
    if (!res.data.data?.results?.length) return;
    const uData = res.data.data.results[0];
    if (moment(iData.updatedAt).isSame(uData.updatedAt)) return;
    setResults((pre) => {
      pre = pre.map((item) => {
        if (item._id === uData._id) return uData;
        return item;
      });
      return [...pre];
    });

    if (uData._id === viewDataState[0]?._id) viewDataState[1](uData);
  } catch (error) {
    console.warn('Falied to sync Data ' + _id);
  }
}
