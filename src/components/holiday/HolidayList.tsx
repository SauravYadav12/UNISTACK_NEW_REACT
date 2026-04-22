import { useMemo, useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select,
  Stack, Tooltip, Typography, alpha,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import moment from 'moment';
import { toast } from 'react-toastify';

import { Holiday } from '../../Interfaces/holiday';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { deleteHoliday } from '../../services/holidayApi';
import { parseError } from '../../utils/utils';
import { tokens } from '../../theme/theme';
import { dateFormate2 } from '../constants';
import { getDatesBetween } from '../../utils/dateUtil';
import HolidayFormDialog from './HolidayFormDialog';
import ConfirmDialog from '../ui/ConfirmDialog';

type CountryFilter = 'all' | 'IN' | 'US' | 'ALL';

interface Props {
  forAdmin?: boolean;
  defaultYear?: number;
  /**
   * When provided, locks the country filter to this value and hides the
   * country dropdown. Used by the per-country Holidays tabs in
   * Leaves Management so each tab shows only its own region.
   * Accepts 'IN' | 'US' to show that country plus company-wide (ALL) rows.
   */
  lockCountry?: 'IN' | 'US';
  /**
   * When true, the year selector is hidden and the list is locked to the
   * current calendar year. Used on the Holidays tabs in Leaves Management
   * per product decision.
   */
  hideYearSelector?: boolean;
}

const HolidayList = ({ forAdmin, defaultYear, lockCountry, hideYearSelector }: Props) => {
  const { holidayState, removeHoliday } = useHoliday();
  const [year, setYear] = useState<number>(defaultYear ?? new Date().getFullYear());
  const [country, setCountry] = useState<CountryFilter>(lockCountry || 'all');
  const [editing, setEditing] = useState<Holiday | undefined>();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | undefined>();

  // When year is locked, keep state in sync with the actual current year so
  // the list doesn't drift if the component stays mounted past midnight 1 Jan.
  const lockedYear = hideYearSelector ? new Date().getFullYear() : year;

  const all = holidayState.data || [];

  const rows = useMemo(() => {
    return all
      .filter((h) => {
        const y = moment(h.fromDate).year();
        if (y !== lockedYear) return false;
        if (lockCountry) {
          // Region tab: show the locked country + company-wide ones.
          return h.country === lockCountry || h.country === 'ALL';
        }
        if (country !== 'all' && h.country !== country) return false;
        return true;
      })
      .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());
  }, [all, lockedYear, country, lockCountry]);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteHoliday(deleting._id);
      removeHoliday(deleting._id);
      toast.success('Holiday removed');
    } catch (e) {
      toast.error(parseError(e));
      throw e; // keep ConfirmDialog open on failure
    }
  }

  const columns: GridColDef<Holiday>[] = useMemo(() => {
    const cols: GridColDef<Holiday>[] = [
      {
        field: 'name',
        headerName: 'Holiday',
        flex: 1.3, minWidth: 220,
        renderCell: ({ row }) => (
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: tokens.colors.lightText }}>
              {row.name || 'Unnamed'}
            </Typography>
            {row.description && row.description !== row.name && (
              <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'fromDate', headerName: 'Date', width: 180,
        renderCell: ({ row }) => {
          const days = getDatesBetween(row.fromDate, row.toDate).length;
          const isRange = row.fromDate !== row.toDate;
          return (
            <Box>
              <Typography sx={{ fontSize: 12, color: tokens.colors.lightText }}>
                {moment(row.fromDate).format(dateFormate2)}
                {isRange && ` — ${moment(row.toDate).format(dateFormate2)}`}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: tokens.colors.lightTextSecondary }}>
                {days} day{days > 1 ? 's' : ''}
                {row.isHalfDay ? ' · half-day' : ''}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: 'day', headerName: 'Day', width: 130,
        valueGetter: (_v, row) => moment(row.fromDate).format('dddd'),
        renderCell: ({ row }) => {
          const startDow = moment(row.fromDate).format('dddd');
          const endDow = moment(row.toDate).format('dddd');
          const isRange = row.fromDate !== row.toDate;
          const isWeekend = ['Saturday', 'Sunday'].includes(startDow);
          return (
            <Box>
              <Typography sx={{
                fontSize: 12, fontWeight: 600,
                color: isWeekend ? tokens.colors.lightTextSecondary : tokens.colors.lightText,
              }}>
                {startDow}
              </Typography>
              {isRange && (
                <Typography sx={{ fontSize: 10.5, color: tokens.colors.lightTextSecondary }}>
                  to {endDow}
                </Typography>
              )}
              {isWeekend && !isRange && (
                <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary, fontStyle: 'italic' }}>
                  falls on weekend
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'country', headerName: 'Country', width: 110,
        renderCell: ({ row }) => {
          const c = row.country || 'ALL';
          const color =
            c === 'IN' ? tokens.colors.pink :
            c === 'US' ? tokens.colors.blue :
            tokens.colors.lightTextSecondary;
          return (
            <Chip
              label={c}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.1), color,
                fontWeight: 600, fontSize: 10, height: 22,
              }}
            />
          );
        },
      },
    ];
    if (forAdmin) {
      cols.push({
        field: 'actions', headerName: '', width: 110, sortable: false, filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Edit holiday">
              <IconButton size="small" onClick={() => setEditing(row)}>
                <IconPencil size={16} color={tokens.colors.pink} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove holiday">
              <IconButton size="small" onClick={() => setDeleting(row)}>
                <IconTrash size={16} color={tokens.colors.error} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      });
    }
    return cols;
  }, [forAdmin]);

  const yearsInData = Array.from(
    new Set(all.map((h) => moment(h.fromDate).year()))
  ).sort((a, b) => b - a);
  const yearOptions = yearsInData.length
    ? yearsInData
    : [new Date().getFullYear()];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: tokens.colors.lightText }}>
            {lockCountry
              ? (lockCountry === 'IN' ? 'India holidays' : 'US holidays') + ` ${lockedYear}`
              : `Holidays ${lockedYear}`}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary }}>
            {rows.length} holiday{rows.length === 1 ? '' : 's'} shown
            {lockCountry && ' (includes company-wide)'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {!lockCountry && (
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Country</InputLabel>
              <Select value={country} label="Country" onChange={(e) => setCountry(e.target.value as CountryFilter)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="IN">India</MenuItem>
                <MenuItem value="US">USA</MenuItem>
                <MenuItem value="ALL">Company-wide</MenuItem>
              </Select>
            </FormControl>
          )}
          {!hideYearSelector && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {forAdmin && (
            <Button
              variant="contained"
              size="small"
              startIcon={<IconPlus size={16} />}
              onClick={() => setAdding(true)}
              sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
            >
              Add holiday
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ minHeight: 300 }}>
        <DataGrid
          loading={holidayState.loading}
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          getRowHeight={() => 58}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: 'none', fontSize: '0.875rem',
            '& .MuiDataGrid-toolbarContainer': {
              px: 2, py: 1.25, gap: 1,
              bgcolor: '#fff', borderRadius: '12px',
              border: '1px solid', borderColor: 'grey.200',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)', mb: 1.5,
            },
            '& .MuiDataGrid-main': {
              bgcolor: '#fff', borderRadius: '12px 12px 0 0',
              border: '1px solid', borderColor: 'grey.200', borderBottom: 'none',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)', overflow: 'hidden',
            },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#F6F9FC' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8125rem', color: '#2A3547' },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-cell': { px: 2, display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#F6F9FC' },
            '& .MuiDataGrid-footerContainer': {
              bgcolor: '#fff', borderRadius: '0 0 12px 12px',
              border: '1px solid', borderColor: 'grey.200',
              boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
            },
          }}
        />
      </Box>

      {forAdmin && (
        <>
          <HolidayFormDialog
            open={adding}
            onClose={() => setAdding(false)}
            defaultCountry={lockCountry || 'IN'}
          />
          <HolidayFormDialog
            open={!!editing}
            holiday={editing}
            onClose={() => setEditing(undefined)}
          />
          <ConfirmDialog
            open={!!deleting}
            onClose={() => setDeleting(undefined)}
            onConfirm={confirmDelete}
            tone="danger"
            title="Remove this holiday?"
            confirmLabel="Yes, remove"
            cancelLabel="Cancel"
            description={
              deleting ? (
                <>
                  <Box sx={{
                    p: 1.25, borderRadius: 1.5,
                    bgcolor: alpha(tokens.colors.error, 0.05),
                    border: `1px solid ${alpha(tokens.colors.error, 0.2)}`,
                    textAlign: 'left',
                    mb: 1.5,
                  }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.colors.lightText }}>
                      {deleting.name || 'Unnamed holiday'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                      {moment(deleting.fromDate).format(dateFormate2)}
                      {deleting.fromDate !== deleting.toDate && ` — ${moment(deleting.toDate).format(dateFormate2)}`}
                      {' · '}{deleting.country || 'ALL'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Salary calculations going forward will treat this date as a working day. Existing slips already generated for this month are unaffected unless regenerated.
                  </Typography>
                </>
              ) : undefined
            }
          />
        </>
      )}
    </Box>
  );
};

export default HolidayList;
