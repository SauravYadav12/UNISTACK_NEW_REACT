import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import moment from 'moment';
import { dateFormate } from '../constants';
import {
  CreateLeavePayload,
  HalfDayType,
  iLeave,
  LeaveType,
} from '../../Interfaces/leaves';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  isFieldValid,
  validateAllFields,
  ValidationMeta,
} from '../../utils/validators';
import { toast } from 'react-toastify';
import { createLeave } from '../../services/leavesApi';

enum iFormType {
  FullDay = 'FullDay',
  HalfDay = 'HalfDay',
}

interface iProps {
  onApplied?: (l: iLeave) => void;
}

const ApplyLeave = ({ onApplied }: iProps) => {
  const validationMeta: ValidationMeta[] = [
    {
      field: 'userRef',
      required: true,
    },
    {
      field: 'startDate',
      required: true,
    },
    {
      field: 'endDate',
      required: true,
    },
    {
      field: 'reason',
      required: true,
    },
  ];

  const { iUser } = useAuth();

  const initial: CreateLeavePayload = {
    userRef: iUser?._id || '',
    name: iUser ? iUser.firstName + ' ' + iUser.lastName : '',
    startDate: '',
    endDate: '',
    reason: '',
    type: LeaveType.CasualLeave,
    isHalfDay: false,
    halfDayType: undefined,
  };
  const [formType, setFormType] = useState<iFormType>(iFormType.FullDay);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [values, setValues] = useState<CreateLeavePayload>({ ...initial });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = validateAllFields(validationMeta, values, setErrors);
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const payload = { ...values };
      if (!payload.halfDayType) delete payload.halfDayType;
      const { data } = await createLeave(payload);
      data.data && onApplied?.(data.data);
      setValues({ ...initial });
      setErrors({});
      toast.success('Applied successfully');
    } catch (error) {
      console.error('Error applying for leave:', error);
      toast.error('Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  function handleChange(field: string, value: string | boolean) {
    const meta = validationMeta.find((m) => m.field === field);
    if (meta) {
      if (errors[field] && isFieldValid(meta, value)) {
        setErrors((pre) => ({ ...pre, [field]: '' }));
      }
      if (meta.transform) {
        value = meta.transform(value);
      }
    }

    setValues((pre) => ({ ...pre, [field]: value }));
  }

  const onBlur = (key: string) => {
    const meta = validationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, (values as any)[key], setErrors);
  };

  useEffect(() => {
    if (iUser) {
      handleChange('userRef', iUser._id);
      handleChange('name', iUser.firstName + ' ' + iUser.lastName);
    }
    if (formType === iFormType.HalfDay) {
      handleChange('isHalfDay', true);
      handleChange('halfDayType', HalfDayType.FirstHalf);
      handleChange('endDate', values.startDate);
    } else {
      handleChange('isHalfDay', false);
      handleChange('halfDayType', '');
    }
  }, [iUser, formType]);

  function CardSubtitle() {
    const { startDate, endDate } = values;
    if (!startDate && !endDate) return '____//____';
    return (
      <>
        {startDate === endDate ? (
          startDate
        ) : (
          <>
            {startDate || (endDate && '____//____')}
            {endDate && ' to ' + endDate}
          </>
        )}
      </>
    );
  }

  return (
    <ChartCardWrapper
      title="Apply for Leave"
      subtitle={<CardSubtitle />}
      action={
        <Select
          disabled={loading}
          value={formType}
          size="small"
          onChange={(e) => {
            setFormType(e.target.value as any);
          }}
        >
          {Object.values(iFormType).map((o, i) => {
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
        <Grid
          container
          columnSpacing={1}
          rowSpacing={2}
          alignItems="start"
          sx={{ mt: 3 }}
        >
          {!values.isHalfDay ? (
            <>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    disabled={loading}
                    inputFormat={dateFormate}
                    maxDate={moment(values.endDate)}
                    minDate={moment()}
                    label="Start Date"
                    value={values.startDate ? moment(values.startDate) : null}
                    onChange={(newValue) =>
                      handleChange(
                        'startDate',
                        newValue ? newValue.format(dateFormate) : ''
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        disabled={loading}
                        size="small"
                        {...params}
                        fullWidth
                        onBlur={() => onBlur('startDate')}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    disabled={loading}
                    inputFormat={dateFormate}
                    minDate={moment(values.startDate)}
                    label="End Date"
                    value={values.endDate ? moment(values.endDate) : null}
                    onChange={(newValue) =>
                      handleChange(
                        'endDate',
                        newValue ? newValue.format(dateFormate) : ''
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        disabled={loading}
                        size="small"
                        {...params}
                        fullWidth
                        onBlur={() => onBlur('endDate')}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    disabled={loading}
                    inputFormat={dateFormate}
                    minDate={moment()}
                    label="Date"
                    value={values.startDate ? moment(values.startDate) : null}
                    onChange={(newValue) => {
                      handleChange(
                        'startDate',
                        newValue ? newValue.format(dateFormate) : ''
                      );
                      handleChange(
                        'endDate',
                        newValue ? newValue.format(dateFormate) : ''
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        disabled={loading}
                        size="small"
                        {...params}
                        fullWidth
                        onBlur={() => {
                          onBlur('startDate');
                          onBlur('endDate');
                        }}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  disabled={loading}
                  fullWidth
                  value={values.halfDayType || ''}
                  size="small"
                  onChange={(e) => {
                    handleChange('halfDayType', e.target.value as any);
                  }}
                >
                  {Object.values(HalfDayType).map((o, i) => {
                    return (
                      <MenuItem key={i} value={o}>
                        {o}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={4}>
            <Select
              disabled={loading}
              fullWidth
              value={values.type}
              size="small"
              onChange={(e) => {
                handleChange('type', e.target.value as any);
              }}
            >
              {Object.values(LeaveType).map((o, i) => {
                return (
                  <MenuItem key={i} value={o}>
                    {o}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
          <Grid item xs={12}>
            <TextField
              disabled={loading}
              onBlur={() => onBlur('reason')}
              label="Reason for Leave"
              multiline
              minRows={4}
              maxRows={10}
              fullWidth
              error={!!errors.reason}
              helperText={errors.reason}
              value={values.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
            />
          </Grid>
          <Grid container item xs={12} justifyContent={'flex-end'}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  In Progress <CircularProgress sx={{ ml: 2 }} size={15} />
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </ChartCardWrapper>
  );
};

export default ApplyLeave;
