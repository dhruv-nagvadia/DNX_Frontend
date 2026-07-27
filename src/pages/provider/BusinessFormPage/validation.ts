import { BusinessForm, BusinessFormErrors } from './types';

const PHONE_RE = /^[0-9+\-\s()]{8,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a map of field errors; empty object means valid. */
export function validateBusiness(form: BusinessForm): BusinessFormErrors {
  const errors: BusinessFormErrors = {};

  if (!form.categoryId) errors.categoryId = 'Please choose your business type';

  if (!form.businessName.trim()) errors.businessName = 'Business name is required';
  else if (form.businessName.trim().length < 2) errors.businessName = 'Enter a valid business name';

  if (!form.phone.trim()) errors.phone = 'Business phone is required';
  else if (!PHONE_RE.test(form.phone)) errors.phone = 'Enter a valid phone number';

  if (form.email.trim() && !EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email';

  return errors;
}
