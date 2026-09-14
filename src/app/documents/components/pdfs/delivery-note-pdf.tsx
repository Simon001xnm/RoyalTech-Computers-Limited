'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview High-Fidelity Delivery Note PDF
 * Updated with larger font sizes.
 */

export function DeliveryNotePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { items, details } = docSnapshot.data;
  const primaryIndigo = "#1d4ed8"; 
  const secondaryIndigo = "#f8fafc";
  
  const website = workspace?.website || "";

  const deliveryNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  return (
    <div className="p-[10mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-6">
        <div className="space-y-3">
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: primaryIndigo }}>Delivery Note</h1>
            <div className="space-y-1 text-[12px] font-medium text-black">
                <p><span className="w-24 inline-block opacity-60 text-black">Number</span> <span className="font-bold text-black">{workspace?.deliveryPrefix || 'DLV'}{deliveryNo}</span></p>
                <p><span className="w-24 inline-block opacity-60 text-black">Date</span> <span className="font-bold text-black">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
            </div>
        </div>
        <div className="flex flex-col items-end">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl space-y-1" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-bold text-[14px] mb-1" style={{ color: primaryIndigo }}>Dispatched From</h3>
            <p className="font-black uppercase text-black text-[12px]">{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
            <p className="text-[11px] font-medium text-black opacity-70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-4 rounded-xl border border-black/5 bg-slate-50 flex flex-col justify-center">
            <p className="text-[10px] font-black text-black">BANK: DTB - ACC: 0084976001</p>
            <p className="text-[10px] font-black text-black">MPESA: PAYBILL: 516600 | ACC: 5084975001</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-3 px-4 font-bold text-[11px] rounded-l-md">Item Description</th>
                    <th className="py-3 text-center font-bold text-[11px] w-64">Serial Number</th>
                    <th className="py-3 px-4 text-right font-bold text-[11px] rounded-r-md w-32">Qty</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                        <td className="py-4 px-4 align-top">
                            <p className="font-black text-[12px] uppercase text-black">{item.description || item.name}</p>
                        </td>
                        <td className="py-4 text-center text-[11px] font-mono uppercase text-black">{item.serialNumber || 'N/A'}</td>
                        <td className="py-4 px-4 text-right text-[12px] font-black text-black">{item.quantity}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {details && (
                <div className="p-5 border rounded-2xl bg-gray-50 h-fit">
                    <h4 className="font-bold text-[10px] uppercase opacity-60 mb-2 text-black">Shipping Instructions</h4>
                    <p className="text-[11px] leading-relaxed text-black">{details}</p>
                </div>
            )}
            <div className="p-5 border rounded-2xl bg-blue-50/30 h-fit">
                <h4 className="font-black text-[10px] uppercase text-blue-900/60 mb-2">Delivery Agreement</h4>
                <p className="text-[11px] font-bold text-black leading-relaxed italic">
                    This document confirms delivery of the goods listed above. Please inspect the items upon delivery and report any shortages or damages before signing. This delivery note is not proof of payment.
                </p>
            </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="h-16 border-b border-black"></div>
                <p className="text-[11px] font-black uppercase text-center opacity-40 text-black">Dispatched By (Sign & Stamp)</p>
            </div>
            <div className="space-y-8">
                <div className="h-16 border-b border-black"></div>
                <p className="text-[11px] font-black uppercase text-center opacity-40 text-black">Received By (Sign & Stamp)</p>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-8 text-center border-t border-gray-100">
         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 text-black">THIS DOCUMENT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
         <p className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: primaryIndigo }}>{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
         <div className="space-y-1.5 text-[10px] font-bold text-black opacity-50 mt-6">
            {website && <p>{website}</p>}
            <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
         </div>
      </footer>
    </div>
  );
}