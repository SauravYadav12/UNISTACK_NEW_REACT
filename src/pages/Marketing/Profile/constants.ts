import { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import {
  UserProfile,
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

export function getProfileFormInitialValues(val?: Partial<UserProfile>) {
  const template: UserProfile = {
    _id: val?._id || '',
    employeeId: val?.employeeId || '',
    user: val?.user || '',
    name: val?.name || '',
    photo: val?.photo || '',
    email: {
      personal: val?.email?.personal || '',
      official: val?.email?.official || '',
    },
    dob: val?.dob || '',
    phoneNumber: val?.phoneNumber || '',
    emergencyPhoneNumber: val?.emergencyPhoneNumber || '',
    panNumber: val?.panNumber || '',
    aadharNumber: val?.aadharNumber || '',
    panCopy: val?.panCopy || '',
    aadharCopy: val?.aadharCopy || '',
    resume: val?.resume || '',
    bankDetails: {
      accountName: val?.bankDetails?.accountName || '',
      accountNumber: val?.bankDetails?.accountNumber || '',
      bankName: val?.bankDetails?.bankName || '',
      ifscCode: val?.bankDetails?.ifscCode || '',
      swiftCode: val?.bankDetails?.swiftCode || '',
      bankAddress: val?.bankDetails?.bankAddress || '',
    },
    communicationAddress: {
      address1: val?.communicationAddress?.address1 || '',
      address2: val?.communicationAddress?.address2 || '',
      country: val?.communicationAddress?.country || '',
      state: val?.communicationAddress?.state || '',
      city: val?.communicationAddress?.city || '',
      'zip/pin': val?.communicationAddress?.['zip/pin'] || '',
    },
    permanentAddress: {
      address1: val?.permanentAddress?.address1 || '',
      address2: val?.permanentAddress?.address2 || '',
      country: val?.permanentAddress?.country || '',
      state: val?.permanentAddress?.state || '',
      city: val?.permanentAddress?.city || '',
      'zip/pin': val?.permanentAddress?.['zip/pin'] || '',
    },
  };
  return { ...template };
}

const addresssectionFields: SectionField[] = [
  {
    fieldName: 'address1',
  },
  {
    fieldName: 'address2',
  },
  { fieldName: 'country' },
  { fieldName: 'state' },
  {
    fieldName: 'city',
  },
  { fieldName: 'zip/pin' },
];

export const profileFormSections: FormSections[] = [
  {
    sectionTitle: 'Personal Details',
    sectionFields: [
      {
        fieldName: 'employeeId',
        label: 'Employee ID',
        inputAttributes: {
          required: true,
        },
      },
      {
        fieldName: 'name',
      },
      {
        fieldName: 'dob',
        fieldType: 'date',
        label: 'Date of Birth',
        customValidation: (val) => {
          return dayjs(val, 'YYYY-MM-DD', false).isValid();
        },
      },
      {
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
        inputAttributes: {
          required: true,
        },
      },
      {
        fieldName: 'phoneNumber',
        label: 'Phone Number',
        fieldType: 'number',
        customValidation: validatePhone,
      },
      {
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
        fieldName: 'bankName',
        label: 'Bank name',
      },
      {
        fieldName: 'accountName',
        label: 'Account name',
      },
      {
        fieldName: 'accountNumber',
        label: 'Account Number',
      },
      { fieldName: 'ifscCode', label: 'IFSC Code' },
      { fieldName: 'swiftCode', label: 'Swift Code' },
      { fieldName: 'bankAddress', label: 'Bank Address' },
    ],
  },
];
export const profilePhotoSection: DocumentSectionField = {
  label: 'Profile photo',
  fieldName: 'photo',
  fieldType: 'file',
  customValidation: urlValidator,
  accept: 'image/*',
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

      inputAttributes: {
        maxLength: 12,
      },
    },
    accept: '.pdf',
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

      inputAttributes: {
        maxLength: 10,
      },
    },
    accept: '.pdf',
  },
  profilePhotoSection,
  {
    fieldName: 'resume',
    fieldType: 'file',
    label: 'Resume',
    customValidation: urlValidator,
    accept: '.pdf',
  },
];

export interface SectionField {
  fieldName: Exclude<UserProfilePrimitiveFields, undefined>;
  label?: string;
  parentFieldName?: UserProfileParentFields;
  fieldType?: HTMLInputTypeAttribute;
  inputAttributes?: InputHTMLAttributes<HTMLInputElement>;
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

export const Android12Switch = styled(Switch)(() => ({
  width: 40,
  height: 22,
  padding: 0,
  display: 'inline-flex',
  overflow: 'visible',
  '& .MuiSwitch-switchBase': {
    padding: 0,
    top: 1,
    left: 1,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      '& + .MuiSwitch-track': {
        backgroundColor: '#EC4599',
        opacity: 1,
      },
      '& .MuiSwitch-thumb': {
        backgroundColor: '#37B7EA',
      },
    },
  },
  '& .MuiSwitch-track': {
    borderRadius: 8,
    height: 14,
    marginTop: 4,
    backgroundColor: '#D1D5DB',
    opacity: 1,
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
  },
}));
