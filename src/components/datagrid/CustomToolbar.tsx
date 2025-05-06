import { FormControlLabel, Switch, Box, MenuItem, Select } from '@mui/material';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  moduleKey,
  ModuleGroup,
} from '../../utils/accessControlUtil';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { useDataGridContext } from '../../contextProviders/DataGridContextProvider';

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

export default function CustomToolbar() {
  const { isModuleAllowed } = useAuth();
  const {
    serverSideSearchState,
    archiveState,
    disableArchiveBtnState,
    filterOptions,
    selectedFilterOption,
    setSelectedFilterOption,
  } = useDataGridContext();
  const [serverSideSearch, setServerSideSearch] = serverSideSearchState;
  const [archive, setArchive] = archiveState || [];

  const isArchiveModuleAllowed = Object.values(ArchiveModule).some((m) =>
    isModuleAllowed(moduleKey(ModuleGroup.Archive, m))
  );

  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <GridToolbarFilterButton />
      {isArchiveModuleAllowed && typeof archive === 'boolean' && (
        <FormControlLabel
          control={
            <Switch checked={archive} disabled={disableArchiveBtnState[0]} />
          }
          label={`Archive`}
          onChange={() => setArchive?.(!archive)}
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
      {serverSideSearch && (
        <>
          <Select
            value={selectedFilterOption}
            size="small"
            onChange={(e) => {
              setSelectedFilterOption(e.target.value as any);
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            }}
          >
            {filterOptions.map((o, i) => {
              return (
                <MenuItem key={i} value={o.field}>
                  {o.headerName}
                </MenuItem>
              );
            })}
          </Select>
        </>
      )}
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}
