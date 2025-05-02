import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridOverlay,
  GridPaginationModel,
  GridCallbackDetails,
  GridFilterModel,
} from '@mui/x-data-grid';
import { IconButton, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CustomToolbar from './CustomToolbar';
import CustomPagination from './CustomPagination';

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
export interface PaginateState {
  totalRows: number;
  model: GridPaginationModel;
  onChange: (e: GridPaginationModel) => void;
}
export type ArchiveState = [
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
