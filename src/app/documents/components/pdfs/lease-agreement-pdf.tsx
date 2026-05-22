
'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
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
  const { customer, items, details, lease, subtotal, total, applyVat, vat } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const primaryColor = workspace?.primaryColor || '#2c3e50';

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
            <h2 className="text-2xl font-black uppercase text-gray-400">Lease Agreement</h2>
            <p className="text-xs font-mono">{document.title}</p>
        </div>
      </header>

      <section className="my-8">
        <p className="leading-relaxed text-xs">
          This hire agreement is made on <strong>{format(new Date(document.generatedDate), "PPP")}</strong> between <strong>{workspace?.name}</strong> (Lessor) and the client specified below (Lessee).
        </p>
      </section>

      <section className="grid grid-cols-2 gap-8 mb-10">
        <div className="bg-gray-50 p-4 rounded-xl border">
          <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">Lessee / Client:</h3>
          {customer ? (
            <div className="space-y-0.5">
              <p className="font-bold text-lg">{customer.name}</p>
              <p className="text-xs text-gray-600">{customer.address || 'Address not specified'}</p>
              <p className="text-xs text-gray-600">ID/Passport: {customer.idNumber || 'N/A'}</p>
              <p className="text-xs text-gray-600">Tel: {customer.phone}</p>
            </div>
          ) : <p>Customer details missing.</p>}
        </div>
        <div className="text-right">
           <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2">Lease Period:</h3>
           <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 inline-block">
              <p className="font-black text-xl text-primary">{lease?.duration} {lease?.unit}(s)</p>
              <p className="text-[10px] font-bold uppercase opacity-60">Commencing: {format(new Date(lease?.startDate || document.generatedDate), "MMM d, yyyy")}</p>
           </div>
        </div>
      </section>

      <section>
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest rounded-tl-lg">Description of Hired Equipment</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-24">Qty</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-32">Rate per Unit</th>
              <th className="p-3 text-[10px] uppercase font-black tracking-widest text-right w-32 rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: DocumentLineItem, idx: number) => (
              <tr key={idx} className="border-b bg-gray-50/30">
                <td className="p-4 font-bold text-sm">{item.description}</td>
                <td className="p-4 text-right">{item.quantity}</td>
                <td className="p-4 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-4 text-right font-black">{formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className="flex justify-between mt-10">
        <div className="w-[60%]">
          <h4 className="font-bold text-[10px] uppercase text-gray-500 mb-3">Terms of Hire:</h4>
          <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-gray-600">
            <li>The equipment remains the sole property of {workspace?.name}.</li>
            <li>The Lessee is responsible for any damage or loss during the period of hire.</li>
            <li>Equipment must be returned by the agreed date to avoid late penalty charges.</li>
            <li>The hire rate specified is for the duration stated above.</li>
          </ol>
        </div>
        <div className="w-[30%] space-y-1">
             <div className="flex justify-between py-1 text-xs border-b">
                <span>Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {applyVat && <div className="flex justify-between py-1 text-xs border-b">
                <span>VAT (16%):</span>
                <span className="font-bold">{formatCurrency(vat)}</span>
            </div>}
            <div className="flex justify-between py-3">
                <span className="font-black text-lg">Total Due:</span>
                <span className="font-black text-lg" style={{ color: primaryColor }}>{formatCurrency(total)}</span>
            </div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-20">
        <div className="space-y-8">
            <div className="h-10 border-b-2 border-dashed border-gray-300"></div>
            <p className="text-[10px] font-black uppercase text-center opacity-60">Lessor Authorized Signature</p>
        </div>
        <div className="space-y-8">
            <div className="h-10 border-b-2 border-dashed border-gray-300"></div>
            <p className="text-[10px] font-black uppercase text-center opacity-60">Lessee / Client Signature</p>
        </div>
      </section>

      <div className="flex-grow"></div>

      <footer className="text-center pt-8 mt-10 border-t">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Official Lease Agreement</p>
      </footer>
    </div>
  );
}
