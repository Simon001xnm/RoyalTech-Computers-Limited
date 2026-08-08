import type { Metadata } from 'next';
import { ReceivablesClient } from './components/receivables-client';

export const metadata: Metadata = {
  title: 'Debt Ledger',
  description: 'Manage customers with outstanding balances and download account statements.',
};

export default function ReceivablesPage() {
  return <ReceivablesClient />;
}
