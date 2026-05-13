import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
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

type HolidayScope = 'ALL' | 'US' | 'IN';

type HolidayFormValues = {
  name: string;
  description: string;
  fromDate: Moment | null;
  toDate: Moment | null;
  /**
   * Which shift the holiday applies to.
   *   - "ALL" → both shifts see it (super-admin marks a company-wide off).
   *   - "US"  → only US-shift employees see it in attendance / leave / notice.
   *   - "IN"  → only India-shift employees see it.
   */
  country: HolidayScope;
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
    country: 'ALL',
  });

  const isHoliday = useMemo(() => {
    if (!formValues.fromDate && !formValues.toDate) return;
    return isHolidayMarked(
      holidayState.data || [],
      formValues.fromDate?.format(dateFormate),
      formValues.toDate?.format(dateFormate),
      undefined,
      // Scope the overlap check to the same audience — a US holiday and an
      // India holiday on the same calendar date are NOT a conflict.
      formValues.country,
    );
  }, [formValues.fromDate, formValues.toDate, formValues.country]);

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
        country: formValues.country,
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
            {/* Shift scope — drives who actually sees this holiday in
                attendance, leave, and the daily notice email. */}
            <FormControl fullWidth>
              <InputLabel id="holiday-scope-label">Applies to</InputLabel>
              <Select
                labelId="holiday-scope-label"
                label="Applies to"
                value={formValues.country}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    country: e.target.value as HolidayScope,
                  }))
                }
              >
                <MenuItem value="ALL">Both shifts (company-wide)</MenuItem>
                <MenuItem value="US">US Shift only</MenuItem>
                <MenuItem value="IN">India Shift only</MenuItem>
              </Select>
              <FormHelperText>
                Both-shifts marks a global day off. Shift-specific scopes
                are useful for national holidays (e.g. Independence Day vs.
                Republic Day) where only one cohort is off.
              </FormHelperText>
            </FormControl>
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
