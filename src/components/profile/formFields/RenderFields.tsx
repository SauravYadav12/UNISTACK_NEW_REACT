import React, { ChangeEvent } from 'react';
import { UserProfile } from '../../../Interfaces/profile';
import { SectionField } from '../../../pages/Marketing/Profile/constants';
import { Grid, TextField } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PhoneField from './PhoneField';
import { dateFormate } from '../../constants';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../../Interfaces/iUser';

const RenderFields = ({
  disabled,
  field,
  formError,
  myProfile,
  parentFieldName,
  onChange,
  onBlur,
}: RenderFieldProps) => {
  const user = useAuth().iUser;
  const {
    fieldName,
    fieldType = 'text',
    label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
  } = field;

  if (fieldName === 'employeeId' && !user?.role.includes(UserRole['super-admin'])) return null;

  const val = parentFieldName
    ? (myProfile as any)[parentFieldName][field.fieldName]
    : (myProfile as any)[field.fieldName];
  const validationError = parentFieldName
    ? (formError as any)[parentFieldName][field.fieldName]
    : (formError as any)[field.fieldName];

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      backgroundColor: disabled ? '#F6F9FC' : 'transparent',
    },
    '& .MuiInputBase-input.Mui-disabled': {
      WebkitTextFillColor: '#2A3547',
    },
  };

  if (fieldName === 'phoneNumber' || fieldName === 'emergencyPhoneNumber') {
    return (
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <PhoneField
          disabled={disabled}
          field={field}
          label={label}
          validationError={validationError}
          value={val}
          onChange={onChange}
          onBlur={onBlur}
        />
      </Grid>
    );
  }

  switch (fieldType) {
    case 'text':
    case 'number':
    case 'email':
      return (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
            inputProps={{ ...field.inputAttributes }}
            size="small"
            sx={inputSx}
            multiline={fieldType !== 'number'}
          />
        </Grid>
      );

    case 'date':
      return (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format={dateFormate}
              onClose={() => onBlur && onBlur(field)}
              disabled={disabled}
              label={label}
              value={myProfile.dob ? dayjs(myProfile.dob) : null}
              onChange={(newValue) => {
                onChange({
                  target: {
                    value: newValue ? dayjs(newValue).format(dateFormate) : '',
                  },
                } as any);
              }}
              slotProps={{
                textField: {
                  disabled,
                  inputProps: { ...field.inputAttributes },
                  onBlur: () => onBlur && onBlur(field),
                  size: 'small',
                  fullWidth: true,
                  error: !!validationError,
                  helperText: validationError,
                  sx: inputSx,
                },
              }}
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
  parentFieldName?: keyof UserProfile;
  formError: UserProfile;
  myProfile: UserProfile;
  setMyProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: SectionField) => void;
}
