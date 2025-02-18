import React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

export default function CustomDataGrid(props: Iprops) {
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
      <div style={{ flex: 1,minHeight:'300px'}}>
        <Box sx={{ height: '98%' }}>
          <DataGrid
            loading={props.loading}
            rows={props.rows}
            columns={props.columns}
            getRowId={(row: any) => row._id}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
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
}
