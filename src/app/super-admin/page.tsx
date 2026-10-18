import type { Metadata } from 'next';
import { SuperAdminClient } from './components/super-admin-client';

export const metadata: Metadata = {
  title: 'Platform Control',
  description: 'Global business oversight and system configuration.',
};

export default function SuperAdminPage() {
  return <SuperAdminClient />;
}
