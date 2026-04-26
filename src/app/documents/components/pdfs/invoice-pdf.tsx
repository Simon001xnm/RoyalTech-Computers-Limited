
'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

const VAT_RATE = 0.16;

export function InvoicePdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, items, details, subtotal, vat, total, applyVat } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const primaryColor = company?.primaryColor || '#22345e';

  return (
    <div className="print-container p-[20mm] font-sans text-sm bg-white text-gray-800 w-[210mm] min-h-[297mm] flex flex-col box-border">
      {/* Header */}
      <header className="flex justify-between items-start pb-4">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
          ) : (
            <div className="h-24 w-24 bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
              <h1 className="text-2xl font-bold uppercase" style={{ color: primaryColor }}>{company?.name || 'Your Company'}</h1>
              <p className="text-[11px] text-gray-600 mt-1">{company?.address}</p>
              <p className="text-[11px] text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-4xl font-light uppercase text-gray-400">Invoice</h2>
        </div>
      </header>

      <div className="h-[2px] w-full mb-8" style={{ backgroundColor: primaryColor }}></div>

      {/* Bill To & Invoice Info */}
      <section className="flex justify-between mt-8 mb-10">
        <div className="max-w-[50%]">
          <h3 className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider mb-2">Bill To:</h3>
          {customer ? (
            <>
              <p className="font-bold text-lg">{customer.name}</p>
              <p className="text-gray-600 leading-tight mt-1">{customer.address || 'Address not specified'}</p>
              <p className="text-gray-600 leading-tight">{customer.email}</p>
              {customer.phone && <p className="text-gray-600 leading-tight">Tel: {customer.phone}</p>}
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
           <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
             <span className="font-bold text-gray-600 text-right">Invoice No:</span>
             <span className="text-gray-900 font-mono">{document.title}</span>
             <span className="font-bold text-gray-600 text-right">Date:</span>
             <span className="text-gray-900">{format(new Date(document.generatedDate), "PPP")}</span>
             <span className="font-bold text-gray-600 text-right">Due Date:</span>
             <span className="text-gray-900">{format(new Date(document.generatedDate), "PPP")}</span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section className="mt-4">
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-3 font-bold text-[11px] uppercase tracking-widest border-none rounded-tl-lg">Description</th>
              <th className="p-3 font-bold text-[11px] uppercase tracking-widest text-right w-24 border-none">Qty</th>
              <th className="p-3 font-bold text-[11px] uppercase tracking-widest text-right w-32 border-none">Unit Price</th>
              <th className="p-3 font-bold text-[11px] uppercase tracking-widest text-right w-32 border-none rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
                items.map((item: DocumentLineItem, index: number) => (
                    <tr key={index} className="border-b bg-gray-50/30">
                        <td className="p-4 text-sm font-medium">{item.description}</td>
                        <td className="p-4 text-right text-sm">{item.quantity}</td>
                        <td className="p-4 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-4 text-right font-bold text-sm">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                ))
            ) : (
                <tr className="border-b">
                    <td colSpan={4} className="p-4 text-center text-gray-500 italic">No items listed.</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      {/* Notes & Totals */}
      <section className="flex justify-between mt-8 items-start">
         <div className="w-[55%]">
            {details && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[10px] uppercase mb-2">Internal Notes:</h3>
                    <p className="text-[11px] text-gray-600 italic leading-relaxed">{details}</p>
                </div>
            )}
            <div className="mt-8">
                <h4 className="font-bold text-[10px] uppercase text-gray-500 mb-2">Payment Terms</h4>
                <p className="text-[10px] text-gray-400">Payment is due upon receipt of invoice. Bank transfers should be addressed to {company?.name || 'the company'}. Goods once sold cannot be returned.</p>
            </div>
         </div>
        <div className="w-[35%] space-y-2">
             <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                <span className="font-medium text-gray-500">Subtotal:</span>
                <span className="text-right font-bold">{formatCurrency(subtotal || 0)}</span>
            </div>
             {applyVat && <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                <span className="font-medium text-gray-500">VAT ({(VAT_RATE * 100).toFixed(0)}%):</span>
                <span className="text-right font-bold text-red-700">{formatCurrency(vat || 0)}</span>
            </div>}
            <div className="flex justify-between py-3 pt-4">
                <span className="font-black text-lg text-gray-900 uppercase">Total Due:</span>
                <span className="text-right font-black text-lg" style={{ color: primaryColor }}>{formatCurrency(total || 0)}</span>
            </div>
            <div className="h-1 w-full mt-2" style={{ backgroundColor: primaryColor, opacity: 0.1 }}></div>
        </div>
      </section>
      
      <div className="flex-grow"></div>

      {/* Footer */}
      <footer className="text-[10px] text-gray-400 border-t pt-8 mt-12">
        <div className="flex justify-between items-center w-full">
            <div className="space-y-1">
                <p className="font-bold text-gray-600">Authorized Signature:</p>
                <div className="h-10 w-48 border-b border-dashed border-gray-300"></div>
                <p className="uppercase">{company?.name || 'Your Business Name'}</p>
            </div>
            <div className="text-right">
                <p className="font-black text-gray-800 uppercase tracking-widest text-[12px]">THANK YOU FOR YOUR BUSINESS</p>
                <p className="mt-1">For support, please contact: {company?.email}</p>
            </div>
        </div>

        <div className="text-center text-[9px] text-gray-300 mt-10 uppercase tracking-tighter border-t border-gray-100 pt-2">
            System generated by Professional ERP Suite & bull; Powered by simonstyless technologies limited
        </div>
      </footer>
    </div>
  );
}
