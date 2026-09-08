'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 10;
const ITEMS_PER_PAGE_OTHER = 18;

export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  const items = data.items || [];
  
  const customer = data.customer || {
    name: data.customerName || 'VALUED CLIENT',
    alias: '',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { subtotal, total, previousBalance = 0, vat = 0, applyVat } = data;
  const currentTotal = total || subtotal || 0;
  const totalAmountDue = currentTotal + (Number(previousBalance) || 0);

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const invoiceNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  const primaryBlue = "#1e3a8a"; 

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
    <div className="flex flex-col items-center gap-6 bg-slate-100 p-8">
      {pages.map((pageItems, pageIdx) => (
        <div 
            key={pageIdx} 
            className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
        >
          {/* HEADER (Only on First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-8 pb-8 border-b-4 border-black">
                <div className="flex items-center gap-6">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                    <p className="font-bold text-sm uppercase tracking-widest opacity-60">Official Tax Invoice / Statement</p>
                </div>
                </div>
                <div className="text-right space-y-1">
                    <p className="font-black uppercase text-xs">Head Office</p>
                    <p className="text-[10px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-lg font-black uppercase text-blue-800">Invoice No: {invoiceNo}</p>
                        <p className="text-xs font-bold text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <>
                <div className="flex w-full border-2 border-black overflow-hidden rounded-sm mb-6">
                    <div className="w-7/12 bg-gray-200 px-4 py-2 border-r-2 border-black font-black uppercase text-xs">Remittance Advice</div>
                    <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-xs">Account Summary</div>
                </div>

                <div className="text-sm leading-relaxed grid grid-cols-12 gap-6 mb-8">
                    <div className="col-span-7">
                        <p className="font-medium text-muted-foreground">Remit payment to: <span className="font-black uppercase text-black">{workspace?.name || 'THE BUSINESS'}</span></p>
                        <p className="mt-3">Due Date: <span className="font-black underline decoration-2">{format(new Date(), "dd/MM/yyyy")}</span></p>
                    </div>
                    <div className="col-span-5 border-l-2 border-black/10 pl-6">
                        <p className="font-black uppercase opacity-60 text-[10px]">Balance Due:</p>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">KES {formatCurrency(totalAmountDue)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 px-4 mb-10">
                    <div className="space-y-1">
                        <h3 className="font-black uppercase text-xs text-blue-900 underline underline-offset-4 decoration-2 mb-2">Billing From</h3>
                        <p className="font-black uppercase text-sm">{workspace?.name || 'OFFICIAL BUSINESS'}</p>
                        <p className="opacity-80 leading-tight font-medium text-xs">{workspace?.address || 'Nairobi, Kenya'}</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black uppercase text-xs text-blue-900 underline underline-offset-4 decoration-2 mb-2">Billing To</h3>
                        <p className="font-black uppercase text-sm">{customer.alias || customer.name}</p>
                        <p className="opacity-80 leading-tight font-medium text-xs">{customer.address || 'Nairobi, Kenya'}</p>
                    </div>
                </div>
            </>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Invoice Continued: {invoiceNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <div className="flex-grow overflow-hidden border-2 border-black rounded-sm flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-black text-xs border-r border-blue-900 uppercase text-center w-12">#</th>
                        <th className="p-3 font-black text-xs border-r border-blue-900 uppercase">Description</th>
                        <th className="p-3 text-right font-black text-xs border-r border-blue-900 w-16 uppercase">Qty</th>
                        <th className="p-3 text-right font-black text-xs border-r border-blue-900 w-24 uppercase">Rate</th>
                        <th className="p-3 text-right font-black text-xs w-32 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const name = item.name || item.description;
                        const unitPrice = item.price || item.sellingPrice || item.unitPrice || 0;
                        const qty = item.quantity || 1;
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="p-3 font-bold text-center border-r border-gray-100 text-xs">{pageIdx * ITEMS_PER_PAGE_OTHER + idx + 1}</td>
                                <td className="p-3 border-r border-gray-100">
                                    <p className="font-black uppercase leading-tight text-xs">{name}</p>
                                    {item.serialNumber && <p className="text-[9px] font-mono opacity-50 uppercase mt-0.5">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-3 text-right tabular-nums font-bold border-r border-gray-100 text-xs">{qty}</td>
                                <td className="p-3 text-right tabular-nums font-medium border-r border-gray-100 text-xs">{formatCurrency(unitPrice)}</td>
                                <td className="p-3 text-right tabular-nums font-black text-xs">{formatCurrency(qty * unitPrice)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* TOTALS (Only on Last Page) */}
          {pageIdx === pages.length - 1 && (
            <div className="mt-6 flex flex-col gap-6">
                <div className="flex justify-end">
                    <div className="w-[350px] space-y-1">
                        <div className="flex justify-between p-2 border-b border-gray-100">
                            <span className="font-black uppercase opacity-60 text-[10px]">Subtotal</span>
                            <span className="font-black text-sm">{formatCurrency(subtotal || total)}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b border-gray-100">
                            <span className="font-black uppercase opacity-60 text-[10px]">VAT (16%)</span>
                            <span className="font-black text-sm">{formatCurrency(vat)}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b border-gray-100 bg-orange-50/50">
                            <span className="font-black uppercase text-orange-600 text-[10px]">Brought Forward</span>
                            <span className="font-black text-orange-700 text-sm">{formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between p-4 border-t-4 border-black bg-blue-50 mt-2">
                            <span className="font-black uppercase text-blue-900 text-xs">Total Amount Due</span>
                            <span className="font-black text-3xl tracking-tighter text-blue-900">KES {formatCurrency(totalAmountDue)}</span>
                        </div>
                    </div>
                </div>
                
                <p className="font-black uppercase italic opacity-60 text-[10px] leading-relaxed border-l-4 border-black pl-4">
                    Amount in words: {numberToWords(totalAmountDue)}
                </p>

                <div className="mt-4 pt-8 border-t border-dashed grid grid-cols-2 gap-20">
                    <div className="space-y-4">
                        <div className="h-10 border-b border-black border-dotted"></div>
                        <p className="text-[10px] font-black uppercase text-center opacity-40">Client Acceptance</p>
                    </div>
                    <div className="space-y-4">
                        <div className="h-10 border-b border-black border-dotted"></div>
                        <p className="text-[10px] font-black uppercase text-center opacity-40">Authorized Signature</p>
                    </div>
                </div>
            </div>
          )}

          <footer className="mt-auto pt-6 border-t-2 border-gray-200 bg-white">
             <div className="flex justify-between items-end">
                <div className="font-bold text-gray-500 space-y-0.5 text-[9px]">
                    <p className="uppercase">{workspace?.name}</p>
                    <p className="opacity-60">Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="font-black bg-gray-100 px-3 py-1 rounded text-xs">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
