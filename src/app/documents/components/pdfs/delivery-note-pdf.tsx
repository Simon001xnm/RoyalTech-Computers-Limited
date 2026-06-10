'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview High-Fidelity Delivery Note
 * Enforces pure black text and strong borders.
 */
export function DeliveryNotePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black">Error: Document metadata is missing.</div>;

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { customer, items, details } = docSnapshot.data;
  const companyName = workspace?.name || 'BUSINESS NAME';

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border-4 border-black">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-white flex items-center justify-center text-[10px] font-black border-2 border-black text-black">LOGO</div>
          )}
          <div className="space-y-0.5">
             <h1 className="text-xl font-black text-black uppercase leading-tight">{companyName}</h1>
             <p className="text-[9px] font-bold italic text-black">Let's Tech-it!</p>
          </div>
        </div>
        <div>
            <div className="bg-black text-white px-8 py-2 text-xl font-black uppercase tracking-widest">
                DELIVERY NOTE
            </div>
        </div>
      </div>

      {/* Delivery To & Meta Info */}
      <div className="flex justify-between mb-8">
        <div className="space-y-1">
            <h3 className="font-black uppercase text-[13px] border-b-2 border-black pb-0.5 mb-1 w-fit text-black">DELIVER TO:</h3>
            <p className="font-black text-[14px] uppercase text-black">{customer?.name || 'VALUED CLIENT'}</p>
            <p className="font-bold text-black">{customer?.phone}</p>
            <p className="font-bold text-black">{customer?.address || 'Nairobi, Kenya'}</p>
        </div>
        <div className="text-right space-y-1 text-black font-bold">
            <p>Delivery No: {docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 4).toUpperCase()}</p>
            <p>Date: {format(new Date(docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-4 border-black text-left">
                    <th className="py-2 font-black uppercase text-black">ITEM DESCRIPTION</th>
                    <th className="py-2 px-2 text-center font-black uppercase w-32 text-black">SERIAL NUMBER</th>
                    <th className="py-2 text-right font-black uppercase w-24 text-black">QTY</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => (
                    <tr key={idx} className="font-bold border-b-2 border-black">
                        <td className="py-4 align-top pr-4">
                            <p className="leading-tight text-black">{item.description}</p>
                        </td>
                        <td className="py-4 align-top text-center font-mono text-[10px] uppercase text-black">{item.serialNumber || 'N/A'}</td>
                        <td className="py-4 align-top text-right text-black">{item.quantity}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {details && (
            <div className="mt-8 space-y-2">
                <h4 className="font-black uppercase text-[11px] border-b-2 border-black pb-0.5 mb-2 text-black">NOTES / REMARKS</h4>
                <p className="text-xs font-bold text-black">{details}</p>
            </div>
        )}

        {/* Signatures */}
        <div className="mt-20 grid grid-cols-2 gap-12">
            <div className="space-y-4">
                <div className="h-16 border-b-4 border-black"></div>
                <p className="text-[10px] font-black uppercase text-center text-black">DISPATCHED BY</p>
            </div>
            <div className="space-y-4">
                <div className="h-16 border-b-4 border-black"></div>
                <p className="text-[10px] font-black uppercase text-center text-black">RECEIVED IN GOOD CONDITION BY</p>
            </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="mt-auto pt-10 text-center border-t-4 border-black">
         <p className="italic font-black text-[11px] tracking-wide text-black mb-2">
            Laptops Lease | Desktops | Printers | Chargers | Sales & Services
         </p>
         <div className="text-[10px] space-y-1 font-bold text-black">
            <p>{workspace?.address || 'Nairobi, Kenya'}</p>
            <p>Tel: {workspace?.phone} | Email: {workspace?.email}</p>
         </div>
      </footer>
    </div>
  );
}