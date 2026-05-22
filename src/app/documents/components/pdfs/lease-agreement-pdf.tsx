
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
  const companyName = workspace?.name || 'SIMONSTYLESTECHNOLOGIESLIMITED';

  return (
    <div className="p-[25mm] font-sans text-lg bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border leading-relaxed">
      {/* Header with Logo */}
      <header className="flex justify-between items-center pb-8 border-b-4" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-6">
          {workspace?.logoUrl ? (
            <img 
                src={workspace.logoUrl} 
                alt="Company Logo" 
                className="h-32 w-auto object-contain" 
                crossOrigin="anonymous"
            />
          ) : (
            <div className="h-24 w-24 bg-gray-100 flex items-center justify-center text-sm font-bold border-2 border-dashed">LOGO</div>
          )}
          <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase" style={{ color: primaryColor }}>{companyName}</h1>
              <p className="text-sm text-gray-700">{workspace?.address}</p>
              <p className="text-sm text-gray-700 font-bold">Phone: {workspace?.phone} | Email: {workspace?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-black uppercase text-gray-400">Hire Agreement</h2>
            <p className="text-xs font-mono tracking-tighter">{document.title}</p>
        </div>
      </header>

      {/* Intro Statement */}
      <section className="my-10 bg-gray-50 p-6 rounded-2xl border-l-8 border-black">
        <p className="text-lg">
          This Hardware Lease Agreement is made on <strong>{format(new Date(document.generatedDate), "PPP")}</strong> between <strong>{companyName}</strong> (the "Lessor") and the Client identified below (the "Lessee").
        </p>
      </section>

      {/* Customer and Contract Duration */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="space-y-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Client Identity:</h3>
          <div className="p-6 border-2 rounded-3xl bg-white shadow-sm space-y-2">
              <p className="font-black text-2xl uppercase">{customer?.name || 'VALUED CLIENT'}</p>
              <p className="text-sm text-gray-600">{customer?.address || 'Address not specified'}</p>
              <p className="text-sm font-bold">Contact: {customer?.phone}</p>
              
              <div className="pt-4 border-t mt-4 grid grid-cols-1 gap-2">
                {isIndividual ? (
                    <>
                        <p className="text-sm"><strong>ID Number:</strong> {verification?.nationalId || 'Verified'}</p>
                        <p className="text-sm"><strong>Guarantor ID:</strong> {verification?.guarantorId || 'N/A'}</p>
                        {isStudent && (
                            <div className="bg-blue-50 p-3 rounded-xl border-2 border-blue-100">
                                <p className="text-xs font-black text-blue-800 uppercase mb-1">Student Record</p>
                                <p className="text-sm">ID: {verification.studentId}</p>
                                <p className="text-sm">Guardian: {verification.parentName} ({verification.parentPhone})</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm"><strong>Business Permit:</strong> {verification?.businessPermit || 'N/A'}</p>
                        <p className="text-sm"><strong>CR12 Reference:</strong> {verification?.cr12Reference || 'N/A'}</p>
                        <p className="text-sm"><strong>Director ID:</strong> {verification?.directorId || 'N/A'}</p>
                    </>
                )}
              </div>
          </div>
        </div>
        <div className="text-right flex flex-col justify-center">
           <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 mb-4 text-right">Contract Period:</h3>
           <div className="bg-black text-white p-8 rounded-[40px] inline-block text-right shadow-2xl">
              <p className="text-sm font-bold uppercase opacity-70">Duration of Hire</p>
              <p className="font-black text-5xl my-2">{lease?.duration} {lease?.unit || lease?.durationUnit}(s)</p>
              <div className="mt-4 pt-4 border-t border-white/20 space-y-1">
                <p className="text-xs font-bold uppercase">Starts: {format(new Date(lease?.startDate || document.generatedDate), "MMM d, yyyy")}</p>
                <p className="text-sm font-black text-yellow-400 uppercase">Return By: {format(new Date(lease?.endDate || document.generatedDate), "MMM d, yyyy")}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Items Table */}
      <section className="mb-10">
        <table className="w-full text-left table-auto border-collapse overflow-hidden rounded-3xl shadow-sm">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-5 text-sm uppercase font-black tracking-widest">Hired Equipment</th>
              <th className="p-5 text-sm uppercase font-black tracking-widest text-center w-24">Qty</th>
              <th className="p-5 text-sm uppercase font-black tracking-widest text-right w-40">Rate / Unit</th>
              <th className="p-5 text-sm uppercase font-black tracking-widest text-right w-40">Total</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b-2 border-gray-100 bg-white">
                <td className="p-6">
                    <p className="font-black text-xl">{item.description}</p>
                    {item.serialNumber && <p className="text-xs font-mono text-gray-500 uppercase mt-1">Serial No: {item.serialNumber}</p>}
                </td>
                <td className="p-6 text-center font-bold text-lg">{item.quantity}</td>
                <td className="p-6 text-right font-bold text-lg">{formatCurrency(item.unitPrice)}</td>
                <td className="p-6 text-right font-black text-xl">{formatCurrency(item.unitPrice * item.quantity * (Number(lease?.duration) || 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Terms and Conditions - Simplified */}
      <section className="grid grid-cols-[1fr_250px] gap-12">
        <div className="space-y-6">
          <h4 className="font-black text-sm uppercase text-black border-b-4 pb-2 w-fit">Terms of the Agreement:</h4>
          <ol className="space-y-4 text-base font-medium">
            <li className="flex gap-4">
                <span className="font-black">1.</span>
                <span>If you break or damage the equipment, you will pay for all the repairs at the current market price.</span>
            </li>
            <li className="flex gap-4">
                <span className="font-black">2.</span>
                <span>If the equipment is lost, stolen, or damaged too much to fix, you must buy a new one for us at the current market price.</span>
            </li>
            <li className="flex gap-4">
                <span className="font-black">3.</span>
                <span>If you return the equipment late without telling us first, you must pay a fine of <strong>KES 1,000 for every day</strong> you are late.</span>
            </li>
            <li className="flex gap-4">
                <span className="font-black">4.</span>
                <span>The equipment belongs to <strong>{companyName}</strong>. You are only hiring it for the time mentioned above.</span>
            </li>
          </ol>
        </div>

        <div className="space-y-3 bg-gray-50 p-6 rounded-3xl border-2">
             <div className="flex justify-between py-1 text-sm font-bold border-b border-gray-200">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal || 0)}</span>
            </div>
            {applyVat && <div className="flex justify-between py-1 text-sm font-bold border-b border-gray-200 text-red-600">
                <span>VAT (16%):</span>
                <span>{formatCurrency(vat || 0)}</span>
            </div>}
            <div className="flex justify-between py-4 border-t-4 border-black mt-2">
                <span className="font-black text-xl uppercase">Total Amount:</span>
                <span className="font-black text-2xl" style={{ color: primaryColor }}>{formatCurrency(total || 0)}</span>
            </div>
        </div>
      </section>

      {/* Signatures */}
      <section className="mt-16 grid grid-cols-2 gap-20">
        <div className="space-y-6">
            <div className="h-24 flex items-end justify-center border-b-4 border-dashed border-gray-300">
                {/* Lessor Signature Area */}
            </div>
            <p className="text-xs font-black uppercase text-center opacity-50 tracking-[0.2em]">Authorized Signature (Lessor)</p>
        </div>
        <div className="space-y-6">
            <div className="h-24 flex items-end justify-center border-b-4 border-dashed border-gray-300 overflow-hidden bg-gray-50/50 rounded-t-2xl">
                {signature ? (
                    <img 
                        src={signature} 
                        alt="Client Signature" 
                        className="max-h-full w-auto object-contain" 
                        crossOrigin="anonymous"
                    />
                ) : null}
            </div>
            <p className="text-xs font-black uppercase text-center opacity-50 tracking-[0.2em]">Client Signature (Lessee)</p>
        </div>
      </section>

      <div className="flex-grow"></div>

      {/* Legal Footer */}
      <footer className="text-center pt-8 mt-12 border-t-2 border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300">official legal binding hire contract</p>
          <p className="text-[9px] text-gray-400 mt-3 font-medium">
            This document serves as proof of agreement between the two parties. All information is verified and stored in our secure cloud node.
          </p>
      </footer>
    </div>
  );
}
