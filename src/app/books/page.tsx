
import type { Metadata } from 'next';
import { AccountingClient } from './components/accounting-client';

export const metadata: Metadata = {
  title: 'Accounting',
  description: 'Manage sales, expenses, and financial health for RoyalTech.',
};

export default function BooksPage() {
  return <AccountingClient />;
}

    