import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Moment } from 'moment';
import { dateFormate, dateFormate2 } from '../constants';
import { toast } from 'react-toastify';
import { markHoliday } from '../../services/holidayApi';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { isHolidayMarked } from '../../utils/holidayUtil';
import { parseError } from '../../utils/utils';

type HolidayFormValues = {
  name: string;
  description: string;
  fromDate: Moment | null;
  toDate: Moment | null;
};

interface iProps {
  onClose: () => void;
}

const HolidayForm = ({ onClose }: iProps) => {
  const { addHoliday, holidayState } = useHoliday();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<HolidayFormValues>({
    name: '',
    description: '',
    fromDate: null,
    toDate: null,
  });

  const isHoliday = useMemo(() => {
    if (!formValues.fromDate && !formValues.toDate) return;
    return isHolidayMarked(
      holidayState.data || [],
      formValues.fromDate?.format(dateFormate),
      formValues.toDate?.format(dateFormate)
    );
  }, [formValues.fromDate, formValues.toDate]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validationRules = {
    name: (value: string) => (!value.trim() ? 'Holiday name is required' : ''),
    fromDate: (value: Moment | null) =>
      !value ? 'Start date is required' : '',
    toDate: (value: Moment | null) =>
      value && formValues.fromDate && value.isBefore(formValues.fromDate)
        ? 'End date cannot be before start date'
        : '',
  };

  const validateField = (name: string, value: any) => {
    if (validationRules[name as keyof typeof validationRules]) {
      const error =
        validationRules[name as keyof typeof validationRules](value);
      setErrors((prev) => ({ ...prev, [name]: error }));
      return !error;
    }
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, validate]) => {
      const error = validate(
        formValues[field as keyof HolidayFormValues] as any
      );
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !formValues.fromDate) return;

    try {
      setLoading(true);
      const holidayData = {
        name: formValues.name,
        description: formValues.description,
        fromDate: formValues.fromDate.format(dateFormate),
        toDate: formValues.toDate?.format(dateFormate),
      };

      const { data } = await markHoliday(holidayData);
      data.data && addHoliday(data.data);
      toast.success('Holiday marked successfully');
      onClose();
    } catch (error) {
      const errorMessage = parseError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleDateChange =
    (name: 'fromDate' | 'toDate') => (value: Moment | null) => {
      setFormValues((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
    };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {isHoliday && (
            <Grid size={12}>
              <Alert severity="error">
                The selected dates overlapping with a pre-existing holiday
                period.
              </Alert>
            </Grid>
          )}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Holiday Name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              onBlur={handleBlur}
              multiline
              rows={3}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Start Date"
              value={formValues.fromDate}
              onChange={handleDateChange('fromDate')}
              format={dateFormate2}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.fromDate,
                  helperText: errors.fromDate,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="End Date"
              value={formValues.toDate}
              onChange={handleDateChange('toDate')}
              minDate={formValues.fromDate || undefined}
              format={dateFormate2}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.toDate,
                  helperText: errors.toDate,
                },
              }}
            />
          </Grid>

          <Grid size={12}>
            <Box display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={
                  loading && (
                    <CircularProgress
                      color="secondary"
                      style={{ width: '20px', height: '20px' }}
                    />
                  )
                }
              >
                Save Holiday
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default HolidayForm;
