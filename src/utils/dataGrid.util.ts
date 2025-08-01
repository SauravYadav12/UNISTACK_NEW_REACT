import { v4 as uuidv4 } from 'uuid';
export const separateByDates = (row: any[]) => {
  return row.flatMap((current, index, src) => {
    const currentDate = new Date(current.createdAt);
    const prevDate = index > 0 ? new Date(src[index - 1].createdAt) : null;
    const shouldAddSeparator =
      !prevDate ||
      currentDate.getDate() !== prevDate.getDate() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getFullYear() !== prevDate.getFullYear();
    if (shouldAddSeparator) {
      const ele = {
        dateSeparator: true,
        _id: uuidv4(),
        fromDate: current.createdAt,
      };
      return [ele, current];
    }
    return [current];
  });
};
