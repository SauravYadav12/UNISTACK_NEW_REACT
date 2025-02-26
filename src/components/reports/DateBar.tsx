import { Box, Grid, Typography, TextField, IconButton } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SyncIcon from '@mui/icons-material/Sync';
import { dateFormate } from '../constants';

interface DateBarProps {
  fromDate?: string;
  toDate?: string;
  metaText: string;
  loading: boolean;
  onDateChange: (key: any, newValue: any) => void;
  reload?: () => void;
}
const DateBar = ({
  fromDate,
  toDate,
  metaText,
  loading,
  onDateChange,
  reload,
}: DateBarProps) => {
  return (
    <div>
      <Box mt={1} mb={5}>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          rowGap={'15px'}
        >
          <Grid item sx={{ textAlign: 'left' }}>
            <Typography component="span" sx={{ mr: 1 }}>
              From
            </Typography>
            <Typography component="span">{fromDate || '____-__-__'}</Typography>
            <Typography component="span" sx={{ mx: 1 }}>
              To
            </Typography>
            <Typography component="span">{toDate || '____-__-__'}</Typography>
            <Box mt={0}>
              <Typography>{metaText}</Typography>
            </Box>
          </Grid>

          <Grid item sx={{ display: 'flex', rowGap: '15px', flexWrap: 'wrap' }}>
            <Grid
              item
              sx={{
                width: 190,
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  inputFormat={dateFormate}
                  maxDate={toDate}
                  label="From Date"
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(newValue) => onDateChange('fromDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      size="small"
                      {...params}
                      error={!fromDate || !dayjs(fromDate).isValid()}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid
              item
              sx={{
                width: 190,
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  inputFormat={dateFormate}
                  minDate={fromDate}
                  label="To Date"
                  value={toDate ? dayjs(toDate) : null}
                  onChange={(newValue) => onDateChange('toDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      size="small"
                      {...params}
                      error={!toDate || !dayjs(toDate).isValid()}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            {!!reload && (
              <IconButton onClick={reload} disabled={loading}>
                <SyncIcon
                  className={loading ? 'sync-icon-loading' : ''}
                  color="primary"
                />
              </IconButton>
            )}
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DateBar;
