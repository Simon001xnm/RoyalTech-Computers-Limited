
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
    return <div className="p-10 text-xl font-bold">Document data is missing. Please try again.</div>;
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  const primaryColor = workspace?.primaryColor || '#000000';
  const isIndividual = clientType === 'Individual' || !clientType;
  const isStudent = verification?.studentId;
  const companyName = workspace?.name || 'SIMON STYLESTECHNOLOGIES LIMITED';

  return (
    <div className="p-[20mm] font-sans text-lg bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border leading-relaxed">
      {/* Header with Logo */}
      <header className="flex justify-between items-center pb-6 border-b-2 mb-8" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {workspace?.logoUrl ? (
            <img 
                src={workspace.logoUrl} 
                alt="Company Logo" 
                className="h-24 w-auto object-contain" 
                crossOrigin="anonymous"
            />
          ) : (
            <div className="h-20 w-20 bg-gray-100 flex items-center justify-center text-xs font-bold border-2 border-dashed">LOGO</div>
          )}
          <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase" style={{ color: primaryColor }}>{companyName}</h1>
              <p className="text-xs font-bold opacity-60">LEGAL HIRE AGREEMENT</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-black uppercase text-gray-400">Document No:</h2>
            <p className="text-sm font-mono tracking-tighter">{document.title}</p>
        </div>
      </header>

      {/* Main Parties Section - Side by Side */}
      <div className="grid grid-cols-2 gap-10 mb-10 text-base">
        {/* Lessor Side */}
        <div className="space-y-3">
          <h3 className="font-black text-xs uppercase tracking-widest text-primary">From (The Owner):</h3>
          <div className="p-5 border-2 rounded-2xl bg-gray-50/50">
              <p className="font-black uppercase text-lg">{companyName}</p>
              <p className="text-sm">{workspace?.address || 'Address not specified'}</p>
              <p className="text-sm font-bold">Phone: {workspace?.phone}</p>
              <p className="text-sm">Email: {workspace?.email}</p>
          </div>
        </div>

        {/* Lessee Side */}
        <div className="space-y-3">
          <h3 className="font-black text-xs uppercase tracking-widest text-primary">To (The Client):</h3>
          <div className="p-5 border-2 rounded-2xl bg-white shadow-sm">
              <p className="font-black uppercase text-lg">{customer?.name || 'VALUED CLIENT'}</p>
              <p className="text-sm">{customer?.address || 'Address not specified'}</p>
              <p className="text-sm font-bold">Phone: {customer?.phone}</p>
              
              <div className="pt-3 border-t mt-3 space-y-1">
                {isIndividual ? (
                    <>
                        <p className="text-xs"><strong>National ID:</strong> {verification?.nationalId || 'Verified'}</p>
                        <p className="text-xs"><strong>Guarantor ID:</strong> {verification?.guarantorId || 'N/A'}</p>
                        {isStudent && (
                            <p className="text-xs text-primary font-bold">Student ID: {verification.studentId}</p>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-xs"><strong>Permit No:</strong> {verification?.businessPermit || 'N/A'}</p>
                        <p className="text-xs"><strong>Director ID:</strong> {verification?.directorId || 'N/A'}</p>
                    </>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Contract Period */}
      <section className="mb-10 bg-black text-white p-6 rounded-2xl flex justify-between items-center">
        <div>
            <p className="text-xs font-bold uppercase opacity-60">Time for Hire</p>
            <p className="text-4xl font-black">{lease?.duration} {lease?.unit || lease?.durationUnit}(s)</p>
        </div>
        <div className="text-right space-y-1">
            <p className="text-sm"><span className="opacity-60">Starts:</span> <strong>{format(new Date(lease?.startDate || document.generatedDate), "MMM d, yyyy")}</strong></p>
            <p className="text-sm text-yellow-400 font-bold"><span className="opacity-80">Return By:</span> <strong>{format(new Date(lease?.endDate || document.generatedDate), "MMM d, yyyy")}</strong></p>
        </div>
      </section>

      {/* Items List */}
      <section className="mb-10">
        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 mb-4">Equipment for Hire:</h3>
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-4 text-sm uppercase font-black">Description of Device</th>
              <th className="p-4 text-sm uppercase font-black text-center w-24">Qty</th>
              <th className="p-4 text-sm uppercase font-black text-right w-40">Rate / Unit</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="p-4">
                    <p className="font-bold text-lg">{item.description}</p>
                    {item.serialNumber && <p className="text-xs font-mono opacity-50 uppercase">S/N: {item.serialNumber}</p>}
                </td>
                <td className="p-4 text-center font-bold">{item.quantity}</td>
                <td className="p-4 text-right font-bold">{formatCurrency(item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Terms and Conditions - Simple Words */}
      <section className="space-y-6 mb-10">
        <h3 className="font-black text-sm uppercase text-black border-b-2 pb-2">Agreement Rules:</h3>
        <div className="space-y-4 text-base">
          <p className="flex gap-4"><strong>1.</strong> <span>If you break or damage the equipment, you will pay for all the repairs at the current market price.</span></p>
          <p className="flex gap-4"><strong>2.</strong> <span>If the equipment is lost, stolen, or damaged too much to fix, you must buy a new one for us at the current market price.</span></p>
          <p className="flex gap-4"><strong>3.</strong> <span>If you return the equipment late without telling us first, you will pay a fine of <strong>KES 1,000 for every day</strong> you are late.</span></p>
          <p className="flex gap-4"><strong>4.</strong> <span>The equipment belongs to <strong>{companyName}</strong>. You are only hiring it for the time stated above.</span></p>
        </div>
      </section>

      {/* Financial Box */}
      <section className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed flex justify-between items-center mb-10">
            <div className="text-sm font-bold opacity-60">Total Rental Cost:</div>
            <div className="text-right">
                <p className="text-3xl font-black" style={{ color: primaryColor }}>{formatCurrency(total || 0)}</p>
                {applyVat && <p className="text-xs opacity-60">(Includes 16% VAT)</p>}
            </div>
      </section>

      {/* Signatures */}
      <section className="mt-auto grid grid-cols-2 gap-20 pt-10">
        <div className="space-y-4">
            <div className="h-20 border-b-2 border-dashed border-gray-300"></div>
            <p className="text-xs font-black uppercase text-center opacity-50">Authorized Signature (The Owner)</p>
        </div>
        <div className="space-y-4">
            <div className="h-20 border-b-2 border-dashed border-gray-300 flex items-end justify-center">
                {signature && <img src={signature} alt="Client Sign" className="max-h-full w-auto" crossOrigin="anonymous" />}
            </div>
            <p className="text-xs font-black uppercase text-center opacity-50">Client Signature (The Client)</p>
        </div>
      </section>

      <footer className="text-center pt-8 mt-10 border-t opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Official Business Record</p>
      </footer>
    </div>
  );
}
