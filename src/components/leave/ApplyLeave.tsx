import React, { useState } from 'react';
import { TextField, Button, Grid, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import axios from 'axios';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import moment, { Moment } from 'moment';
import { dateFormate2 } from '../constants';
// import { format } from 'date-fns';

enum iLeaveType {
  FullDay = 'FullDay',
  HalfDay = 'HalfDay',
}

const ApplyLeave = () => {
  const [startDate, setStartDate] = useState<Moment | null>(null);
  const [endDate, setEndDate] = useState<Moment | null>(null);
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<iLeaveType>(iLeaveType.FullDay);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // setSuccessMessage('');
    // setErrorMessage('');

    // Replace with the actual employee ID (you might get this from context/auth)
    const employeeId = '646f7e1a9a7b8c1c2d3e4f5f'; // Example ID

    if (!startDate || !endDate || !reason) {
      // setErrorMessage(
      //   'Please select a start and end date and provide a reason.'
      // );
      return;
    }

    if (endDate < startDate) {
      // setErrorMessage('End date cannot be before start date.');
      return;
    }

    try {
      //   const response = await axios.post('http://localhost:5000/api/leaves', {
      //     employeeId,
      //     startDate: format(startDate, 'yyyy-MM-dd'),
      //     endDate: format(endDate, 'yyyy-MM-dd'),
      //     reason,
      //   });
      // setSuccessMessage('Leave application submitted successfully!');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } catch (error) {
      //   setErrorMessage(error.response?.data?.message || 'Failed to submit leave application.');
      console.error('Error applying for leave:', error);
    }
  };

  return (
    <ChartCardWrapper
      title="Apply for Leave"
      subtitle={
        (startDate?.format(dateFormate2) || '____//____') +
        ' to ' +
        (endDate?.format(dateFormate2) || '____//____')
      }
      action={
        <Select
          value={leaveType}
          size="small"
          onChange={(e) => {
            setLeaveType(e.target.value as any);
          }}
        >
          {Object.values(iLeaveType).map((o, i) => {
            return (
              <MenuItem key={i} value={o}>
                {o.replace('Day', ' Day')}
              </MenuItem>
            );
          })}
        </Select>
      }
    >
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1} alignItems="center" sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                maxDate={endDate}
                minDate={moment()}
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                minDate={startDate}
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Reason for Leave"
              multiline
              rows={4}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              // sx={{ mt: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              // sx={{ mt: 2 }}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </form>
    </ChartCardWrapper>
  );
};

export default ApplyLeave;
