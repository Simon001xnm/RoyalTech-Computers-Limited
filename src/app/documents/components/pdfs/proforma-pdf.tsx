'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 10;
const ITEMS_PER_PAGE_OTHER = 18;

export function ProformaInvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: cloudCompany } = useDoc(companyRef);
  
  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;
  
  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const items = data.items || [];
  const customer = data.customer || { name: 'VALUED CLIENT', phone: '', email: '', address: 'Kenya' };
  const { subtotal, vat, total, applyVat } = data;
  const formatCurrency = (v: number | undefined) => new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const primaryIndigo = "#1d4ed8";
  const secondaryIndigo = "#f8fafc";
  
  const proformaNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

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
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-4 pb-4 border-b-4 border-black">
                <div className="space-y-3">
                    <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>Proforma Invoice</h1>
                    <div className="space-y-1 text-[11px] font-bold text-black/70">
                        <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px] text-black">Document No</span> <span className="font-black text-black">{workspace?.invoicePrefix || 'PI'}{proformaNo}</span></p>
                        <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px] text-black">Date Issued</span> <span className="font-black text-black">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-32 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border bg-gray-50 space-y-1">
                    <h3 className="font-black text-[10px] mb-2 uppercase text-blue-900 tracking-tight underline">Billed To</h3>
                    <p className="font-black text-sm uppercase text-black">{customer.name}</p>
                    <p className="text-[11px] font-medium text-black opacity-70">{customer.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[11px] font-black text-black">{customer.phone}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <div className="p-2 bg-slate-50 border rounded-lg border-black/5">
                        <p className="text-[6px] font-black uppercase text-black opacity-40 tracking-widest mb-0.5">Bank Details</p>
                        <p className="text-[8px] font-black text-black">DTB; MATESH TECHNOLOGIES</p>
                        <p className="text-[8px] font-black text-black">ACC: 0084976001</p>
                    </div>
                    <div className="p-2 bg-slate-50 border rounded-lg border-black/5">
                        <p className="text-[6px] font-black uppercase text-black opacity-40 tracking-widest mb-0.5">M-Pesa Instructions</p>
                        <p className="text-[8px] font-black text-black">PAYBILL: 516600 | ACC: 5084975001</p>
                    </div>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest text-black">Proforma Continued: {proformaNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <section className="flex-grow">
            <table className="w-full border-collapse border-2 border-black">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className="p-4 font-black text-[11px] border-r border-blue-900 uppercase">Item Description</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">TAX</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">Qty</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-28 uppercase">Rate</th>
                        <th className="p-4 px-4 text-right font-black text-[11px] w-36 uppercase">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const rowSubtotal = item.quantity * (item.price || item.unitPrice);
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100">
                                <td className="p-4 align-top border-r border-gray-100">
                                    <p className="font-black text-[13px] uppercase leading-tight text-black">{itemNumber}. {item.name || item.description}</p>
                                    {item.serialNumber && <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-4 text-right text-[11px] font-bold border-r border-gray-100 text-black">{applyVat ? '16%' : '0%'}</td>
                                <td className="p-4 text-right text-[11px] font-black border-r border-gray-100 text-black">{item.quantity}</td>
                                <td className="p-4 text-right text-[11px] font-medium border-r border-gray-100 text-black">{formatCurrency(item.price || item.unitPrice)}</td>
                                <td className="p-4 px-4 text-right text-[13px] font-black text-black">{formatCurrency(rowSubtotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pageIdx === pages.length - 1 && (
                <div className="flex justify-between items-start mt-8">
                    <div className="max-w-[380px]">
                        <p className="text-[11px] font-black uppercase text-black leading-relaxed border-l-4 border-black pl-4">
                            Total (in words) : {numberToWords(total)}
                        </p>
                    </div>
                    <div className="w-[350px] space-y-2">
                        <div className="flex justify-between items-center p-2 border-b border-black/10">
                            <span className="font-bold text-black opacity-60 uppercase text-[10px]">Net Amount</span>
                            <span className="font-black text-[13px] text-black">KES {formatCurrency(subtotal || total)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 border-b border-black/10">
                            <span className="font-bold text-black opacity-60 uppercase text-[10px]">Tax Amount</span>
                            <span className="font-black text-[13px] text-black">KES {formatCurrency(vat || 0)}</span>
                        </div>
                        <div className="pt-4 border-t-4 border-black flex justify-between items-center px-2">
                            <span className="text-[12px] font-black uppercase text-black">Grand Total</span>
                            <span className="text-3xl font-black text-blue-900 tracking-tighter">KES {formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            )}
          </section>

          <footer className="mt-auto pt-8 border-t-2 border-gray-200">
             {pageIdx === pages.length - 1 && (
                 <div className="text-center mb-4 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black">THIS DOCUMENT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryIndigo }}>{workspace?.name}</p>
                    <p className="text-[8px] font-bold text-black opacity-60">Phone: {workspace?.phone || 'N/A'} . Email: {workspace?.email || 'N/A'}</p>
                 </div>
             )}
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
