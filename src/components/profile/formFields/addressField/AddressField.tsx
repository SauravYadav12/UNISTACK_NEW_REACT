import {
  FormControl,
  FormHelperText,
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
        const validationError = (formErrors as any)[parentFieldName][
          field.fieldName
        ];
        if (fieldName === 'country') {
          return (
            <div key={j}>
              <FormControl
                sx={{ m: 1, width: 230 }}
                size="small"
                fullWidth
                error={!!validationError}
              >
                <InputLabel
                  id="demo-multiple-name-label"
                  sx={{
                    color: validationError ? 'red' : '',
                    textTransform: 'capitalize',
                  }}
                >
                  {label || fieldName}
                </InputLabel>
                <Select
                  value={myProfile[parentFieldName].country}
                  onChange={(e) =>
                    onChangeProfileValues(parentFieldName, field, e)
                  }
                  label={label || fieldName}
                  disabled={disabled}
                  sx={{
                    borderRadius: '10px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: validationError ? 'red' : '', // Red outline on error
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: validationError ? 'red' : '',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: validationError ? 'red' : '',
                    },
                    '& .MuiSelect-root': {
                      color: validationError ? 'red' : 'inherit', // Red text on error
                    },
                  }}
                >
                  {Country.getAllCountries().map((option) => (
                    <MenuItem key={option.isoCode} value={option.isoCode}>
                      {option.name} ({option.isoCode})
                    </MenuItem>
                  ))}
                </Select>
                {validationError && (
                  <FormHelperText>{validationError}</FormHelperText>
                )}
              </FormControl>
            </div>
          );
        } else if (fieldName === 'state') {
          return (
            <StateField
              error={!!validationError}
              helperText={validationError}
              disabled={disabled}
              key={j}
              selectedCountry={myProfile[parentFieldName].country}
              selectedState={myProfile[parentFieldName].state}
              onChange={(e) => onChangeProfileValues(parentFieldName, field, e)}
              field={field}
            />
          );
        } else if (fieldName === 'city') {
          return (
            <CityField
              disabled={disabled}
              key={j}
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
