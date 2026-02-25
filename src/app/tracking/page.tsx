import type { Metadata } from "next";
import { TrackingClient } from "./components/tracking-client";

export const metadata: Metadata = {
  title: "Laptop Tracking",
  description: "Track laptop locations for RoyalTech.",
};

export default function TrackingPage() {
  return <TrackingClient />;
}

