import React, { ChangeEvent } from 'react';
import { UserProfile } from '../../../Interfaces/profile';
import { SectionField } from '../../../pages/Marketing/Profile/constants';
import { Grid, TextField } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { MuiTelInput } from 'mui-tel-input';
const RenderFields = ({
  disabled,
  required,
  field,
  formError,
  myProfile,
  parentFieldName,
  onChange,
  onBlur,
}: RenderFieldProps) => {
  const {
    fieldName,
    fieldType = 'text',
    label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
  } = field;
  const val = parentFieldName
    ? (myProfile as any)[parentFieldName][field.fieldName]
    : (myProfile as any)[field.fieldName];
  const validationError = parentFieldName
    ? (formError as any)[parentFieldName][field.fieldName]
    : (formError as any)[field.fieldName];
  
  if (
    fieldName === 'phoneNumber' ||
    fieldName === 'emergencyPhoneNumber'
  ) {
    return (
      <div>
        <Grid item sx={{ m: 1, width: 230 }}>
          <MuiTelInput
            onChange={(value) => onChange({ target: { value } } as any)}
            onBlur={() => onBlur && onBlur(field)}
            label={label}
            value={val}
            disabled={disabled}
            fullWidth
            error={!!validationError}
            helperText={validationError}
            required={required}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </div>
    );
  }
  switch (fieldType) {
    case 'text':
    case 'number':
    case 'email':
      return (
        <div>
          <Grid item sx={{ m: 1, width: 230 }}>
            <TextField
              onBlur={() => onBlur && onBlur(field)}
              label={label}
              type={fieldType}
              value={val}
              onChange={onChange}
              disabled={disabled}
              fullWidth
              error={!!validationError}
              helperText={validationError}
              required={required}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              multiline={fieldType === 'number' ? false : true}
            />
          </Grid>
        </div>
      );

    case 'date':
      return (
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
              label={label}
              value={myProfile.dob}
              onChange={(newValue) => {
                onChange({
                  target: {
                    value: newValue ? dayjs(newValue).format('YYYY-MM-DD') : '',
                  },
                } as any);
                const timeOut = setTimeout(() => {
                  onBlur && onBlur(field);
                  clearTimeout(timeOut);
                }, 0);
              }}
              renderInput={(params) => (
                <TextField
                  onBlur={() => onBlur && onBlur(field)}
                  size="small"
                  {...params}
                  error={!!validationError}
                  helperText={validationError}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
      );

    default:
      return null;
  }
};

export default RenderFields;

interface RenderFieldProps {
  field: SectionField;
  disabled: boolean;
  required: boolean;
  parentFieldName?: keyof UserProfile;
  formError: UserProfile;
  myProfile: UserProfile;
  setMyProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: SectionField) => void;
}
