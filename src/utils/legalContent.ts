import { SUPPORT } from './support';

export const LEGAL_LAST_UPDATED = 'September 2026';

export interface LegalSection {
  heading: string;
  body: string;
}

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: 'Introduction',
    body: `DNX ("we", "us", "our") operates the DNX platform, which connects customers with local service providers and stores. This policy explains what information we collect, how we use it, and the choices you have. By using DNX, you agree to the collection and use of information as described here.`,
  },
  {
    heading: 'Information we collect',
    body: `Account information: your name, email address, phone number (optional), and a securely hashed password.

Location information: your postal code, city and state (captured at signup or entered manually), and — only with your permission, on the mobile app — your device's precise GPS location, used to show nearby businesses and estimate distance/travel fees.

Booking and order information: services or products booked/ordered, appointment times, delivery addresses, amounts paid, and any reviews or ratings submitted.

Payment information: payments are processed by Razorpay, our payment gateway partner. We do not store card, UPI, or bank account details — Razorpay handles that directly and shares with us only the confirmation and amount of a completed payment.

Usage information: how you interact with the app/site, for improving reliability and features.`,
  },
  {
    heading: 'How we use your information',
    body: `To create and manage your account; to show relevant nearby businesses, services and products; to process bookings, orders and payments; to send booking confirmations, reminders and support responses; to improve the app and fix problems; and to meet legal and accounting obligations (e.g. retaining order records).`,
  },
  {
    heading: 'Sharing your information',
    body: `We share information only where necessary to provide the service:

• With the service provider or store you book/order from, so they can fulfil your booking or order (your name, contact details, and booking/order details).
• With Razorpay, to process payments.
• With email/notification providers, to deliver account and booking-related messages (e.g. a password-reset code).

We do not sell your personal information to third parties.`,
  },
  {
    heading: 'Data retention and account deletion',
    body: `We keep your account information for as long as your account is active. Customers can delete their account at any time from the mobile app (Profile → Delete account). When you do, your personal details (name, email, phone) are anonymized and your account is deactivated immediately. Records of past bookings and orders are retained in an anonymized form, as businesses and accounting records reasonably require, but are no longer linked to your identifying information.`,
  },
  {
    heading: 'Your rights',
    body: `You can review and update your profile information at any time. You can request a copy of your data, or ask us to correct or delete it, by contacting us using the details below.`,
  },
  {
    heading: 'Security',
    body: `We use industry-standard measures (including password hashing and encrypted connections) to protect your information. No method of transmission or storage is 100% secure, but we work to protect your data appropriately.`,
  },
  {
    heading: "Children's privacy",
    body: `DNX is not directed at children under 13, and we do not knowingly collect information from them.`,
  },
  {
    heading: 'Changes to this policy',
    body: `We may update this policy from time to time. We'll update the "last updated" date below when we do, and, for significant changes, notify you directly.`,
  },
  {
    heading: 'Contact us',
    body: `Questions about this policy or your data? Reach us at ${SUPPORT.email} or ${SUPPORT.phoneDisplay}.`,
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Acceptance of terms',
    body: `By creating an account or using DNX, you agree to these Terms of Service. If you don't agree, please don't use the platform.`,
  },
  {
    heading: 'What DNX is',
    body: `DNX is a platform that connects customers with independent local service providers and stores. We are not the provider of the underlying services or products — bookings and orders are a direct arrangement between the customer and the business they choose. DNX facilitates discovery, booking, and payment, but is not a party to that underlying service/sale.`,
  },
  {
    heading: 'Your account',
    body: `You must provide accurate information when registering, and keep your login credentials confidential. You're responsible for activity that happens under your account. Let us know right away if you suspect unauthorized use.`,
  },
  {
    heading: 'Bookings, orders and payments',
    body: `When a customer books a service or places an order, they're entering into an agreement with that business. Prices and availability are set by the business. Payments are processed securely via Razorpay. Cancellations and refunds follow our Refund & Cancellation Policy; where a payment needs to be refunded, it is processed back to the original payment method.`,
  },
  {
    heading: 'Reviews and conduct',
    body: `Reviews must be honest and based on the reviewer's own experience. Don't post content that is abusive, defamatory, or unrelated to the service. We may remove reviews or content that violate this. You agree not to misuse the platform — including attempting to interfere with its normal operation, or using it for any unlawful purpose.`,
  },
  {
    heading: 'Provider listings',
    body: `Businesses listed on DNX are independent third parties. While we take reasonable steps to verify basic business information, DNX does not guarantee the quality, safety, or legality of any service or product offered by a listed business, and is not liable for the acts or omissions of any provider.`,
  },
  {
    heading: 'Account deletion and termination',
    body: `Customers may delete their account at any time from the mobile app (Profile → Delete account). We may suspend or terminate accounts that violate these terms, engage in fraud, or misuse the platform.`,
  },
  {
    heading: 'Limitation of liability',
    body: `DNX is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential damages arising from use of the platform or dealings with a listed business.`,
  },
  {
    heading: 'Governing law',
    body: `These terms are governed by the laws of India, and any disputes are subject to the jurisdiction of the courts of India.`,
  },
  {
    heading: 'Changes to these terms',
    body: `We may update these terms from time to time. Continued use of the platform after a change means you accept the updated terms.`,
  },
  {
    heading: 'Contact us',
    body: `Questions about these terms? Reach us at ${SUPPORT.email} or ${SUPPORT.phoneDisplay}.`,
  },
];

export const REFUND_LAST_UPDATED = 'October 2026';

export const REFUND_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: 'Overview',
    body: `This policy explains how cancellations and refunds work on DNX. DNX connects you with independent local businesses (service providers and stores). Whether you get money back when you cancel depends on the kind of booking or order and how far along it is, as described below.

It applies to payments made online through DNX. If you pay a business directly in cash, there is nothing for DNX to refund.`,
  },
  {
    heading: 'How to cancel',
    body: `Bookings: open the booking under Bookings & Orders and tap Cancel. You can cancel while it is still pending or confirmed.

Orders: open the order under Bookings & Orders and tap Cancel. You can cancel while the order is still placed or confirmed. Once the store marks it ready for pickup it can no longer be cancelled in the app — please contact the store or us.

If you only need a different time for a booking, you can reschedule it instead of cancelling.`,
  },
  {
    heading: 'Service bookings',
    body: `• Cancel before the appointment start time: full refund of everything you paid online (the full amount, or your deposit if you paid a deposit).

• Cancel after the appointment start time: no refund.

• If you don't show up and the business marks the booking as a no-show: the amount you paid is not refunded.

• If the business cancels the booking: full refund of everything you paid online.`,
  },
  {
    heading: 'Store orders (pickup)',
    body: `• Cancel before the store has accepted your order: full refund.

• Cancel after the store has accepted it: items taken from the store's ordinary stock are refunded in full. Items the store prepares specially for your order (for example cooked or made-to-order items) are not refunded once the store has accepted the order. The refund is worked out from what you paid for each kind of item.

• If the store cancels your order: full refund.

• If you don't collect a ready order within the pickup window (24 hours unless a different window is shown), the store can close it as a no-show. The same split applies: made-to-order items are not refunded, other items are.

• An order that includes items from more than one store is split into a separate order for each store. Cancelling or being refunded for one store's order doesn't affect the others.`,
  },
  {
    heading: 'Partial payments (deposits)',
    body: `If you paid only part of the amount online (a deposit) and will pay the rest in person, any refund is based on the amount you actually paid online. There is nothing to refund for the part you had not paid yet.`,
  },
  {
    heading: 'Cash payments',
    body: `If you choose to pay in cash, no online payment is made, so there is nothing to refund. Repeated no-shows on cash bookings or orders can lead to a warning, a charge, Cash on Delivery being turned off for your account, or your account being restricted.`,
  },
  {
    heading: 'Failed or duplicate payments',
    body: `If money was deducted from your account but you can't see the booking or order, or you were charged twice, contact us with the date, the amount and your payment reference. We will complete the booking or order, or refund you.

If part of your order can't be placed after you have paid (for example an item became unavailable), that part is refunded.`,
  },
  {
    heading: 'How refunds are paid',
    body: `Refunds go back to the payment method you used (card, UPI, net banking or wallet) through Razorpay, our payment partner. We don't deduct any fee from a refund you are eligible for.

After we process a refund, banks usually take 5–7 working days to show it, depending on your bank. If you haven't seen it after that, contact us.`,
  },
  {
    heading: 'Changes to this policy',
    body: `We may update this policy from time to time. We'll update the "last updated" date when we do, and, for significant changes, let you know directly.`,
  },
  {
    heading: 'Contact us',
    body: `Questions about a cancellation or refund? Reach us at ${SUPPORT.email} or ${SUPPORT.phoneDisplay} with your booking or order details.`,
  },
];
