import React, { createContext, useState, useContext } from 'react';

interface iDataGridContext {
  serverSideSearchState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ];
  archiveState: [boolean | undefined, (archive: boolean | undefined) => void];
  disableArchiveBtnState: [boolean, (archive: boolean) => void];
}
const DataGridContext = createContext({
  serverSideSearchState: [false, () => {}],
  archiveState: [false, () => {}],
  disableArchiveBtnState: [false, () => {}],
} as iDataGridContext);

export const DataGridContextProvider = ({
  children,
  archiveState,
}: {
  children: React.ReactNode;
  archiveState?: boolean;
}) => {
  const serverSideSearchState = useState<boolean>(true);
  const disableArchiveBtnState = useState<boolean>(true);
  const iArchiveState = useState<boolean | undefined>(archiveState);
  return (
    <DataGridContext.Provider
      value={{
        archiveState: iArchiveState,
        serverSideSearchState,
        disableArchiveBtnState,
      }}
    >
      {children}
    </DataGridContext.Provider>
  );
};

export const useDataGridContext = () => useContext(DataGridContext);
