import type { Metadata } from 'next';
import { StockClient } from '../stock/components/stock-client';

export const metadata: Metadata = {
  title: 'Hardware Inventory',
  description: 'Comprehensive hardware inventory management.',
};

export default function InventoryPage() {
  return <StockClient />
}
