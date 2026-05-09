import type { Metadata } from "next";
import { DocumentsClient } from "./components/documents-client";

export const metadata: Metadata = {
  title: "Document Generation",
  description: "Generate and manage professional documents for your node.",
};

export default function DocumentsPage() {
  return <DocumentsClient />;
}
