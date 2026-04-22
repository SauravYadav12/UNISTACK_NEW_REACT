import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import React, { ChangeEvent } from 'react';
import RenderFields from '../RenderFields';
import { SectionField } from '../../../../pages/Marketing/Profile/constants';
import { UserProfile } from '../../../../Interfaces/profile';
import StateField from './StateField';
import { Country } from 'country-state-city';
import CityField from './CityField';

const AddressField = ({
  disabled,
  sectionFields,
  parentFieldName,
  formErrors,
  myProfile,
  setMyProfile,
  onChangeProfileValues,
}: MyProps) => {
  return (
    <>
      {sectionFields.map((field, j) => {
        const { fieldName, label } = field;
        const validationError = (formErrors as any)[parentFieldName][field.fieldName];

        if (fieldName === 'country') {
          return (
            <Grid key={j} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl size="small" fullWidth error={!!validationError}>
                <InputLabel sx={{ textTransform: 'capitalize' }}>
                  {label || fieldName}
                </InputLabel>
                <Select
                  value={myProfile[parentFieldName].country}
                  onChange={(e) => onChangeProfileValues(parentFieldName, field, e)}
                  label={label || fieldName}
                  disabled={disabled}
                  sx={{
                    borderRadius: '10px',
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#2A3547',
                      backgroundColor: '#F6F9FC',
                      borderRadius: '10px',
                    },
                  }}
                >
                  {Country.getAllCountries().map((option) => (
                    <MenuItem key={option.isoCode} value={option.isoCode}>
                      {option.name} ({option.isoCode})
                    </MenuItem>
                  ))}
                </Select>
                {validationError && <FormHelperText>{validationError}</FormHelperText>}
              </FormControl>
            </Grid>
          );
        } else if (fieldName === 'state') {
          return (
            <Grid key={j} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <StateField
                error={!!validationError}
                helperText={validationError}
                disabled={disabled}
                selectedCountry={myProfile[parentFieldName].country}
                selectedState={myProfile[parentFieldName].state}
                onChange={(e) => onChangeProfileValues(parentFieldName, field, e)}
                field={field}
              />
            </Grid>
          );
        } else if (fieldName === 'city') {
          return (
            <Grid key={j} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <CityField
                disabled={disabled}
                selectedCountry={myProfile[parentFieldName].country}
                selectedState={myProfile[parentFieldName].state}
                selectedCity={myProfile[parentFieldName].city}
                onChange={(e) => onChangeProfileValues(parentFieldName, field, e)}
                field={field}
                myProfile={myProfile}
                formErrors={formErrors}
                setMyProfile={setMyProfile}
                parentFieldName={parentFieldName}
              />
            </Grid>
          );
        }

        return (
          <RenderFields
            formError={formErrors}
            disabled={disabled}
            key={j}
            parentFieldName={parentFieldName}
            field={field}
            setMyProfile={setMyProfile}
            myProfile={myProfile}
            onChange={(e) => onChangeProfileValues(parentFieldName, field, e)}
          />
        );
      })}
    </>
  );
};

export default AddressField;

interface MyProps {
  disabled: boolean;
  sectionFields: SectionField[];
  parentFieldName: 'communicationAddress' | 'permanentAddress';
  formErrors: UserProfile;
  myProfile: UserProfile;
  setMyProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onChangeProfileValues: (
    parentFieldName: 'communicationAddress' | 'permanentAddress',
    field: SectionField,
    e: ChangeEvent<HTMLInputElement> | SelectChangeEvent
  ) => void;
}
