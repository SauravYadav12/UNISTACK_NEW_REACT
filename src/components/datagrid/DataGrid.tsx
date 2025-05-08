import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridOverlay,
  GridPaginationModel,
  GridCallbackDetails,
  GridFilterModel,
  GridColDef,
  GridFilterInputValue,
  GridFilterOperator,
} from '@mui/x-data-grid';
import { IconButton, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CustomToolbar from './CustomToolbar';
import CustomPagination from './CustomPagination';
import {
  DataGridContextProvider,
  useDataGridContext,
} from '../../contextProviders/DataGridContextProvider';

interface iFilterModel {
  model: GridFilterModel;
  details: GridCallbackDetails<'filter'>;
}

function MyDataGrid(props: Iprops) {
  const {
    serverSideSearchState,
    disableArchiveBtnState,
    archiveState: iArchiveState,
  } = useDataGridContext();
  const [serverSideSearch] = serverSideSearchState;
  const [iFilterModel, setiFilterModel] = useState<iFilterModel>();
  const { error, retry, paginateState, onFilterModelChange } = props;

  const [filterButtonEl, setFilterButtonEl] =
    React.useState<HTMLButtonElement | null>(null);

  const columns = useMemo(() => {
    if (serverSideSearch) {
      return props.columns.map((column) => {
        if (!column.filterOperators) {
          const filterOperators: GridFilterOperator<any>[] = [
            {
              value: 'equals',
              label: 'Equals',
              getApplyFilterFn() {
                return () => true;
              },
              InputComponent: GridFilterInputValue,
            },
            {
              value: 'contains',
              label: 'Contains',
              getApplyFilterFn() {
                return () => true;
              },
              InputComponent: GridFilterInputValue,
            },
          ];
          return {
            ...column,
            filterOperators,
          };
        }
        return column;
      });
    }
    return props.columns;
  }, [props.columns, serverSideSearch]);

  useEffect(() => {
    disableArchiveBtnState[1](props.loading);
  }, [props.loading]);

  useEffect(() => {
    iArchiveState[1](props.archiveState?.[0]);
  }, [props.archiveState?.[0]]);

  useEffect(() => {
    props.archiveState?.[1](!!iArchiveState[0]);
  }, [iArchiveState[0]]);

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
              onFilterModelChange?.(model, details, {
                serverSideSearch,
              });
            }}
            loading={props.loading}
            rows={props.rows}
            columns={columns}
            filterMode={serverSideSearch ? 'server' : 'client'}
            paginationMode="server"
            rowCount={paginateState.totalRows}
            getRowId={(row: any) => row._id}
            slots={{
              toolbar: CustomToolbar as any,
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
              panel: {
                anchorEl: filterButtonEl,
              },
              toolbar: {
                setFilterButtonEl,
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

export default function CustomDataGrid(props: Iprops) {
  return (
    <DataGridContextProvider
      archiveState={props.archiveState && props.archiveState[0]}
    >
      <MyDataGrid {...props} />
    </DataGridContextProvider>
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
  columns: readonly iGridColumn[];
  paginateState: PaginateState;
  archiveState?: ArchiveState;
  retry: () => void;
  onFilterModelChange?: (
    model: GridFilterModel,
    details: GridCallbackDetails<'filter'>,
    options: GridFilterOption
  ) => void;
}
export interface PaginateState {
  totalRows: number;
  model: GridPaginationModel;
  onChange: (e: GridPaginationModel) => void;
}
export type ArchiveState = [boolean, (archive: boolean) => void];
export interface GridFilterOption {
  serverSideSearch: boolean;
  // field?: string;
}
interface CustomErrorOverlayProps {
  message: string;
  retry: () => void;
}
export interface iServerFilterOptions {
  serverFilterOptions?: {
    exclude?: boolean;
    validate?: (val?: string) => boolean;
    transform?: (val?: string) => string;
  };
}

export type iGridColumn = GridColDef<any>;
