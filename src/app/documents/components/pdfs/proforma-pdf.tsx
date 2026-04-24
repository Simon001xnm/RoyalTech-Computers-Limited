'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSaaS } from '@/components/saas/saas-provider';

const VAT_RATE = 0.16;

export function ProformaInvoicePdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  
  // SECURE QUERY: Filter by active tenantId to prevent cross-account leakage
  const company = useLiveQuery(
    async () => tenant?.id ? await db.companies.get(tenant.id) : null,
    [tenant?.id]
  );

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, items, details, subtotal, vat, total, applyVat, invoiceType, leaseDetails } = document.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };
  
  const isLease = invoiceType === 'lease' && leaseDetails;
  const companyName = company?.name || 'The Company';

  return (
    <div className="p-[20mm] font-sans text-sm bg-white text-gray-900 w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start pb-4 border-b">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" />
          ) : (
            <div className="h-28 w-28 bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
              <p className="font-bold text-lg uppercase text-black">{companyName}</p>
              <p className="text-xs text-gray-500">{company?.address}</p>
              <p className="text-xs text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-semibold uppercase">Proforma Invoice</h2>
        </div>
      </header>

      <section className="flex justify-between mt-6 mb-8">
        <div>
          <h3 className="font-bold mb-1">Bill To:</h3>
          {customer ? (
            <>
              <p className="font-semibold">{customer.name}</p>
              <p>{customer.address || 'Address not specified'}</p>
              <p>{customer.email}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 text-right">
             <span className="font-bold">Proforma No:</span>
             <span>{document.title}</span>
             <span className="font-bold">Date:</span>
             <span>{format(new Date(document.generatedDate), "PPP")}</span>
          </div>
        </div>
      </section>

      <section>
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 font-bold">Description</th>
              <th className="p-2 font-bold text-right w-24">Quantity</th>
              <th className="p-2 font-bold text-right w-32">{isLease ? 'Lease Terms' : 'Unit Price'}</th>
              <th className="p-2 font-bold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLease ? (
                 <tr className="border-b">
                    <td className="p-2">{leaseDetails.description}</td>
                    <td className="p-2 text-right">{leaseDetails.quantity}</td>
                    <td className="p-2 text-right">{`${leaseDetails.duration} ${leaseDetails.durationUnit} @ ${formatCurrency(leaseDetails.rate)}`}</td>
                    <td className="p-2 text-right">{formatCurrency(subtotal || 0)}</td>
                </tr>
            ) : items && items.length > 0 ? (
                items.map((item: DocumentLineItem, index: number) => (
                    <tr key={index} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                ))
            ) : (
                 <tr className="border-b">
                    <td colSpan={4} className="p-2 text-center text-gray-500">No items available.</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      <section className="flex justify-end mt-6">
        <div className="w-full md:w-1/3">
             <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal || 0)}</span>
            </div>
             {applyVat && <div className="flex justify-between py-1">
                <span>VAT ({(VAT_RATE * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(vat || 0)}</span>
            </div>}
            <div className="flex justify-between font-bold text-base py-2 border-t mt-2">
                <span>Total Amount</span>
                <span>{formatCurrency(total || 0)}</span>
            </div>
        </div>
      </section>
      
      {details && (
        <section className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-1 text-xs text-gray-500 uppercase">Notes:</h3>
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{details}</p>
        </section>
      )}

      <div className="flex-grow"></div>

      <footer className="text-xs text-gray-700 border-t pt-4 mt-8 space-y-4">
        <div className="text-center font-bold">
            <p>This is not a tax invoice. A final invoice will be issued upon payment.</p>
        </div>
        <div>
            <h4 className="font-bold uppercase mb-1">Bank Payment Details</h4>
            <div className="grid grid-cols-2 gap-x-4 text-[11px]">
                <div>
                    <p><span className="font-semibold">BANK:</span> Please contact support</p>
                    <p><span className="font-semibold">ACC NAME:</span> {companyName}</p>
                </div>
                 <div className="text-right">
                    <p>Thank you for choosing us!</p>
                    <p className="text-[9px] text-muted-foreground pt-4 uppercase">powered by simonstyless technologies limited</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
