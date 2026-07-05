'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview High-Fidelity Professional Receipt
 * Complies with BusinessHub SaaS High-Contrast PDF Standards.
 * Pure black text (#000000) on pure white background (#FFFFFF).
 */
export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  
  const customer = data.customer || {
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { items, paymentMethod, referenceCode, amount, amountPaid, changeDue, subtotal, vat, applyVat } = data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 8).toUpperCase();
  const companyName = workspace?.name || 'BUSINESS NAME';
  const trackingCode = docSnapshot.id.slice(0, 12).toUpperCase();

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border-4 border-black selection:bg-black selection:text-white">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-white flex items-center justify-center text-[10px] font-black border-4 border-black text-black">LOGO</div>
          )}
          <div className="space-y-1">
             <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter text-black">{companyName}</h1>
             <div className="text-[10px] font-bold space-y-0.5 text-black">
                <p>{workspace?.address || 'Nairobi, Kenya'}</p>
                <p>Tel: {workspace?.phone} | Email: {workspace?.email}</p>
                <p>PIN: {workspace?.taxPin || workspace?.kraPin || 'N/A'}</p>
             </div>
          </div>
        </div>
        <div className="text-right">
            <div className="bg-black text-white px-10 py-3 text-2xl font-black uppercase tracking-[0.15em] mb-4">
                OFFICIAL RECEIPT
            </div>
            <div className="space-y-1 text-[11px] font-black text-black">
                <p><span className="uppercase opacity-60">Receipt No:</span> {workspace?.receiptPrefix || 'RCT'}-{receiptNo}</p>
                <p><span className="uppercase opacity-60">Date:</span> {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                <p><span className="uppercase opacity-60">Track Code:</span> {trackingCode}</p>
            </div>
        </div>
      </header>

      {/* CUSTOMER SECTION */}
      <section className="mb-10 p-6 border-2 border-black bg-white">
        <h3 className="font-black uppercase text-[11px] border-b-2 border-black pb-1 w-fit mb-3 text-black">RECEIVED FROM:</h3>
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-0.5">
                <p className="font-black text-base uppercase leading-tight text-black">{customer.name}</p>
                <p className="font-bold text-black">{customer.phone}</p>
                <p className="font-bold text-black">{customer.email}</p>
                <p className="font-bold text-black italic text-[10px]">{customer.address}</p>
            </div>
            <div className="text-right flex flex-col justify-center border-l-2 border-black border-dotted pl-8">
                <p className="text-[10px] font-black uppercase opacity-60">Payment Method</p>
                <p className="text-lg font-black uppercase text-black">{paymentMethod}</p>
                {referenceCode && <p className="font-mono text-[10px] font-bold mt-1 text-black">REF: {referenceCode}</p>}
            </div>
        </div>
      </section>

      {/* ITEM TABLE SECTION */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-4 border-black text-left">
                    <th className="py-3 font-black uppercase text-[11px] text-black">ITEM DESCRIPTION</th>
                    <th className="py-3 px-2 text-center font-black uppercase text-[11px] w-32 text-black">SERIAL NO</th>
                    <th className="py-3 text-center font-black uppercase text-[11px] w-16 text-black">QTY</th>
                    <th className="py-3 text-right font-black uppercase text-[11px] w-32 text-black">UNIT PRICE</th>
                    <th className="py-3 text-right font-black uppercase text-[11px] w-32 text-black">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: SaleItem, idx: number) => (
                    <tr key={idx} className="font-bold border-b border-black border-dotted">
                        <td className="py-4 align-top pr-4">
                            <p className="leading-tight text-sm uppercase text-black">{item.name}</p>
                        </td>
                        <td className="py-4 align-top text-center font-mono text-[10px] uppercase text-black">{item.serialNumber || 'N/A'}</td>
                        <td className="py-4 align-top text-center text-black">{item.quantity}</td>
                        <td className="py-4 align-top text-right text-black">{formatCurrency(item.price)}</td>
                        <td className="py-4 align-top text-right text-black">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* TOTALS SECTION */}
        <div className="flex justify-end mt-10">
            <div className="w-[350px] space-y-2">
                <div className="flex justify-between items-center py-2 border-b-2 border-black">
                    <span className="font-black uppercase text-[10px] text-black">SUB TOTAL</span>
                    <span className="font-black text-sm text-black">KES {formatCurrency(subtotal || amount)}</span>
                </div>
                {applyVat && (
                    <div className="flex justify-between items-center py-2 border-b-2 border-black">
                        <span className="font-black uppercase text-[10px] text-black">VAT ({workspace?.vatRate || 16}%)</span>
                        <span className="font-black text-sm text-black">KES {formatCurrency(vat || 0)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center bg-black text-white p-5 mt-2">
                    <span className="font-black text-lg uppercase tracking-widest">TOTAL PAID</span>
                    <span className="font-black text-xl">KES {formatCurrency(amountPaid || amount)}</span>
                </div>
                {changeDue > 0 && (
                    <div className="flex justify-between items-center py-3 px-4 border-2 border-black mt-2">
                        <span className="font-black uppercase text-[10px] text-black">CHANGE RETURNED</span>
                        <span className="font-black text-lg text-black">KES {formatCurrency(changeDue)}</span>
                    </div>
                )}
            </div>
        </div>

        {/* VERIFICATION & SIGNATURE */}
        <div className="mt-16 grid grid-cols-2 gap-20">
            <div className="text-center flex flex-col items-center justify-center">
                <div className="inline-block border-[6px] border-black border-double px-12 py-6 rotate-[-5deg] mb-4">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-black">PAID IN FULL</h2>
                    <p className="text-[10px] font-bold mt-1 uppercase text-black">OFFICIAL VERIFICATION</p>
                </div>
                <p className="text-xs font-black uppercase text-black">Thank you for your business</p>
            </div>
            <div className="space-y-4 flex flex-col justify-end">
                <div className="h-20 border-b-4 border-black flex items-center justify-center text-[10px] font-black uppercase text-black/10">
                    AUTHORIZED STAMP AREA
                </div>
                <p className="text-[11px] font-black uppercase text-center text-black tracking-widest">AUTHORIZED SIGNATORY</p>
            </div>
        </div>
      </section>

      {/* PROFESSIONAL FOOTER */}
      <footer className="mt-auto pt-10 border-t-4 border-black">
         <p className="italic font-black text-[12px] tracking-wide text-black text-center mb-6">
            Laptops Lease | Desktops | Printers | Chargers | Memory etc | Sales & Services
         </p>
         <div className="text-[10px] flex justify-between items-end font-black text-black">
            <div className="space-y-1">
                <p className="uppercase tracking-widest text-sm">{companyName}</p>
                <p>{workspace?.address} | Tel: {workspace?.phone}</p>
                <p>Email: {workspace?.email} | Web: {workspace?.website || 'N/A'}</p>
            </div>
            <div className="text-right space-y-1">
                <p className="uppercase opacity-60">Served By: {docSnapshot.createdBy?.name || 'System Identity'}</p>
                <p className="uppercase text-[8px] opacity-40">System Audit Trace: {docSnapshot.id}</p>
                <p className="uppercase text-[8px] font-bold">Printed on: {format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
            </div>
         </div>
      </footer>
    </div>
  );
}
