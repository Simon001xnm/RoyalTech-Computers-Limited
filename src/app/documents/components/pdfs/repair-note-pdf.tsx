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
  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const { customer, laptop, details } = docSnapshot.data;
  const primaryIndigo = "#7c3aed";
  const secondaryIndigo = "#f5f3ff";

  return (
    <div className="p-[10mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Repair Note</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-20 inline-block opacity-60">Job No</span> <span className="font-bold">{docSnapshot.title.split('#').pop()}</span></p>
                <p><span className="w-20 inline-block opacity-60">In-Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
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
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Service Center</h3>
            <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
            <p className="text-[9px] font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
        </div>
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Customer</h3>
            <p className="font-bold">{customer?.name || 'VALUED CLIENT'}</p>
            <p className="text-[9px] font-medium text-black/70">{customer?.phone}</p>
        </div>
      </section>

      <section className="flex-grow space-y-6">
        <div className="p-4 rounded-xl border bg-muted/20">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Device Identity</h4>
            {laptop ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[8px] uppercase opacity-50">Model</p>
                        <p className="font-bold text-[10px]">{laptop.model}</p>
                    </div>
                    <div>
                        <p className="text-[8px] uppercase opacity-50">Serial Number</p>
                        <p className="font-bold text-[10px] uppercase">{laptop.serialNumber}</p>
                    </div>
                </div>
            ) : <p className="italic opacity-50">No device linked.</p>}
        </div>

        <div className="space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60">Reported Problem / Job Description</h4>
            <div className="min-h-[150px] p-4 border-2 border-dashed rounded-xl bg-gray-50">
                <p className="text-[10px] font-medium leading-relaxed">{details || 'No details provided.'}</p>
            </div>
        </div>

        <div className="p-4 border rounded-xl space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-destructive">Disclaimer & Terms</h4>
            <div className="grid grid-cols-1 gap-1 text-[8px] font-medium opacity-70 leading-tight">
                <p>1. BACKUP: Client must backup all data. We are not liable for data loss.</p>
                <p>2. DIAGNOSTICS: Non-refundable fee may apply even if repairs are declined.</p>
                <p>3. WARRANTY: 30 days warranty on parts replaced by us.</p>
                <p>4. UNCLAIMED: Items not picked after 90 days will be disposed to recover costs.</p>
            </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-10">
            <div className="space-y-4">
                <div className="h-10 border-b border-black border-dotted"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Client Sign</p>
            </div>
            <div className="space-y-4">
                <div className="h-10 border-b border-black border-dotted"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Service Agent</p>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center border-t border-gray-100">
         <p className="text-[10px] font-bold text-black uppercase">
            Goods once sold cannot be returned
         </p>
      </footer>
    </div>
  );
}
