
import type { Metadata } from 'next';
import { CustomersClient } from '../customers/components/customers-client';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Customer Relationship Management for RoyalTech.',
};

export default function CrmPage() {
    return <CustomersClient />
}

