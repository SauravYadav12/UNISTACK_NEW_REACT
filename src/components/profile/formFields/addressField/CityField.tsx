import React, { useEffect } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { SectionField } from '../../../../pages/Marketing/Profile/constants';
import CustomSelectField from '../../../select/CustomSelectField';
import { State, City } from 'country-state-city';
import { UserProfile } from '../../../../Interfaces/profile';
import RenderFields from '../RenderFields';

const CityField = ({
  field,
  parentFieldName,
  selectedCountry,
  selectedState,
  selectedCity,
  onChange,
  disabled,
  formErrors,
  setMyProfile,
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
      onChange({ target: { value: '' } } as any);
    }
  }, [selectedCity, selectedState]);

  return !!cityList.length ? (
    <CustomSelectField
      label="City"
      valueOptions={cityList.map((c) => c.name)}
      selectedValue={selectedCity}
      error={!!validationError}
      helperText={validationError}
      disabled={disabled}
      onChange={(value: any) => onChange({ target: { value } } as any)}
      width={180}
    />
  ) : (
    <>
      <RenderFields
        formError={formErrors}
        disabled={disabled}
        parentFieldName={parentFieldName}
        field={field}
        setMyProfile={setMyProfile}
        myProfile={myProfile}
        onChange={(e) => onChange(e)}
      />
    </>
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
