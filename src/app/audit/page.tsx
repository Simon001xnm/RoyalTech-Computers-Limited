
import type { Metadata } from 'next';
import { AuditClient } from './components/audit-client';

export const metadata: Metadata = {
  title: 'Audit Trail',
  description: 'View internal activity logs for your business workspace.',
};

export default function AuditTrailPage() {
  return <AuditClient />;
}
