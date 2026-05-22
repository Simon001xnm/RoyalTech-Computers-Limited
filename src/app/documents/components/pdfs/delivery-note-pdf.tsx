
'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function DeliveryNotePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) {
    return <div className="p-4">Document data is missing.</div>;
  }

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { customer, items, details } = docSnapshot.data;
  const companyName = workspace?.name || 'SIMONSTYLESTECHNOLOGIES LIMITED';

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border border-gray-100">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed">LOGO</div>
          )}
          <div className="space-y-0.5">
             <h1 className="text-xl font-black text-primary uppercase leading-tight">{companyName}</h1>
             <p className="text-[9px] italic opacity-60">Let's Tech-it!</p>
          </div>
        </div>
        <div>
            <div className="bg-black text-white px-8 py-2 text-xl font-black uppercase tracking-widest">
                DELIVERY NOTE
            </div>
        </div>
      </div>

      {/* Bill To & Meta Info */}
      <div className="flex justify-between mb-8">
        <div className="space-y-1">
            <h3 className="font-black uppercase text-[13px] border-b border-black pb-0.5 mb-1 w-fit">DELIVER TO:</h3>
            <p className="font-black text-[14px] uppercase">{customer?.name || 'VALUED CLIENT'}</p>
            <p className="font-bold">{customer?.phone}</p>
            <p className="font-bold">{customer?.address || 'Nairobi, Kenya'}</p>
        </div>
        <div className="text-right space-y-1">
            <p className="font-bold"><span className="opacity-60">Delivery No:</span> {docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 4).toUpperCase()}</p>
            <p className="font-bold"><span className="opacity-60">Date:</span> {format(new Date(docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-2 border-black text-left">
                    <th className="py-2 font-black uppercase">ITEM DESCRIPTION</th>
                    <th className="py-2 px-2 text-center font-black uppercase w-32">SERIAL NUMBER</th>
                    <th className="py-2 text-right font-black uppercase w-24">QTY</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => (
                    <tr key={idx} className="font-bold">
                        <td className="py-4 align-top pr-4">
                            <p className="leading-tight">{item.description}</p>
                        </td>
                        <td className="py-4 align-top text-center font-mono text-[10px] uppercase">{item.serialNumber || 'N/A'}</td>
                        <td className="py-4 align-top text-right">{item.quantity}</td>
                    </tr>
                ))}
                <tr>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                </tr>
            </tbody>
        </table>

        {details && (
            <div className="mt-8 space-y-2">
                <h4 className="font-black uppercase text-[11px] border-b pb-0.5 mb-2">NOTES / REMARKS</h4>
                <p className="text-xs font-bold italic opacity-60">{details}</p>
            </div>
        )}

        {/* Signatures */}
        <div className="mt-20 grid grid-cols-2 gap-12">
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted"></div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">DISPATCHED BY</p>
            </div>
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted"></div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">RECEIVED IN GOOD CONDITION BY</p>
            </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="mt-auto pt-10 text-center space-y-3">
         <div className="w-full h-px bg-gray-400 mb-2"></div>
         <p className="italic font-bold text-[11px] tracking-wide">
            Laptops Lease | Desktops | Laptops | Printers | Chargers | Memory etc | Sales & Services
         </p>
         <div className="text-[10px] space-y-1 opacity-80">
            <p className="font-black tracking-widest overflow-hidden h-2 leading-none">****************************************************************************************************************************************************************</p>
            <p className="font-bold">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="font-bold">Tel: {workspace?.phone} E-mail: {workspace?.email} Web: {workspace?.website || 'www.royaltech.co.ke'}</p>
         </div>

         <div className="pt-6 text-[8px] font-bold opacity-40 uppercase flex justify-center gap-4">
            <span>Printed On: {format(new Date(), "PPPP | p")}</span>
            <span>&gt;&gt;Served By: {docSnapshot.createdBy?.name || 'System'}</span>
         </div>
      </footer>
    </div>
  );
}
