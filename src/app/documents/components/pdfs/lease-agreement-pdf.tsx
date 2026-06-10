'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview Simplified Hardware Lease Agreement PDF
 * Features large text, simple full sentences, and high-fidelity black/white styling.
 */
export function LeaseAgreementPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black">Error: Document metadata is missing.</div>;

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  
  const customer = data.customer || {
    name: data.customerName || 'VALUED CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { items, lease, total, applyVat, vat, clientType, verification, signature } = data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const companyName = workspace?.name || 'BUSINESS OWNER';
  const isIndividual = clientType === 'Individual' || !clientType;
  const isStudent = verification?.studentId;

  return (
    <div className="p-[15mm] font-sans text-[14px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border-4 border-black selection:bg-black selection:text-white">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-white flex items-center justify-center text-[10px] font-bold border-2 border-black text-black">LOGO</div>
          )}
          <div className="space-y-1">
             <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter text-black">{companyName}</h1>
             <p className="text-[12px] italic font-bold text-black">Let's Tech-it!</p>
          </div>
        </div>
        <div className="text-right">
            <div className="bg-black text-white px-8 py-3 text-xl font-black uppercase tracking-widest text-center">
                HIRE AGREEMENT
            </div>
            <p className="mt-2 font-bold text-[12px] text-black">Date: {format(new Date(docSnapshot.generatedDate), "PPPP")}</p>
        </div>
      </header>

      {/* SIDE BY SIDE IDENTITY BLOCKS */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="space-y-4">
            <h3 className="font-black uppercase text-[12px] border-b-4 border-black pb-1 w-fit text-black">BUSINESS OWNER (LESSOR):</h3>
            <div className="space-y-1 text-black font-bold">
                <p className="text-lg uppercase">{companyName}</p>
                <p>{workspace?.address || 'Nairobi, Kenya'}</p>
                <p>Phone: {workspace?.phone}</p>
                <p>Email: {workspace?.email}</p>
            </div>
        </div>
        <div className="space-y-4">
            <h3 className="font-black uppercase text-[12px] border-b-4 border-black pb-1 w-fit text-black">CLIENT IDENTITY (LESSEE):</h3>
            <div className="space-y-1 text-black font-bold">
                <p className="text-lg uppercase">{customer.name}</p>
                <p>Phone: {customer.phone}</p>
                <p>Email: {customer.email || 'N/A'}</p>
                <div className="pt-2 border-t-2 border-black mt-2 space-y-1">
                    {isIndividual ? (
                        <>
                            <p>National ID: {verification?.nationalId || '________________'}</p>
                            {isStudent && <p className="text-primary underline">Student ID: {verification.studentId}</p>}
                        </>
                    ) : (
                        <>
                            <p>Business Permit: {verification?.businessPermit || '________________'}</p>
                            <p>Signatory ID: {verification?.directorId || '________________'}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* CONTRACT PERIOD BLOCK */}
      <div className="bg-white border-2 border-black p-6 mb-10 flex justify-between items-center">
        <div className="space-y-1">
            <h4 className="font-black uppercase text-[11px] text-black">DURATION OF HIRE</h4>
            <p className="text-3xl font-black text-black">{lease?.duration} {lease?.unit || lease?.durationUnit}(s)</p>
        </div>
        <div className="text-right space-y-1">
            <p className="font-bold text-black">Starts: {format(new Date(lease?.startDate || docSnapshot.generatedDate), "MMM dd, yyyy")}</p>
            <p className="font-black text-lg text-black underline">Return By: {format(new Date(lease?.endDate || docSnapshot.generatedDate), "MMM dd, yyyy")}</p>
        </div>
      </div>

      {/* ITEM TABLE */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-4 border-black text-left">
                    <th className="py-2 font-black uppercase text-black">EQUIPMENT DESCRIPTION</th>
                    <th className="py-2 text-center font-black uppercase w-20 text-black">QTY</th>
                    <th className="py-2 text-right font-black uppercase w-40 text-black">TOTAL COST</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => (
                    <tr key={idx} className="font-bold border-b-2 border-black">
                        <td className="py-4 align-top pr-4">
                            <p className="leading-tight text-lg text-black uppercase">{item.description}</p>
                            {item.serialNumber && <p className="font-mono text-[11px] mt-1 text-black">SERIAL NO: {item.serialNumber}</p>}
                        </td>
                        <td className="py-4 align-top text-center text-lg text-black">{item.quantity}</td>
                        <td className="py-4 align-top text-right text-lg text-black">{formatCurrency(item.unitPrice * item.quantity * (Number(lease?.duration) || 1))}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* TOTAL VALUE */}
        <div className="flex justify-end mt-6">
            <div className="bg-black text-white p-6 w-[350px] text-right">
                <span className="font-bold uppercase text-[11px]">TOTAL AMOUNT PAYABLE</span>
                <p className="text-3xl font-black tracking-tight">KES {formatCurrency(total || 0)}</p>
            </div>
        </div>

        {/* SIMPLE RULES SECTION */}
        <div className="mt-10 space-y-6">
            <h4 className="font-black uppercase text-[12px] border-b-4 border-black pb-1 w-fit text-black">SIMPLE HIRE RULES:</h4>
            <div className="grid grid-cols-1 gap-4 text-[13px] font-bold text-black leading-relaxed">
                <p>1. If you damage the equipment, you will pay for all repairs at the current market price.</p>
                <p>2. If the equipment is lost or stolen, you must buy a replacement unit for the business.</p>
                <p>3. If you return the equipment late, you will pay a fine of KES 1,000 for every day you are late.</p>
                <p>4. The equipment always belongs to {companyName}. You are only hiring it for the time shown above.</p>
            </div>
        </div>

        {/* SIGNATURES */}
        <div className="mt-16 grid grid-cols-2 gap-20">
            <div className="space-y-4">
                <div className="h-20 border-b-4 border-black flex items-end justify-center"></div>
                <p className="text-[12px] font-black uppercase text-center text-black">OWNER SIGNATURE</p>
            </div>
            <div className="space-y-4">
                <div className="h-20 border-b-4 border-black flex items-end justify-center overflow-hidden">
                    {signature && <img src={signature} alt="Client Sign" className="max-h-full w-auto" crossOrigin="anonymous" />}
                </div>
                <p className="text-[12px] font-black uppercase text-center text-black">CLIENT SIGNATURE</p>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto pt-10 text-center border-t-4 border-black">
         <p className="font-black text-[12px] tracking-wide text-black mb-4">
            Laptops Lease | Desktops | Printers | Chargers | Repair Services | Software
         </p>
         <div className="text-[10px] font-bold text-black space-y-1">
            <p>{workspace?.address || 'Nairobi, Kenya'}</p>
            <p>Tel: {workspace?.phone} | Email: {workspace?.email}</p>
         </div>
      </footer>
    </div>
  );
}