
'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

const VAT_RATE = 0.16;

export function ReceiptPdf({ document }: { document: AppDocument }) {
  const company = useLiveQuery(() => db.companies.toCollection().last());

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, items, paymentMethod, referenceCode, amount, amountPaid, changeDue, customerPhone, id: saleId, subtotal, totalDiscount, vat, createdBy, applyVat } = document.data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(value || 0);
  };
  
  const receiptNumber = document.title.split('-').pop() || saleId?.slice(0, 5).toUpperCase() || 'N/A';
  const finalTotal = amount || subtotal || 0;
  const primaryColor = company?.primaryColor || '#2c3e50';

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-900 w-full min-h-[800px] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start pb-6 border-b" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" />
          ) : (
            <div className="h-28 w-28 bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
            <h1 className="text-3xl font-bold uppercase" style={{ color: primaryColor }}>{company?.name || 'Your Company'}</h1>
            <p className="text-xs text-gray-500 mt-1">{company?.address}</p>
            <p className="text-xs text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-3xl font-semibold uppercase text-gray-700">CASH SALE</h2>
        </div>
      </header>

      {/* Bill To & Receipt Info */}
      <section className="flex justify-between mt-8 mb-10">
        <div>
          <h3 className="font-semibold text-gray-500 mb-2">Receipt For:</h3>
          {customer ? (
            <>
              <p className="font-bold">{customer.name}</p>
              <p>{customer.address || customerPhone || 'Contact not specified'}</p>
              <p>{customer.email}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
           <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
             <span className="font-semibold text-gray-500">Receipt No:</span>
             <span>{receiptNumber}</span>
             <span className="font-semibold text-gray-500">Date:</span>
             <span>{format(new Date(document.generatedDate), "PPP")}</span>
             <span className="font-semibold text-gray-500">Served by:</span>
             <span>{createdBy?.name || 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section>
        <table className="w-full text-left table-auto">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-3 font-semibold">Item Description</th>
              <th className="p-3 font-semibold text-right w-24">Quantity</th>
              <th className="p-3 font-semibold text-right w-32">Unit Price</th>
              <th className="p-3 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item: SaleItem, index: number) => (
                <tr key={item.id || index} className="border-b bg-gray-50">
                    <td className="p-3">
                        {item.name}
                        {item.serialNumber && <span className="text-xs text-gray-500 block">S/N: {item.serialNumber}</span>}
                    </td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))
            ) : (
                <tr className="border-b">
                    <td className="p-3">Payment for {document.relatedTo || 'services/goods'}</td>
                    <td className="p-3 text-right">1</td>
                    <td className="p-3 text-right">{formatCurrency(finalTotal)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(finalTotal)}</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      {/* Totals & Payment Info */}
      <section className="flex justify-between mt-6 items-start">
         <div className="w-1/2">
            <h3 className="font-semibold text-gray-500 mb-2">Payment Details</h3>
            <p className="text-sm">
                <span className="font-medium">Method:</span> {paymentMethod || 'N/A'}
            </p>
            {referenceCode && (
                 <p className="text-sm">
                    <span className="font-medium">Reference:</span> {referenceCode}
                 </p>
            )}
            <div className="mt-4 p-4 border rounded-md" style={{ backgroundColor: company?.secondaryColor || '#ecfdf5', borderColor: primaryColor, color: primaryColor }}>
                <p className="font-bold text-lg">PAID IN FULL</p>
            </div>
         </div>
        <div className="w-full max-w-xs">
             <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-500">Subtotal</span>
                <span>{formatCurrency(subtotal || finalTotal)}</span>
            </div>
             {(totalDiscount ?? 0) > 0 && (
                 <div className="flex justify-between py-2 text-red-600">
                    <span className="font-semibold">Discount</span>
                    <span>- {formatCurrency(totalDiscount)}</span>
                </div>
            )}
            {applyVat && (vat ?? 0) > 0 && (
                <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-500">VAT ({(VAT_RATE * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(vat)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-lg py-3 border-t" style={{ borderColor: primaryColor }}>
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
            </div>
             <div className="flex justify-between py-2 border-t mt-2">
                <span className="font-semibold text-gray-500">Amount Paid</span>
                <span>{formatCurrency(amountPaid)}</span>
            </div>
             {(changeDue ?? 0) > 0 && (
                <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-500">Change Given</span>
                    <span>{formatCurrency(changeDue)}</span>
                </div>
             )}
        </div>
      </section>
      
      <div className="flex-grow"></div>

      {/* Footer */}
      <footer className="text-xs text-gray-500 border-t pt-6 mt-16 text-center" style={{ borderColor: primaryColor }}>
         <p className="font-bold text-gray-700">Thank you for your business!</p>
         <p className="mt-4">
           Software money once received is not refundable and goods once sold cannot be returned.
         </p>
         <div className="text-[10px] text-muted-foreground pt-4 border-t mt-4">
            powered by simonstyless technologies limited
        </div>
      </footer>
    </div>
  );
}
