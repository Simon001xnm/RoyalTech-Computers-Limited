import type { Metadata } from "next";
import { CustomersClient } from "./components/customers-client";

export const metadata: Metadata = {
  title: "Customer Management",
  description: "Manage customer records and CRM activities.",
};

export default function CustomersPage() {
  return <CustomersClient />;
}
