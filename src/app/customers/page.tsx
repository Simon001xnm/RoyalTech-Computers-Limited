import type { Metadata } from "next";
import { CustomersClient } from "./components/customers-client";

export const metadata: Metadata = {
  title: "Customer Management",
  description: "Manage customer records for RoyalTech.",
};

export default function CustomersPage() {
  return <CustomersClient />;
}

