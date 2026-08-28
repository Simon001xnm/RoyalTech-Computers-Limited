
# Document Generation & System Stability

This document outlines how to generate documents and how the system maintains stability as your data grows.

## Overview

The document generation system is built to create professional PDF files for invoices, receipts, and more. Data is stored in **Google Cloud Firestore**, ensuring enterprise-grade reliability.

## Features

- **Dynamic PDF Generation**: Create PDFs from application data in real-time.
- **Multiple Document Types**: Supports Invoices, Receipts, Proforma Invoices, Quotations, LPOs, Repair Notes, and Delivery Notes.
- **VAT Calculation**: Automatic 16% VAT application for tax compliance.
- **Integrated Dashboard**: All paperwork generated here automatically updates your main shop sales and profit metrics.

## Data Storage & Future Scaling

### Where is data stored?
All documents and transaction records are stored in **Google Cloud Firestore**. This is a globally distributed NoSQL database that offers 99.999% durability.

### Handling 10,000+ Documents
The system is architected to handle millions of records. As your shop grows to 10,000+ documents:
1. **No Performance Loss**: We use database "Indexing" to ensure that searching for an invoice remains instant, regardless of how many records exist.
2. **Infinite Capacity**: Storage scales automatically. You will never run out of "disk space" on the cloud.
3. **Automated Backups**: Google Cloud replicates your data across multiple physical zones to prevent data loss.

## Stability & "Zero-Crash" Strategy

To ensure the app remains fast and never "crushes" under heavy load, the following protocols are enforced:

1. **Pagination**: The UI only loads small "chunks" of data at a time (e.g., 10 or 25 rows). This prevents memory overload on your devices.
2. **Optimized Queries**: Every search is backed by a database index, preventing "slow-query" timeouts.
3. **Edge Performance**: The app uses client-side caching. If your internet flickers, the app remains responsive and synchronizes data in the background once the connection is restored.
4. **Serverless Architecture**: The system has no fixed server limits. It automatically allocates more computing power during busy sales periods.

## Costs & Business Continuity

### Is my data safe if Firestore "closes"?
Firestore is a major Google product and is not scheduled for closure. However, the system includes **CSV Export Tools** in the Settings module. This allows you to download your entire database at any time, ensuring you are never "locked in" to one provider.

### Will I be billed?
The system operates within the **Firebase Free Tier**:
- **50,000 Free Reads per day**: Enough for most shops.
- **20,000 Free Writes per day**: Enough for thousands of daily sales.
- **1GB Free Storage**: Enough for roughly 200,000+ text documents.
Charges only apply if you manually upgrade your account and your business volume grows to an enterprise level.

## Document Generation Logic
The `handleDownloadPdf` function takes a document object, renders the appropriate component in a hidden container, and uses `html2canvas` and `jspdf` to compile a professional A4 or Thermal file.
