'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function RepairNotePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { laptop, details } = docSnapshot.data;
  const primaryIndigo = "#1d4ed8"; 
  const secondaryIndigo = "#f8fafc";
  
  const contactInfo = workspace?.phone || workspace?.email || 'Nairobi, Kenya';

  const jobNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  return (
    <div className="p-[10mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-6">
        <div className="space-y-3">
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: primaryIndigo }}>Repair Note</h1>
            <div className="space-y-1 text-[12px] font-medium text-black">
                <p><span className="w-24 inline-block opacity-60 text-black">Job No</span> <span className="font-bold text-black">{jobNo}</span></p>
                <p><span className="w-24 inline-block opacity-60 text-black">In-Date</span> <span className="font-bold text-black">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
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
            <h3 className="font-bold text-[14px] mb-1" style={{ color: primaryIndigo }}>Service Center</h3>
            <p className="font-black uppercase text-black text-[12px]">{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
            <p className="text-[11px] font-medium text-black opacity-70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-4 rounded-xl border border-black/5 flex flex-col justify-center">
            <h3 className="font-bold text-[11px] mb-1 text-blue-900">Payment Instructions</h3>
            <p className="text-[10px] font-black text-black">BANK: DTB - ACC: 0084976001</p>
            <p className="text-[10px] font-black text-black">MPESA: PAYBILL: 516600 - ACC: 5084975001</p>
        </div>
      </section>

      <section className="flex-grow space-y-8">
        <div className="p-5 rounded-2xl border bg-muted/20">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Device Identity</h4>
            {laptop ? (
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[9px] uppercase opacity-50 text-black">Model</p>
                        <p className="font-black text-[12px] text-black">{laptop.model}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase opacity-50 text-black">Serial Number</p>
                        <p className="font-black text-[12px] uppercase text-black">{laptop.serialNumber}</p>
                    </div>
                </div>
            ) : <p className="italic opacity-50 text-black">No device linked.</p>}
        </div>

        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 text-black">Reported Problem / Job Description</h4>
            <div className="min-h-[180px] p-6 border-2 border-dashed rounded-2xl bg-gray-50">
                <p className="text-[12px] font-medium leading-relaxed text-black">{details || 'No details provided.'}</p>
            </div>
        </div>

        <div className="p-5 border rounded-2xl space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive">Disclaimer & Terms</h4>
            <div className="grid grid-cols-1 gap-1.5 text-[10px] font-bold opacity-80 leading-snug text-black">
                <p>1. BACKUP: Client must backup all data. We are not liable for data loss.</p>
                <p>2. DIAGNOSTICS: Non-refundable fee may apply even if repairs are declined.</p>
                <p>3. WARRANTY: 30 days warranty on parts replaced by us.</p>
                <p>4. UNCLAIMED: Items not picked after 90 days will be disposed to recover costs.</p>
            </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="h-14 border-b border-black border-dotted"></div>
                <p className="text-[11px] font-black uppercase text-center opacity-40 text-black">Client Sign</p>
            </div>
            <div className="space-y-8">
                <div className="h-14 border-b border-black border-dotted"></div>
                <p className="text-[11px] font-black uppercase text-center opacity-40 text-black">Service Agent</p>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-8 text-center border-t border-gray-100">
         <p className="text-[10px] font-black uppercase tracking-widest text-black opacity-60 mb-3">THIS DOCUMENT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
         <p className="text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: primaryIndigo }}>{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
         <p className="text-[11px] font-bold text-black opacity-50">
            {contactInfo}
         </p>
      </footer>
    </div>
  );
}