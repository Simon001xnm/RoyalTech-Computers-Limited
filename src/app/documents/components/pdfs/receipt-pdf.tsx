'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * Converts numbers to professional English words (KES Specific)
 */
function numberToWords(num: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

  if (num === 0) return 'ZERO';

  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    return n.toString();
  };

  return convert(Math.floor(num)) + ' SHILLINGS ONLY';
}

/**
 * @fileOverview Professional Receipt Design
 * strictly follows the indigo layout: Logo Right, Title Left, words for totals.
 */
export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  
  const customer = data.customer || {
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { items, amount, subtotal, vat, applyVat } = data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 5).toUpperCase();
  const companyName = workspace?.name || 'BUSINESS NAME';
  const primaryColor = "#7c3aed"; // Indigo Theme

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border selection:bg-indigo-100">
      
      {/* HEADER SECTION: Title Left, Logo Right */}
      <header className="flex justify-between items-start mb-12">
        <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tighter" style={{ color: primaryColor }}>Receipt</h1>
            <div className="space-y-1 text-[13px] font-medium text-black">
                <p><span className="w-28 inline-block opacity-60 uppercase font-black text-[10px]">Receipt No</span> <span className="font-bold text-lg">{workspace?.receiptPrefix || 'RCT'}{receiptNo}</span></p>
                <p><span className="w-28 inline-block opacity-60 uppercase font-black text-[10px]">Receipt Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-24 w-24 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
        </div>
      </header>

      {/* BILLING BLOCKS: Side by Side */}
      <section className="grid grid-cols-2 gap-6 mb-12">
        <div className="p-6 rounded-2xl space-y-2 border border-indigo-50" style={{ backgroundColor: '#f5f3ff' }}>
            <h3 className="font-black uppercase text-[10px] tracking-widest mb-2" style={{ color: primaryColor }}>Billed By</h3>
            <p className="font-black text-base uppercase leading-tight">{companyName}</p>
            <div className="text-black font-bold space-y-0.5 mt-2">
                <p className="opacity-80">{workspace?.address || 'Kenya'}</p>
                <p className="opacity-80">{workspace?.phone}</p>
                <p className="opacity-80">{workspace?.email}</p>
            </div>
        </div>
        <div className="p-6 rounded-2xl space-y-2 border border-indigo-50" style={{ backgroundColor: '#f5f3ff' }}>
            <h3 className="font-black uppercase text-[10px] tracking-widest mb-2" style={{ color: primaryColor }}>Billed To</h3>
            <p className="font-black text-base uppercase leading-tight">{customer.name}</p>
            <div className="text-black font-bold space-y-0.5 mt-2">
                <p className="opacity-80">{customer.address || 'Nairobi, Kenya'}</p>
                <p className="opacity-80">{customer.phone}</p>
                <p className="opacity-80">{customer.email || 'N/A'}</p>
            </div>
        </div>
      </section>

      {/* ITEM TABLE SECTION */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryColor }}>
                    <th className="py-4 px-4 font-black uppercase text-[10px] tracking-widest rounded-l-xl">Item</th>
                    <th className="py-4 px-2 text-center font-black uppercase text-[10px] tracking-widest w-20">TAX Rate</th>
                    <th className="py-4 px-2 text-center font-black uppercase text-[10px] tracking-widest w-20">Qty</th>
                    <th className="py-4 px-2 text-right font-black uppercase text-[10px] tracking-widest w-24">Rate</th>
                    <th className="py-4 px-2 text-right font-black uppercase text-[10px] tracking-widest w-24">Amount</th>
                    <th className="py-4 px-2 text-right font-black uppercase text-[10px] tracking-widest w-24">TAX</th>
                    <th className="py-4 px-4 text-right font-black uppercase text-[10px] tracking-widest w-32 rounded-r-xl">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: SaleItem, idx: number) => {
                    const rowSubtotal = item.price * item.quantity;
                    const rowTax = applyVat ? rowSubtotal * 0.16 : 0;
                    return (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-6 px-4 align-top">
                                <p className="font-black text-sm text-black uppercase">{item.name}</p>
                                {item.serialNumber && <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">S/N: {item.serialNumber}</p>}
                            </td>
                            <td className="py-6 px-2 align-top text-center font-bold text-black">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-6 px-2 align-top text-center font-bold text-black">{item.quantity}</td>
                            <td className="py-6 px-2 align-top text-right font-bold text-black">{formatCurrency(item.price)}</td>
                            <td className="py-6 px-2 align-top text-right font-bold text-black">{formatCurrency(rowSubtotal)}</td>
                            <td className="py-6 px-2 align-top text-right font-bold text-black">{formatCurrency(rowTax)}</td>
                            <td className="py-6 px-4 align-top text-right font-black text-black">KES {formatCurrency(rowSubtotal + rowTax)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* TOTALS FOOTER BLOCK */}
        <div className="flex justify-between items-start mt-12 pt-8 border-t-2 border-black">
            <div className="max-w-[400px]">
                <h4 className="font-black uppercase text-[10px] tracking-widest opacity-60 mb-2">Total Amount In Words</h4>
                <p className="text-[13px] font-black text-black underline decoration-indigo-200 underline-offset-4">
                    {numberToWords(amount)}
                </p>
            </div>
            
            <div className="w-[320px] space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-black uppercase text-[10px] tracking-widest opacity-60">Subtotal</span>
                    <span className="font-bold text-black">KES {formatCurrency(subtotal || amount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-black uppercase text-[10px] tracking-widest opacity-60">Total TAX</span>
                    <span className="font-bold text-black">KES {formatCurrency(vat || 0)}</span>
                </div>
                
                <div className="pt-6 border-t-4 border-black border-double flex justify-between items-center">
                    <span className="text-xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>Grand Total</span>
                    <span className="text-2xl font-black text-black">KES {formatCurrency(amount)}</span>
                </div>
            </div>
        </div>
      </section>

      {/* FINAL COMPLIANCE FOOTER */}
      <footer className="mt-auto pt-20 border-t border-gray-100">
         <div className="text-center space-y-2 mb-8">
            <p className="text-[13px] font-bold text-black">
                For any enquiry, please contact us at <span className="underline">{workspace?.email}</span> or call <span className="font-black">{workspace?.phone}</span>
            </p>
         </div>
         
         <div className="flex justify-between items-end pt-6">
            <div className="text-[9px] font-black uppercase tracking-widest opacity-30">
                Processed By: {docSnapshot.createdBy?.name || 'System Node'}
            </div>
            <div className="text-center space-y-1">
                <div className="h-1 w-32 bg-black mx-auto"></div>
                <p className="text-[9px] font-black uppercase tracking-widest">Authorized Signatory</p>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest opacity-30">
                Printed: {format(new Date(), "yyyy-MM-dd HH:mm")}
            </div>
         </div>
         <p className="text-center text-[10px] font-bold text-gray-400 mt-10">
            This is a computer generated document. No physical signature is required.
         </p>
      </footer>
    </div>
  );
}
