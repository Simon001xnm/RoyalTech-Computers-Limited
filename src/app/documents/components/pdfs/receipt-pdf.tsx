'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSaaS } from '@/components/saas/saas-provider';

const VAT_RATE = 0.16;

export function ReceiptPdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const company = useLiveQuery(
    async () => tenant?.id ? await db.companies.get(tenant.id) : null,
    [tenant?.id]
  );

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, items, paymentMethod, referenceCode, amount, amountPaid, changeDue, subtotal, totalDiscount, vat, createdBy, applyVat } = document.data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(value || 0);
  };
  
  const receiptNumber = document.title.split('-').pop() || 'N/A';
  const finalTotal = amount || subtotal || 0;
  const primaryColor = company?.primaryColor || '#2c3e50';

  return (
    <div className="p-[20mm] font-sans text-sm bg-white text-gray-900 w-[210mm] min-h-[297mm] flex flex-col box-border">
      {/* Header */}
      <header className="flex justify-between items-start pb-6 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
          ) : (
            <div className="h-24 w-24 bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase" style={{ color: primaryColor }}>{company?.name || 'Your Company'}</h1>
            <p className="text-[11px] text-gray-500 mt-1">{company?.address}</p>
            <p className="text-[11px] text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-4xl font-light uppercase text-gray-300">CASH SALE</h2>
            <p className="font-mono text-sm tracking-tighter mt-1">{document.title}</p>
        </div>
      </header>

      {/* Bill To & Receipt Info */}
      <section className="flex justify-between mt-10 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div>
          <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest mb-2">Customer Details:</h3>
          {customer ? (
            <>
              <p className="font-black text-lg uppercase">{customer.name}</p>
              <p className="text-gray-500 text-xs mt-1">{customer.phone || 'Contact not specified'}</p>
              <p className="text-gray-500 text-xs">{customer.email}</p>
            </>
          ) : (
            <p className="font-black text-lg uppercase">General Walk-in Client</p>
          )}
        </div>
        <div className="text-right flex flex-col justify-center">
           <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs">
             <span className="font-bold text-gray-500 uppercase">Receipt No:</span>
             <span className="font-black">{receiptNumber}</span>
             <span className="font-bold text-gray-500 uppercase">Date:</span>
             <span>{format(new Date(document.generatedDate), "PPP")}</span>
             <span className="font-bold text-gray-500 uppercase">Served by:</span>
             <span>{createdBy?.name || 'System Administrator'}</span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section>
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-4 font-bold text-[11px] uppercase border-none rounded-tl-lg">Description</th>
              <th className="p-4 font-bold text-[11px] uppercase text-right w-24 border-none">Qty</th>
              <th className="p-4 font-bold text-[11px] uppercase text-right w-32 border-none">Unit Price</th>
              <th className="p-4 font-bold text-[11px] uppercase text-right w-32 border-none rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item: SaleItem, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4">
                        <p className="font-bold text-sm">{item.name}</p>
                        {item.serialNumber && <span className="text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded font-mono block w-fit mt-1">S/N: {item.serialNumber}</span>}
                    </td>
                    <td className="p-4 text-right text-sm">{item.quantity}</td>
                    <td className="p-4 text-right text-sm">{formatCurrency(item.price)}</td>
                    <td className="p-4 text-right font-bold text-sm">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))
            ) : (
                <tr className="border-b">
                    <td className="p-4">Payment for {document.relatedTo || 'services/goods'}</td>
                    <td className="p-4 text-right">1</td>
                    <td className="p-4 text-right">{formatCurrency(finalTotal)}</td>
                    <td className="p-4 text-right font-bold">{formatCurrency(finalTotal)}</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      {/* Totals & Payment Info */}
      <section className="flex justify-between mt-10 items-start">
         <div className="w-[50%]">
            <h3 className="font-bold text-gray-500 text-[10px] uppercase mb-3">Transaction Details</h3>
            <div className="space-y-2">
                <p className="text-xs bg-muted/50 p-2 rounded border inline-block">
                    <span className="font-bold text-gray-600 uppercase">Method:</span> {paymentMethod || 'N/A'}
                </p>
                {referenceCode && (
                    <p className="text-xs block">
                        <span className="font-bold text-gray-600 uppercase">Reference:</span> <span className="font-mono">{referenceCode}</span>
                    </p>
                )}
            </div>
            <div className="mt-8 p-6 border-2 rounded-2xl w-fit" style={{ backgroundColor: primaryColor + '08', borderColor: primaryColor }}>
                <p className="font-black text-2xl uppercase tracking-tighter" style={{ color: primaryColor }}>PAID IN FULL</p>
            </div>
         </div>
        <div className="w-[35%] space-y-2">
             <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                <span className="font-medium text-gray-500">Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal || finalTotal)}</span>
            </div>
             {(totalDiscount ?? 0) > 0 && (
                 <div className="flex justify-between py-1 text-red-600 border-b border-gray-100 italic">
                    <span className="font-medium">Discount Applied:</span>
                    <span className="font-bold">- {formatCurrency(totalDiscount)}</span>
                </div>
            )}
            {applyVat && (vat ?? 0) > 0 && (
                <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                    <span className="font-medium text-gray-500">VAT ({(VAT_RATE * 100).toFixed(0)}%):</span>
                    <span className="font-bold">{formatCurrency(vat)}</span>
                </div>
            )}
            <div className="flex justify-between py-4">
                <span className="font-black text-xl text-gray-900 uppercase tracking-tighter">Amount Paid:</span>
                <span className="text-right font-black text-xl" style={{ color: primaryColor }}>{formatCurrency(finalTotal)}</span>
            </div>
             {(changeDue ?? 0) > 0 && (
                <div className="flex justify-between py-2 border-t-2 border-dashed border-gray-200">
                    <span className="font-bold text-green-700 text-xs uppercase">Balance Returned:</span>
                    <span className="font-black text-green-700">{formatCurrency(changeDue)}</span>
                </div>
             )}
        </div>
      </section>
      
      <div className="flex-grow"></div>

      {/* Footer */}
      <footer className="text-[10px] text-gray-400 border-t-2 pt-8 mt-16 text-center space-y-4" style={{ borderColor: primaryColor }}>
         <p className="font-black text-gray-700 uppercase tracking-widest text-lg">Thank you for choosing {company?.name || 'us'}!</p>
         <p className="max-w-[80%] mx-auto leading-relaxed">
           Software licenses once activated are non-refundable. Hardware items may be subject to a manufacturer's warranty. Goods once sold cannot be returned or exchanged without a valid authorization.
         </p>
         <div className="text-[9px] text-gray-300 pt-6 border-t border-gray-100 flex justify-between items-center uppercase font-bold">
            <span>OFFICIAL RECEIPT COPY</span>
            <span>powered by simonstyless technologies limited</span>
        </div>
      </footer>
    </div>
  );
}
