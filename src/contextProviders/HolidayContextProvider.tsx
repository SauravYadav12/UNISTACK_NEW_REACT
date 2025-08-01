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
  function addHoliday(h: Holiday) {
    holidayState.setData((pre) => (pre ? [h, ...pre] : [h]));
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
