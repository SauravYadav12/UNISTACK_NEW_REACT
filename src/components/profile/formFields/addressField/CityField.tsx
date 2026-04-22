import React, { useEffect } from 'react';
import { SelectChangeEvent, TextField } from '@mui/material';
import { SectionField } from '../../../../pages/Marketing/Profile/constants';
import CustomSelectField from '../../../select/CustomSelectField';
import { State, City } from 'country-state-city';
import { UserProfile } from '../../../../Interfaces/profile';

const CityField = ({
  field,
  parentFieldName,
  selectedCountry,
  selectedState,
  selectedCity,
  onChange,
  disabled,
  formErrors,
  myProfile,
}: MyProps) => {
  const validationError = (formErrors as any)[parentFieldName][field.fieldName];
  const stateData = State.getStatesOfCountry(selectedCountry).find(
    (s) => s.name === selectedState
  );
  const cityList = stateData
    ? City.getCitiesOfState(selectedCountry, stateData.isoCode)
    : [];

  useEffect(() => {
    if (cityList.length && !cityList.find((c) => c.name === selectedCity)) {
      onChange({ target: { value: '' } } as SelectChangeEvent);
    }
  }, [selectedCity, selectedState]);

  return cityList.length ? (
    <CustomSelectField
      label="City"
      valueOptions={cityList.map((c) => c.name)}
      selectedValue={selectedCity}
      error={!!validationError}
      helperText={validationError}
      disabled={disabled}
      onChange={(value) => onChange({ target: { value } } as SelectChangeEvent)}
      fullWidth
    />
  ) : (
    <TextField
      label="City"
      value={selectedCity || ''}
      onChange={(e) => onChange({ target: { value: e.target.value } } as SelectChangeEvent)}
      disabled={disabled}
      fullWidth
      size="small"
      error={!!validationError}
      helperText={validationError}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          backgroundColor: disabled ? '#F6F9FC' : 'transparent',
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: '#2A3547',
        },
      }}
    />
  );
};

export default CityField;

interface MyProps {
  field: SectionField;
  disabled: boolean;
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onChange: (e: SelectChangeEvent) => void;
  parentFieldName: 'communicationAddress' | 'permanentAddress';
  formErrors: UserProfile;
  myProfile: UserProfile;
  setMyProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}
