/** DNX platform support contact — reachable from the provider dashboard. */
export const SUPPORT = {
  phone: '+919173662183',
  phoneDisplay: '+91 91736 62183',
  whatsapp: '919173662183',
  email: 'dhruvnagvadia83@gmail.com',
};

export const supportLinks = {
  call: `tel:${SUPPORT.phone}`,
  whatsapp: `https://wa.me/${SUPPORT.whatsapp}`,
  email: `mailto:${SUPPORT.email}?subject=${encodeURIComponent('DNX support request')}`,
};
