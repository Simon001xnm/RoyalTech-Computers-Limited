import { TrackingClient } from "./components/tracking-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asset Tracking",
  description: "Live GPS tracking for your leased hardware units.",
};

export default function TrackingPage() {
  return <TrackingClient />;
}
