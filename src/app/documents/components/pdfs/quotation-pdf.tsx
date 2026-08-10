'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

export function QuotationPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const customer = data.customer || { name: 'VALUED CLIENT', phone: '', email: '', address: 'Kenya' };
  const { items, subtotal, vat, total, applyVat } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#1d4ed8";
  
  const contactInfo = workspace?.phone || workspace?.email || 'Nairobi, Kenya';

  const quoteNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  return (
    <div className="p-[12mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      
      {/* BRANDED HEADER */}
      <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>{workspace?.name || 'THE BUSINESS'}</h1>
            <p className="font-bold text-[10px] opacity-70">Official Business Quotation</p>
          </div>
        </div>
        <div className="text-right space-y-1">
            <p className="font-black text-[10px] uppercase">Contact Details</p>
            <p className="text-[9px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Kenya'}</p>
            <p className="text-[9px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
            <p className="text-[9px] font-bold">Email: {workspace?.email || 'N/A'}</p>
            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-blue-800">Quote No: {quoteNo}</p>
                <p className="text-[9px] font-bold">Valid Until: {format(new Date(new Date(docSnapshot.generatedDate).setDate(new Date(docSnapshot.generatedDate).getDate() + 30)), "dd MMM yyyy")}</p>
            </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 rounded-lg space-y-0.5 bg-gray-50">
            <h3 className="font-black text-[10px] uppercase text-blue-900 mb-1">Quoted To</h3>
            <p className="font-black uppercase text-xs">{customer.name}</p>
            <p className="text-[10px] font-medium text-black/70">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="text-[10px] font-medium text-black/70 font-bold">{customer.phone}</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-black text-[10px] rounded-l-sm">DESCRIPTION</th>
                    <th className="py-2 text-right font-black text-[10px] w-16">TAX</th>
                    <th className="py-2 text-right font-black text-[10px] w-16">QTY</th>
                    <th className="py-2 text-right font-black text-[10px] w-24">RATE</th>
                    <th className="py-2 px-3 text-right font-black text-[10px] rounded-r-sm w-32">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => {
                    const name = item.name || item.description;
                    const unitPrice = item.price || item.unitPrice;
                    const rowSubtotal = item.quantity * unitPrice;
                    return (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-3 px-3 align-top">
                                <p className="font-bold text-[11px] uppercase">{name}</p>
                                {item.description && item.name && <p className="text-[9px] text-gray-500 italic leading-tight">{item.description}</p>}
                            </td>
                            <td className="py-3 text-right text-[10px] font-medium">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-3 text-right text-[10px] font-medium">{item.quantity}</td>
                            <td className="py-3 text-right text-[10px] font-medium">KES {formatCurrency(unitPrice)}</td>
                            <td className="py-3 px-3 text-right text-[10px] font-bold">KES {formatCurrency(rowSubtotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        <div className="flex justify-between items-start mt-6">
            <div className="max-w-[350px]">
                <p className="text-[10px] font-black uppercase text-black">
                    Amount in words: {numberToWords(total)}
                </p>
                <div className="mt-8 space-y-2">
                    <h4 className="text-[9px] font-black uppercase text-blue-900">Terms & Conditions</h4>
                    <p className="text-[9px] leading-relaxed text-gray-600">
                        1. Validity: 30 days from issuance.<br/>
                        2. Delivery: Within 24 hours after full payment.<br/>
                        3. Returns: Goods once sold are not returnable.
                    </p>
                </div>
            </div>
            <div className="w-[280px] space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold opacity-60">SUBTOTAL</span>
                    <span className="font-bold">KES {formatCurrency(subtotal || total)}</span>
                </div>
                {applyVat && (
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold opacity-60">VAT (16%)</span>
                        <span className="font-bold">KES {formatCurrency(vat || 0)}</span>
                    </div>
                )}
                <div className="pt-3 border-t-2 border-black flex justify-between items-center">
                    <span className="text-[14px] font-black">GRAND TOTAL</span>
                    <span className="text-xl font-black text-blue-900">KES {formatCurrency(total)}</span>
                </div>
                <div className="h-0.5 bg-black w-full mt-[-2px]"></div>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-8 border-t border-gray-200 text-center">
         <div className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {workspace?.website && <p>{workspace.website}</p>}
            <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
         </div>
      </footer>
    </div>
  );
}
