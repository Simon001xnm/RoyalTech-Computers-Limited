'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

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

export function ProformaInvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const customer = data.customer || { name: 'VALUED CLIENT', phone: '', email: '', address: 'Kenya' };
  const { items, subtotal, vat, total, applyVat } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#7c3aed";
  const secondaryIndigo = "#f5f3ff";

  return (
    <div className="p-[10mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Proforma</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-20 inline-block opacity-60">Number</span> <span className="font-bold">{docSnapshot.title.split('#').pop()}</span></p>
                <p><span className="w-20 inline-block opacity-60">Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-16 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-14 w-14 bg-gray-50 flex items-center justify-center text-[8px] font-black border border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Billed By</h3>
            <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
            <p className="text-[9px] font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Billed To</h3>
            <p className="font-bold">{customer.name}</p>
            <p className="text-[9px] font-medium text-black/70">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-medium text-black/70">{customer.phone}</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-bold text-[9px] rounded-l-sm">Item</th>
                    <th className="py-2 text-right font-bold text-[9px] w-16">TAX Rate</th>
                    <th className="py-2 text-right font-bold text-[9px] w-16">Quantity</th>
                    <th className="py-2 text-right font-bold text-[9px] w-24">Rate</th>
                    <th className="py-2 text-right font-bold text-[9px] w-24">Amount</th>
                    <th className="py-2 text-right font-bold text-[9px] w-16">TAX</th>
                    <th className="py-2 px-3 text-right font-bold text-[9px] rounded-r-sm w-32">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: DocumentLineItem, idx: number) => {
                    const rowSubtotal = item.quantity * item.unitPrice;
                    const rowTax = applyVat ? rowSubtotal * 0.16 : 0;
                    return (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 px-3 align-top">
                                <p className="font-bold text-[10px]">{item.description}</p>
                                {item.serialNumber && <p className="text-[8px] text-gray-500">S/N: {item.serialNumber}</p>}
                            </td>
                            <td className="py-2 text-right text-[9px]">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-2 text-right text-[9px]">{item.quantity}</td>
                            <td className="py-2 text-right text-[9px]">KES {formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-right text-[9px]">KES {formatCurrency(rowSubtotal)}</td>
                            <td className="py-2 text-right text-[9px]">KES {formatCurrency(rowTax)}</td>
                            <td className="py-2 px-3 text-right text-[9px] font-bold">KES {formatCurrency(rowSubtotal + rowTax)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        <div className="flex justify-between items-start mt-4">
            <div className="max-w-[300px]">
                <p className="text-[9px] font-bold text-black uppercase">
                    Total (in words) : {numberToWords(total)}
                </p>
            </div>
            <div className="w-[240px] space-y-2">
                <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold opacity-60">Amount</span>
                    <span className="font-bold">KES {formatCurrency(subtotal || total)}</span>
                </div>
                <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold opacity-60">TAX</span>
                    <span className="font-bold">KES {formatCurrency(vat || 0)}</span>
                </div>
                <div className="pt-2 border-t border-black flex justify-between items-center">
                    <span className="text-[12px] font-bold">Total (KES)</span>
                    <span className="text-[14px] font-bold">KES {formatCurrency(total)}</span>
                </div>
                <div className="h-0.5 bg-black w-full mt-[-1px]"></div>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center border-t border-gray-100">
         <p className="text-[9px] font-medium text-black">
            Reach out via email at <span className="font-bold">{workspace?.email}</span> or call on <span className="font-bold">{workspace?.phone}</span>
         </p>
         <p className="text-[8px] font-medium text-gray-400 mt-2">
            This is a pre-payment invoice. Final Tax Invoice will be issued upon receipt of funds.
         </p>
      </footer>
    </div>
  );
}