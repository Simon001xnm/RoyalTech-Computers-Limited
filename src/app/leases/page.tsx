import type { Metadata } from "next";
import { LeasesClient } from "./components/leases-client";

export const metadata: Metadata = {
  title: "Lease Tracking",
  description: "Enterprise lifecycle management for hardware lease agreements.",
};

export default function LeasesPage() {
  return <LeasesClient />;
}