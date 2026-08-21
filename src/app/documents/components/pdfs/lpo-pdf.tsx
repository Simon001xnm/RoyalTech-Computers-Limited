'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

export function LpoPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const supplier = data.supplier || { name: 'VENDOR / SUPPLIER', address: 'Kenya', email: '' };
  const { items, subtotal, total } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#1d4ed8";
  const secondaryIndigo = "#f8fafc";
  
  const contactInfo = workspace?.phone || workspace?.email || 'Nairobi, Kenya';

  const lpoNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  return (
    <div className="p-[10mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Purchase Order</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-20 inline-block opacity-60">LPO No</span> <span className="font-bold">{lpoNo}</span></p>
                <p><span className="w-20 inline-block opacity-60">Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-14 w-14 bg-gray-50 flex items-center justify-center text-[8px] font-black border border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Deliver To</h3>
            <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
            <p className="text-[9px] font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Supplier</h3>
            <p className="font-bold">{supplier.name}</p>
            <p className="text-[9px] font-medium text-black/70">{supplier.address}</p>
            <p className="text-[9px] font-medium text-black/70">{supplier.email}</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-bold text-[9px] rounded-l-sm">Description</th>
                    <th className="py-2 text-right font-bold text-[9px] w-24">Quantity</th>
                    <th className="py-2 text-right font-bold text-[9px] w-32">Unit Price</th>
                    <th className="py-2 px-3 text-right font-bold text-[9px] rounded-r-sm w-40">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: DocumentLineItem, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-3 align-top">
                            <p className="font-bold text-[10px] uppercase">{item.description}</p>
                        </td>
                        <td className="py-2 text-right text-[9px]">{item.quantity}</td>
                        <td className="py-2 text-right text-[9px]">KES {formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right text-[9px] font-bold">KES {formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-between items-start mt-4">
            <div className="max-w-[300px]">
                <p className="text-[9px] font-bold text-black uppercase">
                    Amount (in words) : {numberToWords(total)}
                </p>
            </div>
            <div className="w-[240px] space-y-2">
                <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold opacity-60">Subtotal</span>
                    <span className="font-bold">KES {formatCurrency(subtotal || total)}</span>
                </div>
                <div className="pt-2 border-t border-black flex justify-between items-center">
                    <span className="text-[12px] font-bold">Total (KES)</span>
                    <span className="text-[14px] font-bold">KES {formatCurrency(total)}</span>
                </div>
                <div className="h-0.5 bg-black w-full mt-[-1px]"></div>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-10 grid grid-cols-2 gap-20">
            <div className="space-y-4">
                <div className="h-10 border-b border-black"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Approved By (Stamp & Sign)</p>
            </div>
            <div className="text-right space-y-2">
                <p className="text-[9px] font-medium text-black">Authorized Signature for <span className="font-bold">{workspace?.name}</span></p>
                <p className="text-[8px] font-bold text-muted-foreground">{contactInfo}</p>
            </div>
      </footer>
    </div>
  );
}
