import { phone } from 'phone';
import { labelizeKey } from './utils';
export const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
export const validatePhone = (number: string) => {
  if (typeof number !== 'string') return false;
  const test = phone(number);
  return test.isValid;
};
export const urlValidator = (v: string) =>
  typeof v === 'string' && /^https:\/\/.+/.test(v);

export const validatePanNumber = (v: string) =>
  typeof v === 'string' && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
export const validateAadharNumber = (v: string) =>
  typeof v === 'string' && /^[2-9]{1}[0-9]{3}(\s?[0-9]{4}){2}$/.test(v);

export const isFieldValid = (
  meta: ValidationMeta,
  value: unknown,
  setErrors?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
) => {
  const { required, validate, label, field } = meta;
  let message = '';
  if (required && !value) {
    message = 'Required';
  }
  if (value && validate && !validate(value)) {
    const myLabel = label || labelizeKey(field);
    message = myLabel + ' is not valid';
  }
  setErrors && setErrors((pre) => ({ ...pre, [field]: message }));
  return !message;
};

export const validateAllFields = (
  requiredFields: ValidationMeta[],
  values: { [key: string]: unknown },
  setErrors?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
) => {
  let valid = true;
  for (const field of requiredFields) {
    if (!isFieldValid(field, values[field.field], setErrors)) {
      valid = false;
    }
  }
  return valid;
};

export interface ValidationMeta {
  field: string;
  label?: string;
  required?: boolean;
  transform?: <T = unknown>(value: T) => unknown;
  validate?: <T = unknown>(value: T) => boolean;
}
