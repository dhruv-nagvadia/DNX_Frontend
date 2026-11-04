/**
 * Copy for the Help & Support page. Contact details themselves (phone,
 * WhatsApp number, email) live in `@/utils/support` — only the descriptive
 * text around them is defined here.
 */
export const SUPPORT_HOURS = 'Mon–Sat, 9 AM – 8 PM';
export const EMAIL_REPLY_TIME = 'We reply within 24 hours';
export const WHATSAPP_NOTE = 'Fastest reply';

export type FaqCategory = 'payments' | 'bookings' | 'orders' | 'offers' | 'account';

export const FAQ_CATEGORIES: { id: FaqCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments & payouts' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'orders', label: 'Orders & stock' },
  { id: 'offers', label: 'Offers' },
  { id: 'account', label: 'Account' },
];

/** A plain-text run, or an in-app link. Kept as data so search can read it. */
export type AnswerPart = string | { to: string; label: string };

export interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: AnswerPart[];
}

export const FAQS: Faq[] = [
  {
    id: 'get-paid',
    category: 'payments',
    question: 'When do I get paid?',
    answer: [
      'DNX pays out your online earnings manually. You can check your payout balance, past payouts, and the latest status under ',
      { to: '/earnings', label: 'Earnings → Payout balance' },
      '.',
    ],
  },
  {
    id: 'commission',
    category: 'payments',
    question: 'What is the commission rate?',
    answer: [
      'DNX takes a commission on each completed sale. The current default rate, and any custom rate set for one of your businesses, are shown on the ',
      { to: '/earnings', label: 'Earnings' },
      ' page. It comes out of your price — customers always pay the listed price.',
    ],
  },
  {
    id: 'business-details',
    category: 'account',
    question: 'How do I add or update my business details?',
    answer: [
      'Go to ',
      { to: '/businesses', label: 'My Businesses' },
      ', open the business, and click Edit Business. To add a new one, use Add Business on the same page.',
    ],
  },
  {
    id: 'offers',
    category: 'offers',
    question: 'How can I manage my offers (coupons)?',
    answer: [
      'On the ',
      { to: '/coupons', label: 'Coupons / Offers' },
      ' page you can create, edit, switch on or off, or delete offers for any of your businesses.',
    ],
  },
  {
    id: 'track',
    category: 'bookings',
    question: 'How do I track my bookings and orders?',
    answer: [
      'The ',
      { to: '/bookings-orders', label: 'Bookings & Orders' },
      ' page lists every booking and order with its status. Accept, start, and complete them there, and mark cash as collected.',
    ],
  },
  {
    id: 'missing-payment',
    category: 'payments',
    question: 'What should I do if a payment is missing?',
    answer: [
      'First check the sale under ',
      { to: '/earnings', label: 'Earnings → Completed sales' },
      '. If it’s still missing, contact us below with the booking or order ID.',
    ],
  },
  {
    id: 'out-of-stock',
    category: 'orders',
    question: 'How do I mark a product out of stock?',
    answer: [
      'Open your store from ',
      { to: '/businesses', label: 'My Businesses' },
      ', go to the Manage Stock tab, and choose Mark as Out of Stock on the product. You can update the stock quantity there too.',
    ],
  },
  {
    id: 'hours',
    category: 'bookings',
    question: 'How do I change my business hours or close for a day?',
    answer: [
      'Open the business from ',
      { to: '/businesses', label: 'My Businesses' },
      '. Weekly hours and break time are in the Hours tab; to close for a specific date or set special hours, use the Calendar tab.',
    ],
  },
  {
    id: 'blocked',
    category: 'account',
    question: 'Why is my business blocked or pending?',
    answer: [
      'New businesses show “Verification pending” until DNX reviews them. A blocked business has been paused by the platform — contact us below and we’ll tell you why and how to fix it.',
    ],
  },
  {
    id: 'password',
    category: 'account',
    question: 'How do I change my password?',
    answer: [
      'Sign out, then choose Forgot password on the sign-in page to set a new one. Your account details are on the ',
      { to: '/profile', label: 'Account / Profile' },
      ' page.',
    ],
  },
];

export function answerText(parts: AnswerPart[]): string {
  return parts.map((p) => (typeof p === 'string' ? p : p.label)).join('');
}
