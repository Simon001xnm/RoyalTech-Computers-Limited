import type { Metadata } from "next";
import { TrackingClient } from "./components/tracking-client";

export const metadata: Metadata = {
  title: 'Asset Tracking',
  description: 'Track asset locations in real-time.',
};

export default function TrackingPage() {
  return <TrackingClient />;
}
