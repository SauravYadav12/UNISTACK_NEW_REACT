import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridOverlay,
  GridPaginationModel,
  GridToolbarQuickFilter,
  GridCallbackDetails,
  GridFilterModel,
} from '@mui/x-data-grid';
import Switch from '@mui/material/Switch';
import {
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { allDoc, pageSizeList } from '../../hooks/paginationHook';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
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

interface iFilterModel {
  model: GridFilterModel;
  details: GridCallbackDetails<'filter'>;
}

export default function CustomDataGrid(props: Iprops) {
  const serverSideSearchState = useState(true);
  const [iFilterModel, setiFilterModel] = useState<iFilterModel>();
  const { archiveState, error, retry, paginateState, onFilterModelChange } =
    props;

  useEffect(() => {
    if (!iFilterModel) return;
    const { model, details } = iFilterModel;
    onFilterModelChange?.(model, details, serverSideSearchState[0]);
  }, [serverSideSearchState[0], archiveState?.[0]]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        alignContent={'center'}
        alignItems={'center'}
      >
        {props.header}
      </Box>
      <div style={{ flex: 1, minHeight: '300px' }}>
        <Box sx={{ height: '98%' }}>
          <DataGrid
            onFilterModelChange={(model, details) => {
              setiFilterModel({ model, details });
              onFilterModelChange?.(model, details, serverSideSearchState[0]);
            }}
            loading={props.loading}
            rows={props.rows}
            columns={props.columns}
            filterMode={serverSideSearchState[0] ? 'server' : 'client'}
            paginationMode="server"
            rowCount={paginateState.totalRows}
            getRowId={(row: any) => row._id}
            slots={{
              toolbar: () => (
                <CustomToolbar
                  serverSideSearchState={serverSideSearchState}
                  archiveState={archiveState}
                />
              ),
              noRowsOverlay: () =>
                error ? (
                  <ErrorOverlay message={error} retry={retry} />
                ) : (
                  <GridOverlay>Not found</GridOverlay>
                ),
            }}
            slotProps={{
              pagination: {
                component: () => (
                  <CustomPagination
                    paginateState={paginateState}
                    loading={props.loading}
                    currentRowLength={props.rows.length}
                  />
                ),
                disabled: props.loading,
              },
            }}
            sx={{
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
                color: '#504e4e',
              },
              '& .MuiDataGrid-scrollbar': {
                scrollbarWidth: 'thin',
              },
            }}
          />
        </Box>
      </div>
    </div>
  );
}
function CustomPagination({
  paginateState,
  loading,
  currentRowLength,
}: CustomPaginationProps) {
  const { model, totalRows, onChange } = paginateState;
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap={'wrap'}
      spacing={2}
      sx={{
        fontSize: '0.875rem',
        color: 'rgba(0, 0, 0, 0.87)',
        padding: '0 16px',
        height: '56px',
        borderTop: '1px solid rgba(224, 224, 224, 1)',
      }}
    >
      <Stack direction="row" alignItems="center" flexWrap={'wrap'}>
        <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
          Rows per page:
        </Typography>
        <Select
          disabled={loading}
          value={model.pageSize}
          onChange={({ target }) =>
            onChange({ ...model, pageSize: parseInt(target.value as string) })
          }
          size="small"
          sx={{
            fontSize: 'inherit',
            color: 'inherit',
            border: 'none',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiSelect-select': { padding: '4px 24px 4px 8px' },
          }}
        >
          {pageSizeList.map((l) => (
            <MenuItem key={l} value={l}>
              {l >= allDoc ? 'All' : l}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
        {(model.page - 1) * model.pageSize + 1}–
        {(model.page - 1) * model.pageSize + currentRowLength} of {totalRows}
      </Typography>

      <Pagination
        disabled={loading}
        count={Math.ceil(totalRows / model.pageSize)}
        page={model.page}
        onChange={(e, page) =>
          page !== model.page && onChange({ ...model, page })
        }
        showFirstButton
        showLastButton
        color="primary"
        size="small"
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: 'inherit',
          },
        }}
      />
    </Stack>
  );
}

function CustomToolbar({
  archiveState,
  serverSideSearchState,
}: CustomToolbarProps) {
  const { isModuleAllowed } = useAuth();
  const [serverSideSearch, setServerSideSearch] = serverSideSearchState;
  const [archive, setArchive, archiveProp] = archiveState || [];

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
        label={`Server filter`}
        onChange={({ target }: any) =>
          setServerSideSearch(Boolean(target.checked))
        }
        sx={formControlSX}
      />

      <GridToolbarQuickFilter autoFocus />
    </GridToolbarContainer>
  );
}

function ErrorOverlay({ message, retry }: CustomErrorOverlayProps) {
  return (
    <GridOverlay>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography color="error">{message}</Typography>
        <IconButton onClick={retry}>
          <SyncIcon color="primary" />
        </IconButton>
      </div>
    </GridOverlay>
  );
}
interface Iprops {
  loading: boolean;
  error: string;
  header: JSX.Element | string;
  rows: any[];
  columns: any[];
  paginateState: PaginateState;
  archiveState?: ArchiveState;
  retry: () => void;
  onFilterModelChange?: (
    model: GridFilterModel,
    details: GridCallbackDetails<'filter'>,
    serverSideSearch: boolean
  ) => void;
}
interface PaginateState {
  totalRows: number;
  model: GridPaginationModel;
  onChange: (e: GridPaginationModel) => void;
}
type ArchiveState = [
  boolean,
  (archive: boolean) => void,
  ArchiveStateButtonProps | undefined
];
type ArchiveStateButtonProps = {
  disabled: boolean;
};

interface CustomErrorOverlayProps {
  message: string;
  retry: () => void;
}
interface CustomPaginationProps {
  paginateState: PaginateState;
  loading: boolean;
  currentRowLength: number;
}

interface CustomToolbarProps {
  archiveState?: ArchiveState;
  serverSideSearchState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ];
}
