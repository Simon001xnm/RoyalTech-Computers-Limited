
import { DeskClient } from './components/desk-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Desk',
  description: 'Customer support and helpdesk for RoyalTech.',
};

export default function DeskPage() {
  return <DeskClient />;
}

