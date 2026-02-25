
import type { Metadata } from "next";
import { ResellersClient } from "./components/resellers-client";

export const metadata: Metadata = {
    title: "Resellers",
    description: "Manage reseller accounts and track issued items.",
};

export default function ResellersPage() {
    return <ResellersClient />;
}
