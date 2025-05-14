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
            onChange({
              ...model,
              pageSize: parseInt(target.value as string),
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
          },
        }}
      />
    </Stack>
  );
}
