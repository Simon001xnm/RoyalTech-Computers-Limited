
'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function RepairNotePdf({ document: docSnapshot }: { document: AppDocument }) {
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
  const { customer, laptop, details } = docSnapshot.data;
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
                REPAIR NOTE
            </div>
        </div>
      </div>

      {/* Client & Meta Info */}
      <div className="flex justify-between mb-8">
        <div className="space-y-1">
            <h3 className="font-black uppercase text-[13px] border-b border-black pb-0.5 mb-1 w-fit">CLIENT DETAILS:</h3>
            <p className="font-black text-[14px] uppercase">{customer?.name || 'VALUED CLIENT'}</p>
            <p className="font-bold">{customer?.phone}</p>
        </div>
        <div className="text-right space-y-1">
            <p className="font-bold"><span className="opacity-60">Job No:</span> {docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 4).toUpperCase()}</p>
            <p className="font-bold"><span className="opacity-60">In-Date:</span> {format(new Date(docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        <section className="p-6 bg-muted/20 border rounded-2xl">
            <h4 className="font-black uppercase text-[11px] mb-3 text-primary">Device for Service</h4>
            {laptop ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase opacity-60">Model</p>
                        <p className="font-black text-sm">{laptop.model}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase opacity-60">Serial Number</p>
                        <p className="font-black text-sm uppercase">{laptop.serialNumber}</p>
                    </div>
                </div>
            ) : <p className="font-bold text-xs italic">No specific device linked.</p>}
        </section>

        <section className="space-y-2">
            <h4 className="font-black uppercase text-[11px] border-b pb-0.5 mb-2">REPORTED ISSUE / WORK REQUESTED</h4>
            <div className="min-h-[200px] p-6 border-2 border-dashed rounded-3xl bg-gray-50/50">
                <p className="text-sm font-bold leading-relaxed">{details || 'No specific details provided.'}</p>
            </div>
        </section>

        <section className="space-y-4">
            <h4 className="font-black uppercase text-[11px] border-b pb-0.5 mb-2">TERMS & CONDITIONS</h4>
            <div className="grid grid-cols-1 gap-2 text-[10px] font-bold leading-relaxed opacity-70">
                <p>1. Data Loss: We are NOT responsible for any data loss. Clients must back up their storage before service.</p>
                <p>2. Diagnostics: A non-refundable diagnostic fee may apply if repairs are declined after inspection.</p>
                <p>3. Warranty: Service warranty is 90 days for parts replaced by us.</p>
                <p>4. Uncollected Items: Items left for more than 90 days after service completion will be disposed of to recover costs.</p>
            </div>
        </section>

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-12">
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted"></div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">CUSTOMER SIGNATURE</p>
            </div>
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted"></div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">AUTHORIZED AGENT</p>
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
            <span>Note Printed On: {format(new Date(), "PPPP | p")}</span>
            <span>&gt;&gt;Served By: {docSnapshot.createdBy?.name || 'System'}</span>
         </div>
      </footer>
    </div>
  );
}
