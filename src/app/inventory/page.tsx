import { StockClient } from "../stock/components/stock-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage your stock items and high-value assets.",
};

export default function InventoryPage() {
  return <StockClient />;
}
