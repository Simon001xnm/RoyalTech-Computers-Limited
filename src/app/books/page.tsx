import type { Metadata } from 'next';
import { AccountingClient } from './components/accounting-client';

export const metadata: Metadata = {
  title: 'Expense Feed',
  description: 'Manage sales, expenses, and financial health for your workspace.',
};

export default function BooksPage() {
  return <AccountingClient />;
}
