import { phone } from 'phone';
export const validateEmail = (email: any) => {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
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
