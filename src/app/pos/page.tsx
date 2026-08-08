import type { Metadata } from 'next';
import { PosClient } from './components/pos-client';

export const metadata: Metadata = {
  title: 'Point of Sale',
  description: 'High-speed retail transaction node with split-payment processing.',
};

export default function PosPage() {
  return <PosClient />;
}