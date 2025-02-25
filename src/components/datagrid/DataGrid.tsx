import React, { useState } from 'react';
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
} from '@mui/x-data-grid';
import Switch from '@mui/material/Switch';
import {
  Button,
  FormControlLabel,
  IconButton,
  Typography,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
interface CustomToolbarProps {
  archiveState?: ArchiveState;
}
function CustomToolbar({ archiveState }: CustomToolbarProps) {
  const [checked, cb, prop] = archiveState || [];
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <GridToolbarFilterButton />
      {archiveState && (
        <FormControlLabel
          control={<Switch checked={!!checked} disabled={prop?.disabled} />}
          label={`Archive`}
          onChange={({ target }: any) => cb && cb(target.checked)}
          sx={{
            '& .MuiFormControlLabel-label': {
              fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
              fontWeight: 500,
              fontSize: '0.8125rem',
              lineHeight: 1.75,
              letterSpacing: '0.02857em',
              textTransform: 'uppercase',
              color: '#1976d2',
            },
          }}
        />
      )}

      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarExport
        slotProps={{
          tooltip: { title: 'Export data' },
          button: { variant: 'outlined' },
        }}
      />
    </GridToolbarContainer>
  );
}

const ErrorOverlay = ({ message, retry }: CustomErrorOverlayProps) => {
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
};

export default function CustomDataGrid(props: Iprops) {
  const { archiveState, error, retry, paginateState } = props;
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
            loading={props.loading}
            rows={props.rows}
            columns={props.columns}
            paginationMode="server"
            rowCount={paginateState.totalRows}
            onPaginationModelChange={paginateState.onChange}
            getRowId={(row: any) => row._id}
            slots={{
              toolbar: () => <CustomToolbar archiveState={archiveState} />,
              noRowsOverlay: () =>
                error ? (
                  <ErrorOverlay message={error} retry={retry} />
                ) : (
                  <GridOverlay>Not found</GridOverlay>
                ),
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
              pagination: {
                disabled:props.loading
              },
            }}
            sx={{
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
                color: '#504e4e',
              },
            }}
          />
        </Box>
      </div>
    </div>
  );
}

interface Iprops {
  loading: boolean;
  error: string;
  header: JSX.Element;
  rows: any[];
  columns: any[];
  archiveState?: ArchiveState;
  retry: () => void;
  paginateState: {
    totalRows: number;
    model: GridPaginationModel;
    onChange: (e: GridPaginationModel) => void;
  };
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
