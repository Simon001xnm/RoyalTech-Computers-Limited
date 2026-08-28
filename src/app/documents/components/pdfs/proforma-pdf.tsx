'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 12;
const ITEMS_PER_PAGE_OTHER = 22;

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
            className="a4-pdf-page p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] h-[297mm] flex flex-col box-border shadow-md"
        >
          {/* HEADER (Only on First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    <h1 className="text-2xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Proforma Invoice</h1>
                    <div className="space-y-0.5 text-[10px] font-medium text-black">
                        <p><span className="w-20 inline-block opacity-60">Number</span> <span className="font-bold">{workspace?.invoicePrefix || 'PI'}{proformaNo}</span></p>
                        <p><span className="w-20 inline-block opacity-60">Date</span> <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "MMM dd, yyyy")}</span></p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-14 w-14 bg-gray-50 flex items-center justify-center text-[8px] font-black border border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
                    <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Billed By</h3>
                    <p className="font-bold uppercase">{workspace?.name || 'The Business'}</p>
                    <p className="text-[9px] font-medium text-black/70">{workspace?.address || 'Kenya'}</p>
                </div>
                <div className="p-3 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
                    <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Billed To</h3>
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-[9px] font-medium text-black/70">{customer.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[9px] font-medium text-black/70">{customer.phone}</p>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-4">
                <p className="text-[10px] font-black uppercase opacity-40">Proforma Continued: {proformaNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <section className="flex-grow">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className="py-2 px-3 font-bold text-[10px] rounded-l-sm">Item</th>
                        <th className="py-2 text-right font-bold text-[10px] w-16">TAX Rate</th>
                        <th className="py-2 text-right font-bold text-[10px] w-16">Quantity</th>
                        <th className="py-2 text-right font-bold text-[10px] w-24">Rate</th>
                        <th className="py-2 text-right font-bold text-[10px] w-24">Amount</th>
                        <th className="py-2 text-right font-bold text-[10px] w-16">TAX</th>
                        <th className="py-2 px-3 text-right font-bold text-[10px] rounded-r-sm w-32">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const name = item.name || item.description;
                        const desc = item.description && item.name ? item.description : null;
                        const unitPrice = item.price || item.unitPrice;
                        const rowSubtotal = item.quantity * unitPrice;
                        const rowTax = applyVat ? rowSubtotal * 0.16 : 0;
                        return (
                            <tr key={idx} className="border-b border-gray-100">
                                <td className="py-2 px-3 align-top">
                                    <p className="font-bold text-[10px] uppercase">{name}</p>
                                    {desc && <p className="text-[8px] text-gray-500 italic leading-tight">{desc}</p>}
                                    {item.serialNumber && <p className="text-[8px] text-gray-500 font-mono">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="py-2 text-right text-[9px]">{applyVat ? '16%' : '0%'}</td>
                                <td className="py-2 text-right text-[9px]">{item.quantity}</td>
                                <td className="py-2 text-right text-[9px]">KES {formatCurrency(unitPrice)}</td>
                                <td className="py-2 text-right text-[9px]">KES {formatCurrency(rowSubtotal)}</td>
                                <td className="py-2 text-right text-[9px]">KES {formatCurrency(rowTax)}</td>
                                <td className="py-2 px-3 text-right text-[9px] font-bold">KES {formatCurrency(rowSubtotal + rowTax)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pageIdx === pages.length - 1 && (
                <div className="flex justify-between items-start mt-4">
                    <div className="max-w-[300px]">
                        <p className="text-[9px] font-bold text-black uppercase">
                            Total (in words) : {numberToWords(total)}
                        </p>
                    </div>
                    <div className="w-[240px] space-y-2">
                        <div className="flex justify-between items-center text-[9px]">
                            <span className="font-bold opacity-60">Amount</span>
                            <span className="font-bold">KES {formatCurrency(subtotal || total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                            <span className="font-bold opacity-60">TAX</span>
                            <span className="font-bold">KES {formatCurrency(vat || 0)}</span>
                        </div>
                        <div className="pt-2 border-t border-black flex justify-between items-center">
                            <span className="text-[12px] font-bold">Total (KES)</span>
                            <span className="text-[14px] font-bold">KES {formatCurrency(total)}</span>
                        </div>
                        <div className="h-0.5 bg-black w-full mt-[-1px]"></div>
                    </div>
                </div>
            )}
          </section>

          <footer className="mt-auto pt-6 border-t border-gray-200">
             <div className="flex justify-between items-end">
                <div className="text-[9px] font-bold text-gray-500 space-y-0.5 text-center flex-1">
                    {workspace?.website && <p>{workspace.website}</p>}
                    <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="text-[10px] font-black shrink-0">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
