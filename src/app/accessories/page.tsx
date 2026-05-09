import type { Metadata } from "next";
import { AccessoriesClient } from "./components/accessories-client";

export const metadata: Metadata = {
  title: "Accessories Inventory",
  description: "Manage accessory inventory for your business node.",
};

export default function AccessoriesPage() {
  return <AccessoriesClient />;
}
