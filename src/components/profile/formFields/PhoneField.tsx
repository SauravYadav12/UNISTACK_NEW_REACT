import { MuiTelInput, MuiTelInputInfo } from 'mui-tel-input';
import React, { ChangeEvent, useState } from 'react';
import { SectionField } from '../../../pages/Marketing/Profile/constants';
import { getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
const PhoneField = ({
  field,
  disabled,
  label,
  value,
  validationError,
  onChange,
  onBlur,
}: MyProps) => {
  const [maxPhoneLength, setMaxPhoneLength] = useState(15);
  const [muiTelInputInfo, setMuiTelInputInfo] = useState<MuiTelInputInfo>();

  const onPhoneChange = (value: string, info: MuiTelInputInfo) => {
    if (info.countryCode && info.countryCode !== muiTelInputInfo?.countryCode) {
      const exampleNumberLength = getExampleNumber(
        info.countryCode,
        examples
      )?.formatInternational().length;
      exampleNumberLength && setMaxPhoneLength(exampleNumberLength);
      setMuiTelInputInfo(info);
    }
    onChange({ target: { value } } as any);
  };

  return (
    <MuiTelInput
      disabled={disabled}
      inputProps={{ ...field.inputAttributes, maxLength: maxPhoneLength }}
      defaultCountry={'IN'}
      onChange={onPhoneChange}
      onBlur={() => onBlur && onBlur(field)}
      label={label}
      value={value}
      fullWidth
      error={!!validationError}
      helperText={validationError}
      size="small"
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
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
