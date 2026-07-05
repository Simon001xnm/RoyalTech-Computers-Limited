'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

function numberToWords(num: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  if (num === 0) return 'ZERO';
  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convert(n % 100) : '');
    return n.toString();
  };
  return convert(Math.floor(num)) + ' SHILLINGS ONLY';
}

export function LeaseAgreementPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const customer = data.customer || { name: 'VALUED CLIENT', phone: '', email: '', address: 'Nairobi' };
  const { items, lease, total, clientType, verification, signature } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#7c3aed";
  const secondaryIndigo = "#f5f3ff";

  return (
    <div className="p-[10mm] font-sans text-[10px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Lease Agreement</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-20 inline-block opacity-60">Contract No</span> <span className="font-bold">{docSnapshot.title.split('#').pop()}</span></p>
                <p><span className="w-20 inline-block opacity-60">Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
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
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Lessor</h3>
            <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
            <p className="text-[9px] font-medium text-black/70">{workspace?.address}</p>
        </div>
        <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Lessee</h3>
            <p className="font-bold uppercase">{customer.name}</p>
            <p className="text-[9px] font-bold">ID: {verification?.nationalId || verification?.businessPermit || 'N/A'}</p>
            <p className="text-[9px] font-medium text-black/70">{customer.phone}</p>
        </div>
      </section>

      <div className="p-4 border rounded-xl bg-muted/20 mb-6 flex justify-between items-center">
        <div>
            <p className="text-[8px] font-black uppercase opacity-40">Lease Duration</p>
            <p className="text-xl font-black">{lease?.duration} {lease?.unit}(s)</p>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-bold">Starts: {format(new Date(lease?.startDate || docSnapshot.generatedDate), "MMM dd, yyyy")}</p>
            <p className="text-[9px] font-black underline">Expires: {format(new Date(lease?.endDate || docSnapshot.generatedDate), "MMM dd, yyyy")}</p>
        </div>
      </div>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-bold text-[9px] rounded-l-sm">Equipment Description</th>
                    <th className="py-2 text-center font-bold text-[9px] w-20">Quantity</th>
                    <th className="py-2 px-3 text-right font-bold text-[9px] rounded-r-sm w-40">Rental Cost</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: DocumentLineItem, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-3 align-top">
                            <p className="font-bold text-[10px] uppercase">{item.description}</p>
                            {item.serialNumber && <p className="text-[8px] font-mono text-gray-500">S/N: {item.serialNumber}</p>}
                        </td>
                        <td className="py-3 text-center text-[10px]">{item.quantity}</td>
                        <td className="py-3 px-3 text-right text-[10px] font-bold">KES {formatCurrency(item.unitPrice * item.quantity * (Number(lease?.duration) || 1))}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-end mt-4">
            <div className="bg-black text-white p-4 w-[280px] text-right rounded-lg">
                <span className="font-bold uppercase text-[9px]">Grand Total Payable</span>
                <p className="text-xl font-black">KES {formatCurrency(total)}</p>
                <p className="text-[8px] uppercase mt-1 opacity-80">{numberToWords(total)}</p>
            </div>
        </div>

        <div className="mt-8 space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-widest style={{ color: primaryIndigo }}">Standard Lease Terms</h4>
            <div className="grid grid-cols-1 gap-1 text-[8px] font-medium leading-tight opacity-70">
                <p>1. OWNER: The equipment remains property of {workspace?.name} at all times.</p>
                <p>2. DAMAGE: Lessee is liable for full market value replacement if damaged, lost or stolen.</p>
                <p>3. LATE RETURN: A penalty fee of KES 1,000 per day applies for late returns.</p>
            </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-20">
            <div className="space-y-4">
                <div className="h-14 border-b border-black"></div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Owner Signature</p>
            </div>
            <div className="space-y-4">
                <div className="h-14 border-b border-black flex items-end justify-center overflow-hidden">
                    {signature && <img src={signature} alt="Client Sign" className="max-h-full w-auto" crossOrigin="anonymous" />}
                </div>
                <p className="text-[9px] font-black uppercase text-center opacity-40">Lessee Signature</p>
            </div>
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center border-t border-gray-100">
         <p className="text-[10px] font-bold text-black uppercase">Official Lease Documentation</p>
      </footer>
    </div>
  );
}
