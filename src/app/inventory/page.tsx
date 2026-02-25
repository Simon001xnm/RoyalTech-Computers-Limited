
import type { Metadata } from 'next';
import { StockClient } from '../stock/components/stock-client';


export const metadata: Metadata = {
  title: 'Laptop Inventory',
  description: 'Laptop inventory management for RoyalTech.',
};

export default function InventoryPage() {
  return <StockClient />
}
