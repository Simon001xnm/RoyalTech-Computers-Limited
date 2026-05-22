
'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function LeaseAgreementPdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }

  const workspace = document.data.workspace || cloudCompany;
  const { 
    customer, 
    items, 
    details, 
    lease, 
    subtotal, 
    total, 
    applyVat, 
    vat, 
    clientType,
    verification,
    signature
  } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const primaryColor = workspace?.primaryColor || '#2c3e50';
  const isIndividual = clientType === 'Individual' || !clientType;
  const isStudent = verification?.studentId;

  return (
    <div className="p-[20mm] font-sans text-sm bg-white text-gray-900 w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start pb-4 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" />
          ) : (
            <div className="h-20 w-20 bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold border">No Logo</div>
          )}
          <div>
              <h1 className="text-2xl font-bold uppercase" style={{ color: primaryColor }}>{workspace?.name}</h1>
              <p className="text-xs text-gray-500">{workspace?.address}</p>
              <p className="text-xs text-gray-500">Tel: {workspace?.phone} | Email: {workspace?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-black uppercase text-gray-400">Lease Hire Agreement</h2>
            <p className="text-xs font-mono">{document.title}</p>
            <p className="text-[10px] font-black uppercase bg-muted px-2 py-1 mt-1">{clientType || 'Individual'} Protocol</p>
        </div>
      </header>

      <section className="my-6">
        <p className="leading-relaxed text-[11px] text-gray-600">
          This Hardware Lease Agreement ("Agreement") is made on <strong>{format(new Date(document.generatedDate), "PPP")}</strong> between <strong>{workspace?.name}</strong> ("Lessor") and the Client identified below ("Lessee").
        </p>
      </section>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border">
          <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">Lessee / Client Identity:</h3>
          <div className="space-y-1">
              <p className="font-black text-lg uppercase">{customer?.name}</p>
              <p className="text-xs text-gray-600">{customer?.address || 'Address not specified'}</p>
              <p className="text-xs text-gray-600">Contact: {customer?.phone}</p>
              
              <div className="pt-2 border-t mt-2 grid grid-cols-1 gap-1">
                {isIndividual ? (
                    <>
                        <p className="text-[10px]"><strong>National ID:</strong> {verification?.nationalId || 'Verified On File'}</p>
                        <p className="text-[10px]"><strong>Guarantor ID:</strong> {verification?.guarantorId || 'N/A'}</p>
                        {isStudent && (
                            <div className="bg-blue-50 p-2 rounded mt-1 border border-blue-100">
                                <p className="text-[9px] font-bold text-blue-800 uppercase">Student Registration</p>
                                <p className="text-[9px]">ID: {verification.studentId}</p>
                                <p className="text-[9px]">Guardian: {verification.parentName} ({verification.parentPhone})</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-[10px]"><strong>Business Permit:</strong> {verification?.businessPermit || 'N/A'}</p>
                        <p className="text-[10px]"><strong>CR12 Reference:</strong> {verification?.cr12Reference || 'N/A'}</p>
                        <p className="text-[10px]"><strong>Auth. Signatory ID:</strong> {verification?.directorId || 'N/A'}</p>
                    </>
                )}
              </div>
          </div>
        </div>
        <div className="text-right">
           <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">Contract Period:</h3>
           <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 inline-block text-right">
              <p className="font-black text-2xl text-primary">{lease?.duration} {lease?.unit || lease?.durationUnit}(s)</p>
              <p className="text-[10px] font-bold uppercase opacity-60">Start: {format(new Date(lease?.startDate || document.generatedDate), "MMM d, yyyy")}</p>
              <p className="text-[10px] font-bold text-red-600 uppercase">Expiry: {format(new Date(lease?.endDate || document.generatedDate), "MMM d, yyyy")}</p>
           </div>
        </div>
      </div>

      <section className="mb-8">
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest rounded-tl-lg">Hired Equipment Description</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-24">Qty</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-32">Rate per Unit</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-32 rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b bg-gray-50/30">
                <td className="p-4 font-bold text-sm">
                    {item.description}
                    {item.serialNumber && <p className="text-[9px] font-mono opacity-50">S/N: {item.serialNumber}</p>}
                </td>
                <td className="p-4 text-right">{item.quantity}</td>
                <td className="p-4 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-4 text-right font-black">{formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className="grid grid-cols-[1fr_200px] gap-10">
        <div>
          <h4 className="font-bold text-[10px] uppercase text-gray-800 mb-3 border-b pb-1">Terms & Conditions of Hire:</h4>
          <ol className="list-decimal list-inside space-y-1.5 text-[9px] text-gray-700 leading-tight">
            <li><strong>Mishandling:</strong> Should the equipment be mishandled, the Lessee shall bear all repair costs at current market rates.</li>
            <li><strong>Damage Beyond Repair:</strong> If the equipment is damaged beyond repair, lost, or stolen, the Lessee is contractually bound to purchase an exact replacement for the Lessor at the current market price.</li>
            <li><strong>Late Return:</strong> Delay in returning the hardware will attract a mandatory <strong>PENALTY of KES 1,000 per day</strong> unless advance communication is provided and approved in writing.</li>
            <li><strong>Ownership:</strong> The equipment remains the sole property of {workspace?.name}. This is a hire agreement, not a sale.</li>
          </ol>
        </div>
        <div className="space-y-1 pt-2">
             <div className="flex justify-between py-1 text-xs border-b">
                <span>Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal || 0)}</span>
            </div>
            {applyVat && <div className="flex justify-between py-1 text-xs border-b">
                <span>VAT (16%):</span>
                <span className="font-bold text-red-600">{formatCurrency(vat || 0)}</span>
            </div>}
            <div className="flex justify-between py-3 border-t-2 border-black mt-1">
                <span className="font-black text-lg uppercase">Total Due:</span>
                <span className="font-black text-lg" style={{ color: primaryColor }}>{formatCurrency(total || 0)}</span>
            </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-20">
        <div className="space-y-4">
            <div className="h-16 flex items-end justify-center border-b-2 border-dashed border-gray-300">
                {/* Lessor Placeholder */}
            </div>
            <p className="text-[10px] font-black uppercase text-center opacity-60">Lessor Authorized Signature</p>
        </div>
        <div className="space-y-4">
            <div className="h-16 flex items-end justify-center border-b-2 border-dashed border-gray-300 overflow-hidden">
                {signature ? (
                    <img src={signature} alt="Client Signature" className="max-h-full w-auto object-contain" />
                ) : null}
            </div>
            <p className="text-[10px] font-black uppercase text-center opacity-60">Lessee / Client Signature</p>
        </div>
      </section>

      <div className="flex-grow"></div>

      <footer className="text-center pt-6 mt-10 border-t">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">OFFICIAL LEGAL BINDING CONTRACT</p>
          <p className="text-[8px] text-gray-400 mt-2">All data contained herein is verified via the system identity node at the time of signing.</p>
      </footer>
    </div>
  );
}
