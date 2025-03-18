import { phone } from 'phone';
import { labelizeKey } from './utils';
export const validateEmail = (email: any) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
export const validatePhone = (number: any) => {
  if (typeof number !== 'string') return false;
  const test = phone(number);
  return test.isValid;
};
export const urlValidator = (v: any) =>
  typeof v === 'string' && /^https:\/\/.+/.test(v);

export const validatePanNumber = (v: any) =>
  typeof v === 'string' && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
export const validateAadharNumber = (v: any) =>
  typeof v === 'string' && /^[2-9]{1}[0-9]{3}(\s?[0-9]{4}){2}$/.test(v);

export const isFieldValid = (
  meta: ValidationMeta,
  value: any,
  setErrors?: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>
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
  values: any,
  setErrors?: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>
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
  transform?: <T = any>(value: T) => any;
  validate?: <T = any>(value: T) => boolean;
}
