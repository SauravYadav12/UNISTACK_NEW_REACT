import { FormControlLabel, Box } from '@mui/material';
import type { ReactNode } from 'react';
import { Android12Switch } from '../../pages/Marketing/Profile/constants';
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
  GridFilterOperator,
  gridFilteredSortedRowIdsSelector,
  useGridApiContext,
  GridToolbarProps,
  ToolbarPropsOverrides,
} from '@mui/x-data-grid';
import { useDataGridContext } from '../../contextProviders/DataGridContextProvider';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { dateFormate2 } from '../constants';
import moment, { Moment } from 'moment';
import { SearchOperator } from '../../hooks/paginationHook';

// MUI X module augmentation — declare the extra prop callers can pass
// through `slotProps.toolbar`, so the typed `slotProps.toolbar` block
// in CustomDataGrid accepts our addition without an `as any` cast.
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    /** Optional ReactNode rendered inside the toolbar, between the
     *  built-in actions (Columns / Density / Filters / Archive / Export)
     *  and the QuickFilter search box. Used by pages that need a
     *  page-specific filter chip cluster (e.g. star-colour filter on
     *  the Requirements grid) without each page rolling its own toolbar. */
    toolbarRightSlot?: ReactNode;
  }
}

export default function CustomToolbar({
  setFilterButtonEl,
  toolbarRightSlot,
}: GridToolbarProps & ToolbarPropsOverrides) {
  const apiRef = useGridApiContext();
  const { isModuleAllowed } = useAuth();
  const { archiveState, disableArchiveBtnState } = useDataGridContext();
  const csvOptions = {
    getRowsToExport: () => gridFilteredSortedRowIdsSelector(apiRef),
  };
  const [archive, setArchive] = archiveState || [];

  const isArchiveModuleAllowed = Object.values(ArchiveModule).some((m) =>
    isModuleAllowed(moduleKey(ModuleGroup.Archive, m))
  );

  return (
    <GridToolbarContainer
      sx={{
        '& .MuiButton-root': {
          color: '#5A6A85',
          fontSize: '0.8125rem',
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: '8px',
          px: 1.5,
          '&:hover': {
            bgcolor: '#ECF2FF',
            color: '#5D87FF',
          },
        },
      }}
    >
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <GridToolbarFilterButton ref={setFilterButtonEl} />
      {isArchiveModuleAllowed && typeof archive === 'boolean' && (
        <FormControlLabel
          control={
            <Android12Switch
              checked={archive}
              disabled={disableArchiveBtnState[0]}
            />
          }
          label="Archive"
          onChange={() => setArchive?.(!archive)}
          sx={{
            ml: 0.5,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#5A6A85',
            },
          }}
        />
      )}
      <GridToolbarExport csvOptions={csvOptions} />
      <Box sx={{ flexGrow: 1 }} />

      {/* Page-supplied right-cluster content (renders between the
          flex spacer and the QuickFilter, so it visually sits with
          the search box rather than the built-in toolbar buttons). */}
      {toolbarRightSlot}

      <GridToolbarQuickFilter
        placeholder="Search requirements..."
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
            borderRadius: '8px',
            bgcolor: '#F6F9FC',
            border: '1px solid',
            borderColor: 'grey.200',
            px: 1.5,
            minWidth: 220,
            transition: 'all 0.2s',
            '&:focus-within': {
              borderColor: '#5D87FF',
              bgcolor: '#fff',
              boxShadow: '0 0 0 3px rgba(93, 135, 255, 0.1)',
            },
            '& .MuiInputBase-input': {
              py: 0.75,
              '&::placeholder': {
                color: '#9CA3AF',
                opacity: 1,
              },
            },
            '&::before, &::after': { display: 'none' },
          },
        }}
      />
    </GridToolbarContainer>
  );
}

interface FilterPanelDateInputProps {
  props: {
    item: { id: string; field: string; value?: string };
    applyValue: (item: { id: string; field: string; value?: string }) => void;
  };
}

export function FilterPanelDateInput({ props }: FilterPanelDateInputProps) {
  const { item, applyValue } = props;
  const handleChange = (date: Moment | null) => {
    applyValue({ ...item, value: date?.format(dateFormate2) });
  };
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        value={item.value ? moment(item.value) : null}
        onChange={handleChange}
        format={dateFormate2}
        slotProps={{
          textField: {
            error: !moment(item.value).isValid(),
            helperText: !moment(item.value).isValid() ? 'Invalid date' : '',
            size: 'small',
            sx: {
              '& .MuiOutlinedInput-root': {
                fieldset: { borderColor: 'transparent', borderBottomColor: 'black' },
                '&:hover fieldset': { borderColor: 'white', borderBottomColor: 'black', borderBottomWidth: '2px' },
                '&.Mui-focused fieldset': { borderBottomColor: 'black', borderLeftColor: 'transparent', borderTopColor: 'transparent', borderRightColor: 'transparent' },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}

export const filterOperatorsForDateField: GridFilterOperator[] = [
  {
    label: 'Equals',
    value: SearchOperator.Equals,
    getApplyFilterFn: (filterItem) => {
      if (!filterItem.value) return null;
      return (params) => filterItem.value == params;
    },
    InputComponent: (props) => (
      <Box display="flex" alignItems="flex-end" height="100%">
        <FilterPanelDateInput props={props} />
      </Box>
    ),
  },
];
