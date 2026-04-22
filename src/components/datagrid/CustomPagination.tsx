import { Stack, Typography, Select, MenuItem, Pagination } from '@mui/material';
import { pageSizeList, allDoc } from '../../hooks/paginationHook';
import { PaginateState } from './DataGrid';

interface CustomPaginationProps {
  paginateState: PaginateState;
  loading: boolean;
  currentRowLength: number;
}

export default function CustomPagination({
  paginateState,
  loading,
  currentRowLength,
}: CustomPaginationProps) {
  const { model, totalRows, onChange } = paginateState;
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      spacing={2}
      sx={{
        fontSize: '0.875rem',
        color: '#5A6A85',
        px: 3,
        height: '56px',
      }}
    >
      <Stack direction="row" alignItems="center" flexWrap="wrap">
        <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
          Rows per page:
        </Typography>
        <Select<number>
          disabled={loading}
          value={model.pageSize}
          onChange={({ target }) =>
            onChange({
              ...model,
              pageSize: Number(target.value),
              page: 1,
            })
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
            borderRadius: '8px',
            '&.Mui-selected': {
              bgcolor: '#ECF2FF',
              color: '#5D87FF',
              fontWeight: 600,
            },
          },
        }}
      />
    </Stack>
  );
}
