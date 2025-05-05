import React, { createContext, useState, useContext } from 'react';

interface iDataGridContext {
  serverSideSearchState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ];
  archiveState: [boolean | undefined, (archive: boolean | undefined) => void];
  disableArchiveBtnState: [boolean, (archive: boolean) => void];
  filterOptions: FilterOptions[];
  selectedFilterOption?: string;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions[]>>;
  setSelectedFilterOption: React.Dispatch<React.SetStateAction<string>>;
}
const DataGridContext = createContext({
  serverSideSearchState: [false, () => {}],
  archiveState: [false, () => {}],
  disableArchiveBtnState: [false, () => {}],
  filterOptions: [],

  setFilterOptions: () => {},
  setSelectedFilterOption: () => {},
} as iDataGridContext);

export const DataGridContextProvider = ({
  children,
  archiveState,
  filterOptions = [],
}: {
  children: React.ReactNode;
  archiveState?: boolean;
  filterOptions?: FilterOptions[];
}) => {
  const serverSideSearchState = useState<boolean>(true);
  const disableArchiveBtnState = useState<boolean>(true);
  const iArchiveState = useState<boolean | undefined>(archiveState);
  const [ifilterOptions, setiFilterOptions] =
    useState<FilterOptions[]>(filterOptions);
  const [selectedFilterOption, setSelectedFilterOption] = useState('');
  return (
    <DataGridContext.Provider
      value={{
        archiveState: iArchiveState,
        serverSideSearchState,
        disableArchiveBtnState,
        filterOptions: ifilterOptions,
        setFilterOptions: setiFilterOptions,
        setSelectedFilterOption,
        selectedFilterOption,
      }}
    >
      {children}
    </DataGridContext.Provider>
  );
};

export const useDataGridContext = () => useContext(DataGridContext);

interface FilterOptions {
  field: string;
  headerName: string;
}
