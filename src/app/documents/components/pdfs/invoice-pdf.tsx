'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
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
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convert(n % 100) : '');
    return n.toString();
  };

  return convert(Math.floor(num)) + ' SHILLINGS ONLY';
}

/**
 * @fileOverview Professional Invoice Design
 * Matches the requested indigo layout provided in the reference image.
 */
export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
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
    name: data.customerName || 'VALUED CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { items, subtotal, vat, total, applyVat } = data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const invoiceNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 5).toUpperCase();
  const companyName = workspace?.name || 'BUSINESS NAME';
  const primaryIndigo = "#7c3aed"; 
  const secondaryIndigo = "#f5f3ff";

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      
      {/* HEADER SECTION: Title Left, Logo Right */}
      <header className="flex justify-between items-start mb-8">
        <div className="space-y-4">
            <h1 className="text-4xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Invoice</h1>
            <div className="space-y-1 text-[13px] font-medium text-black">
                <p><span className="w-28 inline-block opacity-60">Invoice No</span> <span className="font-bold">{workspace?.invoicePrefix || 'INV'}{invoiceNo}</span></p>
                <p><span className="w-28 inline-block opacity-60">Invoice Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
                <p><span className="w-28 inline-block opacity-60">Due Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
        </div>
      </header>

      {/* BILLING BLOCKS: Side by Side with Indigo Background */}
      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-lg space-y-1" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[16px] mb-2" style={{ color: primaryIndigo }}>Billed By</h3>
            <p className="font-bold text-sm uppercase">{companyName}</p>
            <p className="text-xs font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-6 rounded-lg space-y-1" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[16px] mb-2" style={{ color: primaryIndigo }}>Billed To</h3>
            <p className="font-bold text-sm">{customer.name}</p>
            <p className="text-xs font-medium text-black/70">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="text-xs font-medium text-black/70">{customer.phone}</p>
        </div>
      </section>

      {/* ITEM TABLE SECTION with Indigo Headers */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-4 font-bold text-xs rounded-l-sm">Item</th>
                    <th className="py-2 text-right font-bold text-xs w-20">TAX Rate</th>
                    <th className="py-2 text-right font-bold text-xs w-20">Quantity</th>
                    <th className="py-2 text-right font-bold text-xs w-24">Rate</th>
                    <th className="py-2 text-right font-bold text-xs w-24">Amount</th>
                    <th className="py-2 text-right font-bold text-xs w-20">TAX</th>
                    <th className="py-2 px-4 text-right font-bold text-xs rounded-r-sm w-32">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: DocumentLineItem, idx: number) => {
                    const rowSubtotal = item.quantity * item.unitPrice;
                    const rowTax = applyVat ? rowSubtotal * 0.16 : 0;
                    return (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-4 px-4 align-top">
                                <div className="flex gap-2">
                                    <span className="opacity-50 text-[11px]">{idx + 1}.</span>
                                    <div>
                                        <p className="font-bold text-sm">{item.description}</p>
                                        {item.serialNumber && <p className="text-[10px] text-gray-500 mt-0.5">S/N: {item.serialNumber}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 text-right text-[11px] font-medium">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-4 text-right text-[11px] font-medium">{item.quantity}</td>
                            <td className="py-4 text-right text-[11px] font-medium">KES {formatCurrency(item.unitPrice)}</td>
                            <td className="py-4 text-right text-[11px] font-medium">KES {formatCurrency(rowSubtotal)}</td>
                            <td className="py-4 text-right text-[11px] font-medium">KES {formatCurrency(rowTax)}</td>
                            <td className="py-4 px-4 text-right text-[11px] font-bold">KES {formatCurrency(rowSubtotal + rowTax)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* TOTALS FOOTER BLOCK */}
        <div className="flex justify-between items-start mt-8">
            <div className="max-w-[400px]">
                <p className="text-[11px] font-bold text-black uppercase">
                    Total (in words) : {numberToWords(total)}
                </p>
            </div>
            
            <div className="w-[320px] space-y-4">
                <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold opacity-60">Amount</span>
                    <span className="font-bold">KES {formatCurrency(subtotal || total)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold opacity-60">TAX</span>
                    <span className="font-bold">KES {formatCurrency(vat || 0)}</span>
                </div>
                
                <div className="pt-4 border-t-2 border-black flex justify-between items-center">
                    <span className="text-[16px] font-bold">Total (KES)</span>
                    <span className="text-[18px] font-bold">KES {formatCurrency(total)}</span>
                </div>
                <div className="h-0.5 bg-black w-full mt-[-2px]"></div>
            </div>
        </div>
      </section>

      {/* FINAL COMPLIANCE FOOTER */}
      <footer className="mt-auto pt-10 text-center">
         <p className="text-[11px] font-medium text-black mb-8">
            For any enquiry, reach out via email at <span className="font-bold">{workspace?.email}</span>, call on <span className="font-bold">{workspace?.phone}</span>
         </p>
         
         <p className="text-[9px] font-medium text-gray-400">
            This is an electronically generated document, no signature is required.
         </p>
      </footer>
    </div>
  );
}
