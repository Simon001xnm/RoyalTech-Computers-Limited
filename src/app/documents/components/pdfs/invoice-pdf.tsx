'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview High-Fidelity Professional Invoice
 * Complies with BusinessHub SaaS High-Contrast PDF Standards.
 * Uses pure black text (#000000) and no transparency.
 */
export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
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

  const { items, details, subtotal, vat, total } = data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const companyName = workspace?.name || 'BUSINESS NAME';
  const invoiceNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 8).toUpperCase();
  const trackingCode = docSnapshot.id.slice(0, 12).toUpperCase();

  return (
    <div className="p-[20mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border-4 border-black selection:bg-black selection:text-white">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-white flex items-center justify-center text-[10px] font-bold border-2 border-black">LOGO</div>
          )}
          <div className="space-y-1">
             <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter text-black">{companyName}</h1>
             <div className="text-[10px] font-bold space-y-0.5 text-black">
                <p>{workspace?.address}</p>
                <p>Tel: {workspace?.phone} | Email: {workspace?.email}</p>
                <p>PIN: {workspace?.taxPin || workspace?.kraPin || 'N/A'}</p>
                {workspace?.website && <p>Web: {workspace?.website}</p>}
             </div>
          </div>
        </div>
        <div className="text-right">
            <div className="bg-black text-white px-10 py-3 text-2xl font-black uppercase tracking-[0.2em] mb-4">
                INVOICE
            </div>
            <div className="space-y-1 text-[11px] font-bold text-black">
                <p><span className="uppercase">Invoice No:</span> {workspace?.invoicePrefix || 'INV'}-{invoiceNo}</p>
                <p><span className="uppercase">Date:</span> {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                <p><span className="uppercase">Due Date:</span> {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                <p><span className="uppercase">TRKNG:</span> {trackingCode}</p>
            </div>
        </div>
      </header>

      {/* CUSTOMER SECTION */}
      <section className="grid grid-cols-2 gap-10 mb-12">
        <div className="space-y-2">
            <h3 className="font-black uppercase text-[11px] border-b-2 border-black pb-1 w-fit mb-3 text-black">BILL TO:</h3>
            <div className="space-y-0.5">
                <p className="font-black text-base uppercase leading-tight text-black">{customer.name}</p>
                <p className="font-bold text-black">{customer.address}</p>
                <p className="font-bold text-black">{customer.phone}</p>
                <p className="font-bold text-black">{customer.email}</p>
            </div>
        </div>
        <div className="bg-white p-6 border-2 border-black flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase mb-1 text-black">Internal Reference</p>
            <p className="font-bold text-sm text-black">CLIENT-ID: {customer.id?.slice(0, 8).toUpperCase() || 'WALK-IN'}</p>
            <p className="font-bold text-sm text-black">NODE: {docSnapshot.tenantId?.slice(0, 8).toUpperCase()}</p>
        </div>
      </section>

      {/* ITEM TABLE SECTION */}
      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-2 border-black text-left">
                    <th className="py-3 font-black uppercase text-[11px] tracking-wider text-black">ITEM DESCRIPTION</th>
                    <th className="py-3 px-2 text-center font-black uppercase text-[11px] w-32 text-black">SERIAL NO</th>
                    <th className="py-3 text-center font-black uppercase text-[11px] w-16 text-black">QTY</th>
                    <th className="py-3 text-right font-black uppercase text-[11px] w-32 text-black">UNIT PRICE</th>
                    <th className="py-3 text-right font-black uppercase text-[11px] w-32 text-black">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: DocumentLineItem, idx: number) => {
                    const rowAmount = item.quantity * item.unitPrice;
                    return (
                        <tr key={idx} className="font-bold border-b border-black">
                            <td className="py-4 align-top pr-4">
                                <p className="leading-tight text-sm uppercase text-black">{item.description}</p>
                            </td>
                            <td className="py-4 align-top text-center font-mono text-[10px] uppercase text-black">{item.serialNumber || 'N/A'}</td>
                            <td className="py-4 align-top text-center text-black">{item.quantity}</td>
                            <td className="py-4 align-top text-right text-black">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-4 align-top text-right text-black">{formatCurrency(rowAmount)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* TOTALS SECTION */}
        <div className="flex justify-end mt-10">
            <div className="w-[350px] space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-black">
                    <span className="font-black uppercase text-[10px] text-black">SUB TOTAL</span>
                    <span className="font-bold text-sm text-black">KES {formatCurrency(subtotal || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-black">
                    <span className="font-black uppercase text-[10px] text-black">VAT ({workspace?.vatRate || 16}%)</span>
                    <span className="font-bold text-sm text-black">KES {formatCurrency(vat || 0)}</span>
                </div>
                <div className="flex justify-between items-center bg-black text-white p-4">
                    <span className="font-black text-base uppercase tracking-widest">GRAND TOTAL</span>
                    <span className="font-black text-lg">KES {formatCurrency(total || 0)}</span>
                </div>
            </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-4">
                <div>
                    <h4 className="font-black uppercase text-[10px] border-b-2 border-black pb-0.5 mb-2 text-black">PAYMENT SETTLEMENT</h4>
                    <div className="space-y-1 text-[11px] font-bold text-black">
                        <p className="uppercase">BANK: {workspace?.bankName || 'BANK NAME'}</p>
                        <p className="uppercase">ACC NAME: {workspace?.bankAccName || companyName}</p>
                        <p className="uppercase">ACC NO: {workspace?.bankAccNo || 'XXXXXXXXXX'}</p>
                        <p className="uppercase">BRANCH: {workspace?.bankBranch || 'BRANCH'}</p>
                        <p className="uppercase">PAYBILL/TILL: {workspace?.billingIdentifier || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-black uppercase text-[10px] border-b-2 border-black pb-0.5 mb-2 text-black">TERMS & CONDITIONS</h4>
                    <ul className="text-[9px] font-bold space-y-1 list-disc pl-4 text-black">
                        <li>Payment is strictly due upon presentation of this invoice.</li>
                        <li>Goods once sold are not returnable unless found defective.</li>
                        <li>This is a computer-generated document and is valid without a physical signature.</li>
                    </ul>
                </div>
            </section>

            <div className="flex flex-col justify-end items-end space-y-12">
                <div className="w-full text-center">
                    <div className="h-20 w-48 border-2 border-black border-dashed mx-auto flex items-center justify-center text-[10px] font-black uppercase text-black rotate-[-12deg]">
                        OFFICIAL STAMP
                    </div>
                    <p className="text-[10px] font-black uppercase mt-4 text-black">AUTHORIZED SIGNATORY</p>
                </div>
            </div>
        </div>
      </section>

      {/* COMPLIANCE FOOTER */}
      <footer className="mt-auto pt-10 border-t-2 border-black">
         <div className="text-[10px] flex justify-between items-end">
            <div className="space-y-1 font-bold text-black">
                <p className="uppercase tracking-widest">{companyName}</p>
                <p>{workspace?.address} | {workspace?.phone}</p>
            </div>
            <div className="text-right space-y-1 font-bold text-black">
                <p className="uppercase">Served By: {docSnapshot.createdBy?.name || 'Platform Node'}</p>
                <p className="uppercase text-[8px]">Printed: {format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
            </div>
         </div>
      </footer>
    </div>
  );
}