import type { Metadata } from "next";
import { StockClient } from "./components/stock-client";

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Manage laptop inventory for RoyalTech.",
};

export default function StockPage() {
  return <StockClient />;
}

