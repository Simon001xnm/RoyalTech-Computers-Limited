import { StockClient } from "./components/stock-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage your unified stock items and high-value assets.",
};

export default function InventoryPage() {
  return <StockClient />;
}
