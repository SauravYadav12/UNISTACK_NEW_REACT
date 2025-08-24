import { FormControlLabel, Switch, Box, TextField } from '@mui/material';
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
} from '@mui/x-data-grid';
import { useDataGridContext } from '../../contextProviders/DataGridContextProvider';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { dateFormate2 } from '../constants';
import moment, { Moment } from 'moment';
import { SearchOperator } from '../../hooks/paginationHook';

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
interface iProps {
  setFilterButtonEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}
export default function CustomToolbar({ setFilterButtonEl }: iProps) {
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
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <GridToolbarFilterButton ref={setFilterButtonEl}  />
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
      <GridToolbarExport csvOptions={csvOptions} />
      <Box sx={{ flexGrow: 1 }} />

      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

interface FilterPanelDateInputProps {
  props: any;
}

export function FilterPanelDateInput({ props }: FilterPanelDateInputProps) {
  const { item, applyValue } = props;
  const handleChange = (date: Moment) => {
    applyValue({ ...item, value: date.format(dateFormate2) });
  };
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        {...props}
        value={item.value || null}
        onChange={handleChange}
        renderInput={(params) => (
          <TextField
            error={!moment(item.value).isValid()}
            helperText={!moment(item.value).isValid() ? 'Invalid date' : ''}
            size="small"
            {...params}
            sx={{
              '& .MuiOutlinedInput-root': {
                fieldset: {
                  borderColor: 'transparent',
                  borderBottomColor: 'black',
                },
                '&:hover fieldset': {
                  borderColor: 'white',
                  borderBottomColor: 'black',
                  borderBottomWidth: '2px',
                },
                '&.Mui-focused fieldset': {
                  borderBottomColor: 'black',
                  borderLeftColor: 'transparent',
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                },
              },
            }}
          />
        )}
        inputFormat={dateFormate2}
      />
    </LocalizationProvider>
  );
}

export const filterOperatorsForDateField: GridFilterOperator[] = [
  {
    label: 'Equals',
    value: SearchOperator.Equals,
    getApplyFilterFn: (filterItem) => {
      if (!filterItem.value) {
        return null;
      }
      return (params) => {
        return filterItem.value == params;
      };
    },
    InputComponent: (props) => {
      return (
        <Box display={'flex'} alignItems={'flex-end'} height={'100%'}>
          <FilterPanelDateInput props={props} />
        </Box>
      );
    },
  },
];
