'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * Converts numbers to words (Simplified for KES)
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
 * @fileOverview Professional Receipt Redesign
 * Matches the requested Indigo/Purple layout with logo on the right.
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

  const { items, paymentMethod, amount, amountPaid, subtotal, vat, applyVat } = data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 5).toUpperCase();
  const companyName = workspace?.name || 'BUSINESS NAME';
  const primaryColor = "#7c3aed"; // Requested Indigo/Purple

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border selection:bg-indigo-100">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-start mb-10">
        <div className="space-y-4">
            <h1 className="text-4xl font-medium tracking-tight" style={{ color: primaryColor }}>Receipt</h1>
            <div className="space-y-1 text-[13px] font-medium text-gray-700">
                <p><span className="w-24 inline-block">Receipt No</span> <span className="font-bold text-black">{workspace?.receiptPrefix || 'RCT'}{receiptNo}</span></p>
                <p><span className="w-24 inline-block">Receipt Date</span> <span className="font-bold text-black">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-gray-100 flex items-center justify-center text-[10px] font-black border border-gray-200 text-gray-400">LOGO</div>
          )}
        </div>
      </header>

      {/* BILLING BLOCKS SECTION */}
      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-lg space-y-2" style={{ backgroundColor: '#f5f3ff' }}>
            <h3 className="font-bold text-[14px] mb-2" style={{ color: primaryColor }}>Billed By</h3>
            <p className="font-black text-sm uppercase leading-tight">{companyName}</p>
            <p className="text-gray-600 font-medium">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-6 rounded-lg space-y-2" style={{ backgroundColor: '#f5f3ff' }}>
            <h3 className="font-bold text-[14px] mb-2" style={{ color: primaryColor }}>Billed To</h3>
            <p className="font-black text-sm uppercase leading-tight">{customer.name}</p>
            <p className="text-gray-600 font-medium">{customer.address || 'Nairobi, Kenya'}</p>
        </div>
      </section>

      {/* ITEM TABLE SECTION */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryColor }}>
                    <th className="py-3 px-4 font-bold rounded-l-md">Item</th>
                    <th className="py-3 px-2 text-center font-bold w-20">TAX Rate</th>
                    <th className="py-3 px-2 text-center font-bold w-20">Quantity</th>
                    <th className="py-3 px-2 text-right font-bold w-24">Rate</th>
                    <th className="py-3 px-2 text-right font-bold w-24">Amount</th>
                    <th className="py-3 px-2 text-right font-bold w-24">TAX</th>
                    <th className="py-3 px-4 text-right font-bold w-32 rounded-r-md">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: SaleItem, idx: number) => {
                    const rowSubtotal = item.price * item.quantity;
                    const rowTax = applyVat ? rowSubtotal * 0.16 : 0;
                    return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-5 px-4 align-top">
                                <p className="font-bold text-gray-900">{item.name}</p>
                                {item.serialNumber && <p className="text-[10px] text-gray-500 font-mono mt-1">{item.serialNumber}</p>}
                            </td>
                            <td className="py-5 px-2 align-top text-center font-medium">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-5 px-2 align-top text-center font-medium">{item.quantity}</td>
                            <td className="py-5 px-2 align-top text-right font-medium">KES {formatCurrency(item.price)}</td>
                            <td className="py-5 px-2 align-top text-right font-medium">KES {formatCurrency(rowSubtotal)}</td>
                            <td className="py-5 px-2 align-top text-right font-medium">KES {formatCurrency(rowTax)}</td>
                            <td className="py-5 px-4 align-top text-right font-bold">KES {formatCurrency(rowSubtotal + rowTax)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* TOTALS SECTION */}
        <div className="flex justify-between items-start mt-10">
            <div className="max-w-[400px]">
                <p className="text-[11px] font-bold text-gray-700">
                    Total (in words) : <span className="uppercase text-black">{numberToWords(amount)}</span>
                </p>
            </div>
            
            <div className="w-[300px] space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-600">Amount</span>
                    <span className="font-bold">KES {formatCurrency(subtotal || amountPaid || amount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-600">TAX</span>
                    <span className="font-bold">KES {formatCurrency(vat || 0)}</span>
                </div>
                
                <div className="pt-4 border-t-2 border-black flex justify-between items-center">
                    <span className="text-lg font-black tracking-tight">Total (KES)</span>
                    <span className="text-xl font-black">KES {formatCurrency(amount)}</span>
                </div>
                <div className="h-0.5 w-full bg-black"></div>
            </div>
        </div>
      </section>

      {/* PROFESSIONAL FOOTER */}
      <footer className="mt-auto pt-20">
         <div className="text-center space-y-2 mb-12">
            <p className="text-[13px] font-medium text-gray-700">
                For any enquiry, reach out via email at <span className="font-bold text-black">{workspace?.email}</span>, call on <span className="font-bold text-black">{workspace?.phone}</span>
            </p>
         </div>
         
         <div className="text-center pt-8 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
                This is an electronically generated document, no signature is required.
            </p>
         </div>
      </footer>
    </div>
  );
}
