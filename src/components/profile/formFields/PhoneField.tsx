import { MuiTelInput, MuiTelInputInfo } from 'mui-tel-input';
import React, { ChangeEvent } from 'react';
import { SectionField } from '../../../pages/Marketing/Profile/constants';

// A single generous cap that fits every ITU-T E.164 dialling format
// (max 15 digits + a country code + separators). The previous per-country
// calculation pulled its length from `formatInternational()` which returns
// the formatted string ("+91 99999 99999" = 15 chars) while MuiTelInput
// stores the value WITHOUT separators — so the cap hit ~3 digits early and
// blocked valid 10-digit Indian numbers. `validatePhone()` (phone pkg) does
// the real per-country validation downstream, so a static upper bound is
// the simplest and most correct cap here.
const MAX_PHONE_LENGTH = 20;

const PhoneField = ({
  field,
  disabled,
  label,
  value,
  validationError,
  onChange,
  onBlur,
}: MyProps) => {
  const onPhoneChange = (value: string, _info: MuiTelInputInfo) => {
    onChange({ target: { value } } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <MuiTelInput
      disabled={disabled}
      slotProps={{ htmlInput: { ...field.inputAttributes, maxLength: MAX_PHONE_LENGTH } as React.InputHTMLAttributes<HTMLInputElement> }}
      defaultCountry={disabled ? undefined : 'IN'}
      onChange={onPhoneChange}
      onBlur={() => onBlur && onBlur(field)}
      label={label}
      value={value}
      fullWidth
      error={!!validationError}
      helperText={validationError}
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          backgroundColor: disabled ? '#f0f0f0' : 'transparent',
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: 'black',
          backgroundColor: '#f0f0f0',
        },
      }}
    />
  );
};

export default PhoneField;

interface MyProps {
  field: SectionField;
  label: string;
  value: string;
  disabled: boolean;
  validationError: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: SectionField) => void;
}
