import { Box, Grid, Typography, TextField } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
interface DateBarProps {
  fromDate?: string;
  toDate?: string;
  metaText: string;
  addValue: (key: any, newValue: any) => void;
}
const DateBar = ({ fromDate, toDate, metaText, addValue }: DateBarProps) => {
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
                  maxDate={toDate}
                  label="From Date"
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(newValue) => addValue('fromDate', newValue)}
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
                  minDate={fromDate}
                  label="To Date"
                  value={toDate ? dayjs(toDate) : null}
                  onChange={(newValue) => addValue('toDate', newValue)}
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
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DateBar;
