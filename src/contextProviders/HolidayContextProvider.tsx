import React, { createContext, useContext } from 'react';
import { Holiday } from '../Interfaces/holiday';
import { iFetchData, useFetchData } from '../hooks/fetchDataHook';
import { getHolidays } from '../services/holidayApi';
import { initialFetchState } from '../AuthGaurd/AuthContextProvider';

interface iHolidayContext {
  holidayState: iFetchData<Holiday[] | undefined>;
  addHoliday(h: Holiday): void;
  removeHoliday(id: string): void;
}

const HolidayContext = createContext({
  holidayState: initialFetchState,
  addHoliday(h) {},
  removeHoliday(id) {},
} as iHolidayContext);

export const HolidayContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const holidayState = useFetchData(
    async () => (await getHolidays()).data.data
  );
  // Upsert by _id — when the dialog calls this after an EDIT, we want to
  // replace the existing row in place (otherwise the stale copy lingers
  // alongside the updated copy until the next refresh — two rows, same
  // holiday). When called after a CREATE, no _id matches, so we just
  // prepend like before. Single function, both call sites stay correct.
  function addHoliday(h: Holiday) {
    holidayState.setData((pre) => {
      if (!pre) return [h];
      const idx = pre.findIndex((x) => x._id === h._id);
      if (idx === -1) return [h, ...pre];
      const next = pre.slice();
      next[idx] = h;
      return next;
    });
  }
  function removeHoliday(id: string) {
    holidayState.setData((pre) => pre?.filter((h) => h._id !== id));
  }
  return (
    <HolidayContext.Provider
      value={{
        holidayState,
        addHoliday,
        removeHoliday,
      }}
    >
      {children}
    </HolidayContext.Provider>
  );
};

export const useHoliday = () => useContext(HolidayContext);
