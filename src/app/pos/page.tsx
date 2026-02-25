
import type { Metadata } from 'next';
import { PosClient } from './components/pos-client';

export const metadata: Metadata = {
  title: 'Point of Sale',
  description: 'Sell laptops and accessories.',
};

export default function PosPage() {
  return <PosClient />;
}
