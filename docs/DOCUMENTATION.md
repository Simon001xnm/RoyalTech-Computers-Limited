
# Document Generation

This document outlines how to generate, view, and download PDF documents within the RoyalTech application.

## Overview

The document generation system is built to create professional PDF files for various business needs such as invoices, receipts, and delivery notes. It leverages the `jspdf` and `jspdf-autotable` libraries to create documents on the client-side.

## Features

-   **Dynamic PDF Generation**: Create PDFs from application data in real-time.
-   **Multiple Document Types**: Supports Invoices, Receipts, Proforma Invoices, Quotations, LPOs, Repair Notes, and Delivery Notes.
-   **Manual Item Entry**: For documents like Quotations and Invoices, you can manually add line items (description, quantity, price) for services or products not in inventory.
-   **VAT Calculation**: Option to apply VAT to Quotations and Receipts.
-   **PDF Preview**: View a generated document in a dialog before downloading.
-   **Download**: Save the generated PDF file directly to your computer.
-   **Printing**: Use the browser's built-in print functionality (Ctrl/Cmd + P) from the preview dialog to print documents.
-   **Editing**: The generated PDFs are not directly editable within the application. To make changes, you should modify the source data (e.g., the lease details) and regenerate the document.

## How it Works

1.  **UI (`src/app/documents/components/documents-client.tsx`)**: The user selects a document type and provides relevant information through the form on the "Documents" page. This can include selecting an existing customer, adding manual line items, and toggling VAT.

2.  **Data Persistence**: When a document is generated, a record is saved to the `documents` collection in Firestore. This record includes the document type, title, generation date, and a `data` field containing a snapshot of all the information used to create the document (e.g., customer details, line items, totals).

3.  **No Inventory Impact**: Generating documents from this module **does not** affect your inventory status (e.g., marking a laptop as "Sold"). This allows you to create quotations and proforma invoices freely. Inventory is only updated when a final sale is processed through the Point of Sale (POS) module.

4.  **PDF Components (`src/app/documents/components/pdfs/*.tsx`)**: For each document type, there is a corresponding React component that defines the HTML structure and layout for the PDF preview. This allows for easy styling and arrangement of content.

5.  **PDF Generation Logic (`src/app/documents/components/documents-client.tsx`)**: The `handleDownloadPdf` function takes a document object, renders the appropriate PDF component in a hidden dialog, captures it as an image using `html2canvas`, and then uses `jspdf` to place that image into a PDF file for download.

6.  **Viewing and Downloading**:
    -   Clicking "View" on a generated document opens a dialog with the corresponding PDF component rendered inside, giving you a live preview.
    -   Clicking "Download" triggers the `handleDownloadPdf` function, which compiles the document and initiates a browser download.

## Creating a New Document Type

To add a new type of document:

1.  **Update `src/types/index.ts`**: Add your new document type to the `DocumentType` union type.
2.  **Update the UI**: In `documents-client.tsx`, add a new tab and form section for your new document type.
3.  **Create a PDF Component**: Create a new `.tsx` file under `src/app/documents/components/pdfs/` for the preview layout of your new document.
4.  **Update `documents-client.tsx`**: Add the new document type to the `renderPdfPreview` function to link your new PDF component.
5.  **Update `document-columns.tsx`**: Add your new document type to the `documentIcons` object.

This modular approach ensures that the document generation system is easily extensible.
