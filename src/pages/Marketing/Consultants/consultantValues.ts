import { validateEmail, ValidationMeta } from '../../../utils/validators';

export const timeZoneOptions = ['EST', 'CST', 'MST', 'PST'];

export const visaStatusOptions = ['US Citizen', 'Green Card', 'GC EAD', 'H1b'];

export const consultantStatusOptions = ['Active', 'Not Active'];

export const consultantValidationMeta: ValidationMeta[] = [
  {
    field: 'consultantStatus',
    required: true,
  },
  {
    field: 'consultantName',
    required: true,
  },
  {
    field: 'visaStatus',
    required: true,
  },
  {
    field: 'dob',
    required: true,
  },
  {
    field: 'currentAddress',
    required: true,
  },
  {
    field: 'phone',
    required: true,
  },
  {
    field: 'email',
    required: true,
    validate: validateEmail,
  },
  {
    field: 'dlNo',
    required: true,
  },
];
