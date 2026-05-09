import type { Metadata } from "next";
import { StockClient } from "./components/stock-client";

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Comprehensive hardware inventory and asset tracking.",
};

export default function StockPage() {
  return <StockClient />;
}