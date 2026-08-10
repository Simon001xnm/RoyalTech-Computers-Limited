import { StockClient } from "./components/stock-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laptops & Assets",
  description: "Manage your high-value hardware inventory and leased units.",
};

export default function LaptopsPage() {
  return <StockClient />;
}
