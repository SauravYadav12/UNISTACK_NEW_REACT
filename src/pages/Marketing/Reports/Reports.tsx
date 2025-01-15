import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import CustomAccordion from '../../../components/accordion/CustomAccordion';
import ReportsAccordionContent from './ReportsAccordionContent';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const initialValues = {
  fromDate: null,
  toDate: null,
};

export default function Reports() {
  const [values, setValues] = useState(initialValues);

  const addValue = (key: any, newValue: any) => {
    if (key === 'fromDate') {
      const formattedDate = newValue
        ? dayjs(newValue).format('YYYY-MM-DD')
        : null;
      setValues((prevValues) => ({
        ...prevValues,
        [key]: formattedDate,
      }));
    } else if (key === 'toDate') {
      const formattedDate = newValue
        ? dayjs(newValue).format('YYYY-MM-DD')
        : null;
      setValues((prevValues) => ({
        ...prevValues,
        [key]: formattedDate,
      }));
    } else {
      setValues((prevValues) => ({
        ...prevValues,
        [key]: newValue,
      }));
    }
  };

  return (
    <>
      <div>
        <Box mb={2}>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Grid item sx={{ flexGrow: 1, textAlign: 'left' }}>
              <Typography variant="h6" component="span" fontWeight="bold">
                Reports:
              </Typography>
              <Typography component="span" sx={{ mx: 1 }}>
                From {values.fromDate ? values.fromDate : '____-__-__'}
              </Typography>
              <Typography component="span">
                To {values.toDate ? values.toDate : '____-__-__'}
              </Typography>
              <Box mt={1}>
                <Typography>Total Position: 0</Typography>
              </Box>
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
                  label="From Date"
                  value={values.fromDate ? dayjs(values.fromDate) : null}
                  onChange={(newValue) => addValue('fromDate', newValue)}
                  renderInput={(params) => (
                    <TextField size="small" {...params} />
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
                  label="To Date"
                  value={values.toDate ? dayjs(values.toDate) : null}
                  onChange={(newValue) => addValue('toDate', newValue)}
                  renderInput={(params) => (
                    <TextField size="small" {...params} />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                size="small"
                sx={{
                  marginRight: 1,
                  width: 100,
                  borderRadius: '10px',
                  height: '40px',
                }}
              >
                Generate
              </Button>
            </Grid>
          </Grid>
        </Box>
      </div>
      <div>
        <Box mb={1}>
          <CustomAccordion title="Saurav Yadav">
            <ReportsAccordionContent />
          </CustomAccordion>
        </Box>
        <Box mt={1}>
          <CustomAccordion title="Navendra Yadav">
            <ReportsAccordionContent />
          </CustomAccordion>
        </Box>
      </div>
    </>
  );
}
