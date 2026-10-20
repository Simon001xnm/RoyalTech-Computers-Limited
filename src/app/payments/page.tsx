import type { Metadata } from 'next';
import { PaymentsClient } from './components/payments-client';

export const metadata: Metadata = {
  title: 'Payment Ledger',
  description: 'Manage shop payments, m-pesa records, and credit notes.',
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}
