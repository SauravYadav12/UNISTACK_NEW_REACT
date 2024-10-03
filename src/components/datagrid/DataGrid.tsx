
import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

export default function CustomDataGrid(props: any) {
  const [rows, setRows] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  React.useEffect(() => {
    if (Array.isArray(props.columns)) {
      setColumns(props.columns);
      setRows(props.rows);
    }
  }, [props.columns]);
  return (
    <Box sx={{ height: 500, width: 0.98, pr: 5 }}>
      <DataGrid
        rows={rows}
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true
          }
        }}
      />
    </Box>
  );
}