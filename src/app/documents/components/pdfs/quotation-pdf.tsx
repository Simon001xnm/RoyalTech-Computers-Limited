'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 10;
const ITEMS_PER_PAGE_OTHER = 18;

export function QuotationPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const items = data.items || [];
  const customer = data.customer || { name: 'VALUED CLIENT', phone: '', email: '', address: 'Kenya' };
  const { subtotal, total, applyVat } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#1d4ed8";
  
  const quoteNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  // Pagination Logic
  const pages: any[][] = [];
  let currentItems = [...items];
  pages.push(currentItems.slice(0, ITEMS_PER_PAGE_FIRST));
  currentItems = currentItems.slice(ITEMS_PER_PAGE_FIRST);
  while (currentItems.length > 0) {
      pages.push(currentItems.slice(0, ITEMS_PER_PAGE_OTHER));
      currentItems = currentItems.slice(ITEMS_PER_PAGE_OTHER);
  }
  if (pages.length === 0) pages.push([]);

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-100 p-4">
      {pages.map((pageItems, pageIdx) => (
        <div 
            key={pageIdx} 
            className="a4-pdf-page p-[10mm] font-sans text-[12px] bg-white text-black w-[210mm] h-[297mm] flex flex-col box-border shadow-md"
        >
          {/* BRANDED HEADER (Only on First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-8 pb-8 border-b-4 border-black">
                <div className="flex items-center gap-8">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-32 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                    <p className="font-bold text-[11px] opacity-70 uppercase tracking-widest">Official Business Quotation</p>
                </div>
                </div>
                <div className="text-right space-y-1.5">
                    <p className="font-black text-[12px] uppercase">Contact Details</p>
                    <p className="text-[10px] font-medium max-w-[220px] leading-tight">{workspace?.address || 'Kenya'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <p className="text-[10px] font-bold">Email: {workspace?.email || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-[14px] font-black uppercase text-blue-800">Quote No: {quoteNo}</p>
                        <p className="text-[11px] font-bold">Valid Until: {format(new Date(new Date(docSnapshot.generatedDate).setDate(new Date(docSnapshot.generatedDate).getDate() + 30)), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-8 mb-10">
                <div className="p-6 rounded-2xl space-y-1.5 border-2 border-slate-100 shadow-sm bg-gray-50">
                    <h3 className="font-black text-[12px] mb-3 uppercase text-blue-900 tracking-tight underline decoration-2 underline-offset-4">Quoted To</h3>
                    <p className="font-black text-sm uppercase">{customer.name}</p>
                    <p className="text-[11px] font-medium text-black/70 leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[11px] font-black text-black/70">{customer.phone}</p>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Quotation Continued: {quoteNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <section className="flex-grow">
            <table className="w-full border-collapse border-2 border-black">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className="p-4 font-black text-[11px] border-r border-blue-900 uppercase">Item Description</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">TAX</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">Qty</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-32 uppercase">Rate</th>
                        <th className="p-4 px-4 text-right font-black text-[11px] w-36 uppercase">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitPrice = item.price || item.unitPrice;
                        const rowSubtotal = item.quantity * unitPrice;
                        // STRICT SEQUENTIAL NUMBERING
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;

                        return (
                            <tr key={idx} className="border-b border-gray-100">
                                <td className="p-4 align-top border-r border-gray-100">
                                    <p className="font-black text-[13px] uppercase leading-tight">{itemNumber}. {item.name || item.description}</p>
                                </td>
                                <td className="p-4 text-right text-[11px] font-bold border-r border-gray-100">{applyVat ? '16%' : '0%'}</td>
                                <td className="p-4 text-right text-[11px] font-black border-r border-gray-100">{item.quantity}</td>
                                <td className="p-4 text-right text-[11px] font-medium border-r border-gray-100">KES {formatCurrency(unitPrice)}</td>
                                <td className="p-4 px-4 text-right text-[13px] font-black">{formatCurrency(rowSubtotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pageIdx === pages.length - 1 && (
                <div className="flex justify-between items-start mt-8">
                    <div className="max-w-[400px]">
                        <p className="text-[11px] font-black uppercase text-black leading-relaxed border-l-4 border-black pl-4">Amount in words: {numberToWords(total)}</p>
                        <div className="mt-10 space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-blue-900 underline underline-offset-4">Terms & Conditions</h4>
                            <p className="text-[11px] leading-relaxed text-gray-600 font-medium">
                                1. Validity: This quotation is valid for 30 days from the date of issuance.<br/>
                                2. Delivery: Items are dispatched within 24 hours of full payment confirmation.
                            </p>
                        </div>
                    </div>
                    <div className="w-[350px] space-y-3">
                        <div className="flex justify-between items-center p-2 border-b border-black/10">
                            <span className="font-bold opacity-60 uppercase text-[10px]">Net Quote Subtotal</span>
                            <span className="font-black text-[13px]">KES {formatCurrency(subtotal || total)}</span>
                        </div>
                        <div className="pt-4 border-t-4 border-black flex justify-between items-center px-2">
                            <span className="text-[14px] font-black uppercase">Grand Total</span>
                            <span className="text-3xl font-black text-blue-900 tracking-tighter">KES {formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="mt-auto pt-8 border-t-2 border-gray-200">
             {/* BRANDED FOOTER - Only on Last Page */}
             {pageIdx === pages.length - 1 && (
                <div className="text-center mb-4 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black">THIS DOCUMENT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryIndigo }}>{workspace?.name}</p>
                    <p className="text-[8px] font-bold text-black opacity-60">Phone: {workspace?.phone || 'N/A'} . Email: {workspace?.email || 'N/A'}</p>
                </div>
             )}

             {/* UNIVERSAL TRACKING - Every Page in Pure Black */}
             <div className="flex justify-between items-end">
                <div className="text-[8px] font-black uppercase tracking-tighter text-black">
                    GENERATED: {format(new Date(), 'dd/MM/yy HH:mm')}
                </div>
                <div className="text-[12px] font-black bg-gray-100 px-3 py-1 rounded text-black">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
