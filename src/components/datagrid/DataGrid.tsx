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
import { SearchOperator } from '../../hooks/paginationHook';

interface iFilterModel {
  model: GridFilterModel;
  details: GridCallbackDetails<'filter'>;
}

type GridRow = Record<string, string | number | boolean | undefined> & {
  _id: string;
  dateSeparator?: boolean;
};

function MyDataGrid(props: Iprops) {
  const { disableArchiveBtnState, archiveState: iArchiveState } =
    useDataGridContext();
  const [_, setiFilterModel] = useState<iFilterModel>();
  const { error, retry, paginateState, onFilterModelChange } = props;
  const [filterButtonEl, setFilterButtonEl] =
    React.useState<HTMLButtonElement | null>(null);

  const columns = useMemo(() => {
    return props.columns.map((column) => {
      if (!column.filterOperators) {
        const filterOperators: GridFilterOperator<GridRow>[] = [
          {
            value: SearchOperator.Equals,
            label: 'Equals',
            getApplyFilterFn() { return () => true; },
            InputComponent: GridFilterInputValue,
          },
          {
            value: SearchOperator.Contains,
            label: 'Contains',
            getApplyFilterFn() { return () => true; },
            InputComponent: GridFilterInputValue,
          },
        ];
        return { ...column, filterOperators };
      }
      return column;
    });
  }, [props.columns]);

  useEffect(() => { disableArchiveBtnState[1](props.loading); }, [props.loading]);
  useEffect(() => { iArchiveState[1](props.archiveState?.[0]); }, [props.archiveState?.[0]]);
  useEffect(() => { props.archiveState?.[1](!!iArchiveState[0]); }, [iArchiveState[0]]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        {props.header}
      </Box>

      {/*
        The toolbar + grid live inside one DataGrid so toolbar buttons
        can access GridApiContext. We style them to look like two
        separate cards by giving the toolbar its own background/radius
        and adding visual separation.
      */}
      <Box
        sx={{
          flex: 1,
          minHeight: 400,
          '& .MuiDataGrid-root': {
            border: 'none',
            bgcolor: 'transparent',
          },
        }}
      >
        <DataGrid
          disableColumnSorting
          isRowSelectable={(params) => !params?.row?.dateSeparator}
          onFilterModelChange={(model, details) => {
            setiFilterModel({ model, details });
            onFilterModelChange?.(model, details);
          }}
          getRowHeight={({ model }) => (model?.dateSeparator ? 36 : 56)}
          loading={props.loading}
          rows={props.rows}
          columns={columns}
          filterMode="server"
          paginationMode="server"
          rowCount={paginateState.totalRows}
          getRowId={(row) => row._id}
          slots={{
            toolbar: CustomToolbar,
            noRowsOverlay: () =>
              error ? (
                <ErrorOverlay message={error} retry={retry} />
              ) : (
                <GridOverlay>
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                </GridOverlay>
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
            panel: { anchorEl: filterButtonEl },
            // Pass page-supplied right-cluster content through to the
            // toolbar (rendered between the spacer and the search box).
            // See `ToolbarPropsOverrides` augmentation in CustomToolbar.tsx.
            toolbar: { setFilterButtonEl, toolbarRightSlot: props.toolbarRightSlot },
          }}
          getRowClassName={(params) =>
            params.row.dateSeparator ? 'date-separator-row' : ''
          }
          sx={{
            border: 'none',
            fontSize: '0.875rem',

            // ── Toolbar — looks like a separate white card ──
            '& .MuiDataGrid-toolbarContainer': {
              px: 2.5,
              py: 1.5,
              gap: 1,
              bgcolor: '#fff',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
              mb: 2,
            },

            // ── Main grid area (headers + rows + footer) — separate card ──
            '& .MuiDataGrid-main': {
              bgcolor: '#fff',
              borderRadius: '12px 12px 0 0',
              border: '1px solid',
              borderColor: 'grey.200',
              borderBottom: 'none',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
              overflow: 'hidden',
            },

            // ── Column headers ──
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F6F9FC',
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              minHeight: '50px !important',
              maxHeight: '50px !important',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: '#2A3547',
              letterSpacing: '0.01em',
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none !important',
            },
            '& .MuiDataGrid-columnHeader': {
              px: 2,
            },

            // ── Rows ──
            '& .MuiDataGrid-row': {
              fontSize: '0.875rem',
              color: '#2A3547',
              '&:hover': {
                bgcolor: '#F6F9FC',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              px: 2,
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none !important',
            },

            // ── Date separator rows ──
            '& .MuiDataGrid-row.date-separator-row': {
              bgcolor: '#ECF2FF',
              borderTop: '2px solid #D6E4FF',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #D6E4FF',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none !important',
              },
            },

            // ── Footer — continues the card look ──
            '& .MuiDataGrid-footerContainer': {
              bgcolor: '#fff',
              borderRadius: '0 0 12px 12px',
              border: '1px solid',
              borderColor: 'grey.200',
              borderTop: '1px solid',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
              minHeight: '56px',
            },

            // ── Scrollbar ──
            '& .MuiDataGrid-scrollbar': {
              scrollbarWidth: 'thin',
            },

            // ── Loading bar ──
            '& .MuiLinearProgress-root': {
              bgcolor: '#ECF2FF',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#5D87FF',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default function CustomDataGrid(props: Iprops) {
  return (
    <DataGridContextProvider archiveState={props.archiveState && props.archiveState[0]}>
      <MyDataGrid {...props} />
    </DataGridContextProvider>
  );
}

function ErrorOverlay({ message, retry }: CustomErrorOverlayProps) {
  return (
    <GridOverlay>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
        <Typography color="error" variant="body2">{message}</Typography>
        <IconButton onClick={retry}><SyncIcon color="primary" /></IconButton>
      </div>
    </GridOverlay>
  );
}

interface Iprops {
  loading: boolean;
  error: string;
  header: JSX.Element | string;
  rows: GridRow[];
  columns: GridColDef[];
  paginateState: PaginateState;
  archiveState?: ArchiveState;
  retry: () => void;
  onFilterModelChange?: (model: GridFilterModel, details: GridCallbackDetails<'filter'>) => void;
  /** Optional content rendered inside the toolbar, between the built-in
   *  buttons and the search box. Used by pages that need a page-specific
   *  filter chip cluster (e.g. star-colour filter on Requirements). */
  toolbarRightSlot?: React.ReactNode;
}
export interface PaginateState {
  totalRows: number;
  model: GridPaginationModel;
  onChange: (e: GridPaginationModel) => void;
}
export type ArchiveState = [boolean, (archive: boolean) => void];
interface CustomErrorOverlayProps { message: string; retry: () => void; }
export interface iServerFilterOptions {
  serverFilterOptions?: { exclude?: boolean; validate?: (val?: string) => boolean; transform?: (val?: string) => string; };
}
