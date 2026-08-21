'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function DeliveryNotePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { customer, items, details } = docSnapshot.data;
  const primaryIndigo = "#1d4ed8"; // Professional Blue
  const secondaryIndigo = "#f8fafc";
  
  const contactInfo = workspace?.phone || workspace?.email || 'Nairobi, Kenya';
  const website = workspace?.website || "";

  const deliveryNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  return (
    <div className="p-[10mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Delivery Note</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-20 inline-block opacity-60">Number</span> <span className="font-bold">{workspace?.deliveryPrefix || 'DLV'}{deliveryNo}</span></p>
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
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Dispatched From</h3>
            <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
            <p className="text-[9px] font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Deliver To</h3>
            <p className="font-bold">{customer?.name || 'VALUED CLIENT'}</p>
            <p className="text-[9px] font-medium text-black/70">{customer?.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-medium text-black/70">{customer?.phone}</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-bold text-[9px] rounded-l-sm">Item Description</th>
                    <th className="py-2 text-center font-bold text-[9px] w-48">Serial Number</th>
                    <th className="py-2 px-3 text-right font-bold text-[9px] rounded-r-sm w-24">Qty</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-3 align-top">
                            <p className="font-bold text-[10px] uppercase">{item.description || item.name}</p>
                        </td>
                        <td className="py-3 text-center text-[9px] font-mono uppercase">{item.serialNumber || 'N/A'}</td>
                        <td className="py-3 px-3 text-right text-[9px] font-bold">{item.quantity}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {details && (
            <div className="mt-6 p-4 border rounded-xl bg-gray-50">
                <h4 className="font-bold text-[9px] uppercase opacity-60 mb-2">Instructions / Notes</h4>
                <p className="text-[10px] leading-relaxed">{details}</p>
            </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="h-12 border-b border-black"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Dispatched By (Sign & Stamp)</p>
            </div>
            <div className="space-y-6">
                <div className="h-12 border-b border-black"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Received By (Sign & Stamp)</p>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center border-t border-gray-100">
         <p className="text-[10px] font-bold text-black tracking-tight">
            Goods once sold cannot be returned
         </p>
         <div className="space-y-1 text-[9px] font-bold text-gray-500 mt-4">
            {website && <p>{website}</p>}
            <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
         </div>
      </footer>
    </div>
  );
}
