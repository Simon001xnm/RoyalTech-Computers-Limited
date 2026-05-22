
import type { Metadata } from "next";
import { StockClient } from "./components/stock-client";

export const metadata: Metadata = {
  title: "Asset Inventory",
  description: "Manage your high-value hardware assets with serial number precision.",
};

export default function StockPage() {
  return <StockClient />;
}
