import React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import Switch from '@mui/material/Switch';
import { FormControlLabel } from '@mui/material';

interface CustomToolbarProps {
  archiveState?: ArchiveState;
}
function CustomToolbar({ archiveState }: CustomToolbarProps) {
  const [checked, cb, prop] = archiveState || [];
  return (
    <GridToolbarContainer>
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
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
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

export default function CustomDataGrid(props: Iprops) {
  const { archiveState } = props;
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
            getRowId={(row: any) => row._id}
            slots={{
              toolbar: () => <CustomToolbar archiveState={archiveState} />,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
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
  header: JSX.Element;
  rows: any[];
  columns: any[];
  archiveState?: ArchiveState;
}
type ArchiveState = [
  boolean,
  (archive: boolean) => void,
  ArchiveStateButtonProps | undefined
];
type ArchiveStateButtonProps = {
  disabled: boolean;
};
