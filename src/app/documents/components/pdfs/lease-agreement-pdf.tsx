
'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function LeaseAgreementPdf({ document: docSnapshot }: { document: AppDocument }) {
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
  const data = docSnapshot.data;
  
  const customer = data.customer || {
    name: data.customerName || 'VALUED CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || ''
  };

  const { items, details, lease, subtotal, total, applyVat, vat, clientType, verification, signature } = data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const companyName = workspace?.name || 'SIMONSTYLESTECHNOLOGIES LIMITED';
  const docNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 4).toUpperCase();
  const isIndividual = clientType === 'Individual' || !clientType;
  const isStudent = verification?.studentId;

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
            <div className="bg-black text-white px-6 py-2 text-lg font-black uppercase tracking-widest text-center">
                LEASE HIRE AGREEMENT
            </div>
        </div>
      </div>

      {/* Bill To & Meta Info */}
      <div className="grid grid-cols-2 gap-10 mb-8">
        <div className="space-y-3">
            <h3 className="font-black uppercase text-[11px] border-b border-black pb-0.5 w-fit">LESSEE (CLIENT):</h3>
            <div className="space-y-1">
                <p className="font-black text-[14px] uppercase">{customer.name}</p>
                <p className="font-bold">{customer.email || 'Contact Person'}</p>
                <p className="font-bold">{customer.phone}</p>
                <div className="pt-2 border-t mt-2 space-y-0.5">
                    {isIndividual ? (
                        <>
                            <p className="text-[10px]"><strong>National ID:</strong> {verification?.nationalId || 'Verified'}</p>
                            {isStudent && <p className="text-[10px] text-primary font-bold">Student ID: {verification.studentId}</p>}
                        </>
                    ) : (
                        <>
                            <p className="text-[10px]"><strong>Permit No:</strong> {verification?.businessPermit || 'N/A'}</p>
                            <p className="text-[10px]"><strong>Director ID:</strong> {verification?.directorId || 'N/A'}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
        <div className="text-right space-y-1">
            <h3 className="font-black uppercase text-[11px] border-b border-black pb-0.5 w-fit ml-auto">CONTRACT INFO:</h3>
            <p className="font-bold"><span className="opacity-60">Agreement No:</span> {docNo}</p>
            <p className="font-bold"><span className="opacity-60">Start Date:</span> {format(new Date(lease?.startDate || docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
            <p className="font-bold text-destructive"><span className="opacity-60">Return Date:</span> {format(new Date(lease?.endDate || docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
            <p className="font-black uppercase text-lg"><span className="opacity-60">Duration:</span> {lease?.duration} {lease?.unit || lease?.durationUnit}(s)</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-2 border-black text-left">
                    <th className="py-2 font-black uppercase">DEVICE DESCRIPTION</th>
                    <th className="py-2 px-2 text-center font-black uppercase w-16">QTY</th>
                    <th className="py-2 text-right font-black uppercase w-32">RATE/UNIT</th>
                    <th className="py-2 text-right font-black uppercase w-32">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => {
                    const rowAmount = item.quantity * item.unitPrice * (Number(lease?.duration) || 1);
                    return (
                        <tr key={idx} className="font-bold">
                            <td className="py-4 align-top pr-4">
                                <p className="leading-tight text-sm">{item.description}</p>
                                {item.serialNumber && <p className="text-[9px] font-mono opacity-50 mt-1 uppercase">S/N: {item.serialNumber}</p>}
                            </td>
                            <td className="py-4 align-top text-center">{item.quantity}</td>
                            <td className="py-4 align-top text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-4 align-top text-right">{formatCurrency(rowAmount)}</td>
                        </tr>
                    );
                })}
                {/* Visual dotted spacer */}
                <tr>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                </tr>
            </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mt-4">
            <div className="w-[300px] space-y-1">
                <div className="flex justify-between items-center py-1">
                    <span className="font-black uppercase">RENTAL TOTAL</span>
                    <span className="font-black">KES. {formatCurrency(subtotal || 0)}</span>
                </div>
                {applyVat && (
                    <div className="flex justify-between items-center py-1">
                        <span className="font-black uppercase">VAT 16%</span>
                        <span className="font-black">KSH. {formatCurrency(vat || 0)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center bg-gray-50 p-2 border-y-2 border-black">
                    <span className="font-black text-sm uppercase">GRAND TOTAL</span>
                    <span className="font-black text-sm uppercase">Ksh.{formatCurrency(total || 0)}</span>
                </div>
            </div>
        </div>

        {/* Terms and Conditions - Simplified but high-fi */}
        <div className="mt-8 space-y-4">
            <h4 className="font-black uppercase text-[11px] border-b pb-0.5 mb-2">AGREEMENT TERMS</h4>
            <div className="grid grid-cols-1 gap-2 text-[11px] font-bold leading-relaxed">
                <p>1. Mishandling: If you damage the equipment, you will pay for all repairs at the current market price.</p>
                <p>2. Loss/Theft: If equipment is lost or stolen, you must buy a replacement unit at the current market price.</p>
                <p>3. Penalties: Delayed return attracts a fine of KES 1,000 for every day you are late without communication.</p>
                <p>4. Ownership: The equipment remains the sole property of {companyName}.</p>
            </div>
        </div>

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-12">
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted"></div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">LESSOR SIGNATURE (OWNER)</p>
            </div>
            <div className="space-y-4">
                <div className="h-16 border-b border-black border-dotted flex items-end justify-center">
                    {signature && <img src={signature} alt="Client Sign" className="max-h-full w-auto" crossOrigin="anonymous" />}
                </div>
                <p className="text-[10px] font-black uppercase text-center opacity-50">LESSEE SIGNATURE (CLIENT)</p>
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
            <span>Agreement Printed On: {format(new Date(), "PPPP | p")}</span>
            <span>&gt;&gt;Served By: {docSnapshot.createdBy?.name || 'System'}</span>
         </div>
      </footer>
    </div>
  );
}
