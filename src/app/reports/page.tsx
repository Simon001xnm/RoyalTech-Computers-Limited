
import type { Metadata } from 'next';
import { ReportsClient } from './components/reports-client';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Generate and view financial reports.',
};

export default function ReportsPage() {
  return <ReportsClient />;
}
