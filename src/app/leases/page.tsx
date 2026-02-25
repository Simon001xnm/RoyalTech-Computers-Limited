import type { Metadata } from "next";
import { LeasesClient } from "./components/leases-client";

export const metadata: Metadata = {
  title: "Lease Tracking",
  description: "Manage laptop lease agreements for RoyalTech.",
};

export default function LeasesPage() {
  return <LeasesClient />;
}

