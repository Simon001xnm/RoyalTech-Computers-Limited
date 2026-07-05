
import type { Metadata } from "next";
import { StockClient } from "./components/stock-client";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage your stock items and high-value assets with precision.",
};

export default function StockPage() {
  return <StockClient />;
}
