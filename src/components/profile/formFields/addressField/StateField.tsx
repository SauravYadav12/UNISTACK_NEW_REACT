import React, { useEffect, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { SectionField } from '../../../../pages/Marketing/Profile/constants';
import CustomSelectField from '../../../select/CustomSelectField';
import { State } from 'country-state-city';
interface MyProps {
  error: boolean;
  helperText: string;
  field: SectionField;
  disabled: boolean;
  selectedCountry: string;
  selectedState: string;
  onChange: (e: SelectChangeEvent) => void;
}
const StateField = ({
  selectedCountry,
  selectedState,
  onChange,
  disabled,
  helperText,
  error,
}: MyProps) => {
  const stateList = State.getStatesOfCountry(selectedCountry);
  useEffect(() => {
    if (!stateList.find((s) => s.name === selectedState)) {
      onChange({ target: { value: '' } } as any);
    }
  }, [selectedCountry]);

  return (
    !!stateList.length && (
      <CustomSelectField
        label="State"
        valueOptions={stateList.map((s) => s.name)}
        selectedValue={selectedState}
        error={error}
        helperText={helperText}
        disabled={disabled}
        onChange={(value: any) => onChange({ target: { value } } as any)}
        width={180}
      />
    )
  );
};

export default StateField;
