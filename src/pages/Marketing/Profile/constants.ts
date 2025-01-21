import { HTMLInputTypeAttribute } from 'react';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import {
  UserProfileParentFields,
  UserProfilePrimitiveFields,
  UserProfileTopLevelPrimitiveFields,
} from '../../../Interfaces/profile';
import {
  urlValidator,
  validateAadharNumber,
  validateEmail,
  validatePanNumber,
  validatePhone,
} from '../../../utils/validators';
import dayjs from 'dayjs';
export function convertValuesToEmptyString(obj: any) {
  obj = JSON.parse(JSON.stringify(obj));
  const isObject = (value: any): boolean =>
    value && typeof value === 'object' && !Array.isArray(value);
  for (const key in obj) {
    if (isObject(obj[key])) {
      obj[key] = convertValuesToEmptyString(obj[key]);
    } else {
      obj[key] = '';
    }
  }

  return obj;
}

const addresssectionFields: SectionField[] = [
  {
    fieldName: 'address1',
    optional: true,
  },
  {
    fieldName: 'address2',
    optional: true,
  },
  { fieldName: 'country', optional: true },
  { fieldName: 'state', optional: true },
  {
    fieldName: 'city',
    optional: true,
  },
  { fieldName: 'zip/pin', optional: true },
];

export const profileFormSections: FormSections[] = [
  {
    sectionTitle: 'Personal Details',
    sectionFields: [
      {
        fieldName: 'name',
        optional: true,
      },
      {
        optional: true,
        fieldName: 'dob',
        fieldType: 'date',
        label: 'Date of Birth',
        customValidation: (val) => {
          return dayjs(val, 'YYYY-MM-DD', false).isValid();
        },
      },
      {
        optional: true,
        parentFieldName: 'email',
        fieldName: 'official',
        label: 'Official Email',
        fieldType: 'email',
        customValidation: validateEmail,
      },
      {
        parentFieldName: 'email',
        fieldName: 'personal',
        label: 'Personal Email',
        fieldType: 'email',
        customValidation: validateEmail,
      },
      {
        optional: true,
        fieldName: 'phoneNumber',
        label: 'Phone Number',
        fieldType: 'number',
        customValidation: validatePhone,
      },
      {
        optional: true,
        fieldName: 'emergencyPhoneNumber',
        label: 'Emergency Phone Number',
        fieldType: 'number',
        customValidation: validatePhone,
      },
    ],
  },
  {
    sectionTitle: 'Permanent Address',
    parentFieldName: 'permanentAddress',
    sectionFields: addresssectionFields,
  },
  {
    sectionTitle: 'Communication Address',
    parentFieldName: 'communicationAddress',
    sectionFields: addresssectionFields,
  },

  {
    sectionTitle: 'Bank details',
    parentFieldName: 'bankDetails',
    sectionFields: [
      {
        optional: true,
        fieldName: 'bankName',
        label: 'Bank name',
      },
      {
        optional: true,
        fieldName: 'accountName',
        label: 'Account name',
      },
      {
        optional: true,
        fieldName: 'accountNumber',
        label: 'Account Number',
      },
      { fieldName: 'ifscCode', label: 'IFSC Code', optional: true },
      { fieldName: 'swiftCode', label: 'Swift Code', optional: true },
      { fieldName: 'bankAddress', label: 'Bank Address', optional: true },
    ],
  },
];
export const profilePhotoSection: DocumentSectionField = {
  label: 'Profile photo',
  fieldName: 'photo',
  fieldType: 'file',
  customValidation: urlValidator,
  accept: 'image/*',
  optional: true,
};
export const documentFormSection: DocumentSectionField[] = [
  {
    fieldName: 'aadharCopy',
    fieldType: 'file',
    label: 'Aadhar',
    customValidation: urlValidator,
    associatedField: {
      fieldName: 'aadharNumber',
      label: 'Aadhar Number',
      customValidation: validateAadharNumber,
      optional: true,
    },
    accept: '.pdf',
    optional: true,
  },

  {
    fieldName: 'panCopy',
    fieldType: 'file',
    label: 'PAN',
    customValidation: urlValidator,
    associatedField: {
      fieldName: 'panNumber',
      label: 'PAN Number',
      customValidation: validatePanNumber,
      transformValue: (val) => val.toUpperCase(),
      optional: true,
    },
    accept: '.pdf',
    optional: true,
  },
  profilePhotoSection,
  {
    fieldName: 'resume',
    fieldType: 'file',
    label: 'Resume',
    customValidation: urlValidator,
    accept: '.pdf',
    optional: true,
  },
];

export interface SectionField {
  fieldName: Exclude<UserProfilePrimitiveFields, undefined>;
  label?: string;
  parentFieldName?: UserProfileParentFields;
  fieldType?: HTMLInputTypeAttribute;
  optional?: boolean;
  customValidation?: (val: any) => boolean;
}
export interface FormSections {
  sectionTitle: string;
  sectionFields: SectionField[];
  parentFieldName?: UserProfileParentFields;
}
export interface AssociatedField extends Omit<SectionField, 'parentFieldName'> {
  fieldName: Exclude<UserProfileTopLevelPrimitiveFields, undefined>;
  transformValue?: (val: string) => string;
}
export interface DocumentSectionField extends AssociatedField {
  associatedField?: AssociatedField;
  fieldType: 'file';
  fieldName: Exclude<UserProfileTopLevelPrimitiveFields, undefined>;
  accept?: 'image/*' | '.pdf';
}

export const Android12Switch = styled(Switch)(({ theme }) => ({
  padding: 8,
  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 16,
      height: 16,
    },
    '&::before': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    '&::after': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: 'none',
    width: 16,
    height: 16,
    margin: 2,
  },
}));
