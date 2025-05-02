import { FormControlLabel, Switch, Box } from '@mui/material';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  moduleKey,
  ModuleGroup,
} from '../../utils/accessControlUtil';
import { ArchiveState } from './DataGrid';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { useEffect, useRef } from 'react';

const formControlSX = {
  '& .MuiFormControlLabel-label': {
    fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
    fontWeight: 500,
    fontSize: '0.8125rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase',
    color: '#1976d2',
  },
};
const cursorPositionKey = 'dataGridCustomToolbarSearchInputLastCursorPosition';

export default function CustomToolbar({
  archiveState,
  serverSideSearchState,
}: CustomToolbarProps) {
  const { isModuleAllowed } = useAuth();
  const [serverSideSearch, setServerSideSearch] = serverSideSearchState;
  const [archive, setArchive, archiveProp] = archiveState || [];

  const quickFilterInputRef = useRef<HTMLInputElement | null>(null);

  const isArchiveModuleAllowed = Object.values(ArchiveModule).some((m) =>
    isModuleAllowed(moduleKey(ModuleGroup.Archive, m))
  );

  const handleInput = (event: any) => {
    // console.log('SET ',event.target.selectionStart)
    event.target.selectionStart >= 0 &&
      localStorage.setItem(cursorPositionKey, event.target.selectionStart);
  };

  useEffect(() => {
    const position = Number(localStorage.getItem(cursorPositionKey));
    if (position >= 0 && quickFilterInputRef.current) {
      // console.log('GET ',position)
      quickFilterInputRef.current.focus();
      quickFilterInputRef.current.selectionStart = position;
      quickFilterInputRef.current.selectionEnd = position;
    }
  }, [quickFilterInputRef.current]);

  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <GridToolbarFilterButton />
      {isArchiveModuleAllowed && archiveState && (
        <FormControlLabel
          control={
            <Switch checked={!!archive} disabled={archiveProp?.disabled} />
          }
          label={`Archive`}
          onChange={({ target }: any) => setArchive?.(target.checked)}
          sx={formControlSX}
        />
      )}
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />

      <FormControlLabel
        control={<Switch checked={serverSideSearch} />}
        label={`Server search`}
        onChange={({ target }: any) =>
          setServerSideSearch(Boolean(target.checked))
        }
        sx={formControlSX}
      />

      <GridToolbarQuickFilter
        onSelect={handleInput}
        inputRef={quickFilterInputRef}
      />
    </GridToolbarContainer>
  );
}

interface CustomToolbarProps {
  archiveState?: ArchiveState;
  serverSideSearchState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ];
}
