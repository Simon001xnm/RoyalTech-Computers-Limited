import type { Metadata } from 'next';
import { ReceivablesClient } from './components/receivables-client';

export const metadata: Metadata = {
  title: 'Money Owed',
  description: 'Manage customers with pending payments and see lifetime account history.',
};

export default function ReceivablesPage() {
  return <div className="animate-in fade-in duration-500"><ReceivablesClient /></div>;
}
