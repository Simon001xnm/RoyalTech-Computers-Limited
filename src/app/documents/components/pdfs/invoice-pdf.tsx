'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 8;
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

  const { subtotal, total, previousBalance = 0 } = data;
  const currentTotal = total || subtotal || 0;
  const totalAmountDue = currentTotal + previousBalance;

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
  
  // Page 1
  pages.push(currentItems.slice(0, ITEMS_PER_PAGE_FIRST));
  currentItems = currentItems.slice(ITEMS_PER_PAGE_FIRST);
  
  // Subsequent pages
  while (currentItems.length > 0) {
      pages.push(currentItems.slice(0, ITEMS_PER_PAGE_OTHER));
      currentItems = currentItems.slice(ITEMS_PER_PAGE_OTHER);
  }

  // Fallback for empty items
  if (pages.length === 0) pages.push([]);

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-100 p-4">
      {pages.map((pageItems, pageIdx) => (
        <div 
            key={pageIdx} 
            className="a4-pdf-page p-[10mm] font-sans text-[12px] bg-white text-black w-[210mm] h-[297mm] flex flex-col box-border shadow-md"
        >
          {/* HEADER (Only on First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-8 pb-8 border-b-4 border-black">
                <div className="flex items-center gap-8">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-32 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                    <p className="font-bold text-[11px] uppercase tracking-widest opacity-60">Official Tax Invoice / Statement</p>
                </div>
                </div>
                <div className="text-right space-y-1.5">
                    <p className="font-black text-[12px] uppercase">Head Office</p>
                    <p className="text-[10px] font-medium max-w-[220px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <p className="text-[10px] font-bold">Email: {workspace?.email || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-[14px] font-black uppercase text-blue-800">Invoice No: {invoiceNo}</p>
                        <p className="text-[11px] font-bold">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {/* Account Summary (Only on First Page) */}
          {pageIdx === 0 && (
            <>
                <div className="flex w-full mb-6 border-2 border-black overflow-hidden rounded-sm">
                    <div className="w-7/12 bg-gray-200 px-6 py-3 border-r-2 border-black font-black uppercase text-[11px]">Remittance Advice</div>
                    <div className="w-5/12 bg-blue-100 px-6 py-3 font-black uppercase text-[11px]">Account Summary</div>
                </div>
                <div className="text-[11px] leading-relaxed mb-8 grid grid-cols-12 gap-6">
                    <div className="col-span-7">
                        <p className="font-medium">To ensure proper credit, please enclose a copy of this statement with your payment and remit to: <span className="font-black uppercase">{workspace?.name || 'THE BUSINESS'}</span></p>
                        <p className="mt-3">Payment Due Date: <span className="font-black underline">{format(new Date(), "dd/MM/yyyy")}</span></p>
                    </div>
                    <div className="col-span-5 border-l-2 border-black/10 pl-6">
                        <p className="font-black text-[12px] uppercase opacity-60">Total Balance Due:</p>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">KES {formatCurrency(totalAmountDue)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-12 mb-10 px-4">
                    <div className="space-y-1.5">
                        <h3 className="text-[11px] font-black uppercase text-blue-900 mb-2 underline decoration-2">Billing From</h3>
                        <p className="font-black uppercase text-sm">{workspace?.name || 'OFFICIAL BUSINESS'}</p>
                        <p className="opacity-80 leading-tight font-medium">{workspace?.address || 'Nairobi, Kenya'}</p>
                        {workspace?.taxPin && <p className="font-black text-[10px]">PIN: {workspace.taxPin}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-[11px] font-black uppercase text-blue-900 mb-2 underline decoration-2">Billing To</h3>
                        <p className="font-black uppercase text-sm">{customer.alias || customer.name}</p>
                        <p className="opacity-80 leading-tight font-medium">{customer.address || 'Nairobi, Kenya'}</p>
                        <p className="opacity-80 font-bold">{customer.phone}</p>
                    </div>
                </div>
            </>
          )}

          {/* TABLE HEADER (If subsequent page, start fresh) */}
          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Invoice Continued: {invoiceNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          {/* ITEMS TABLE */}
          <div className="flex-grow">
            <table className="w-full border-collapse border-2 border-black">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-4 font-black text-[11px] border-r border-blue-900 uppercase">Item No</th>
                        <th className="p-4 font-black text-[11px] border-r border-blue-900 uppercase">Description</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-24 uppercase">Units</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-32 uppercase">Unit Price</th>
                        <th className="p-4 text-right font-black text-[11px] w-36 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const globalIdx = (pageIdx === 0 ? 0 : ITEMS_PER_PAGE_FIRST + (pageIdx - 1) * ITEMS_PER_PAGE_OTHER) + idx;
                        const name = item.name || item.description;
                        const unitPrice = item.price || item.sellingPrice || item.unitPrice || 0;
                        const qty = item.quantity || 1;
                        return (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="p-4 font-medium text-center border-r border-gray-100">{globalIdx + 1}.</td>
                                <td className="p-4 border-r border-gray-100">
                                    <p className="font-black uppercase leading-normal text-[13px]">{name}</p>
                                    {item.serialNumber && <p className="text-[10px] font-mono opacity-50 mt-1 uppercase">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-4 text-right tabular-nums font-bold border-r border-gray-100">{qty.toFixed(0)}</td>
                                <td className="p-4 text-right tabular-nums font-medium border-r border-gray-100">{formatCurrency(unitPrice)}</td>
                                <td className="p-4 text-right tabular-nums font-black text-[13px]">{formatCurrency(qty * unitPrice)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Totals Section (Only on Last Page) */}
            {pageIdx === pages.length - 1 && (
                <div className="flex justify-end mt-8">
                    <div className="w-[350px]">
                        <div className="flex justify-between p-3 border-2 border-gray-200">
                            <span className="font-black uppercase text-[10px] opacity-60">Current Total</span>
                            <span className="font-black text-[13px]">{formatCurrency(currentTotal)}</span>
                        </div>
                        <div className="flex justify-between p-3 border-2 border-t-0 border-gray-200 bg-orange-50">
                            <span className="font-black uppercase text-[10px] text-orange-600">Balance Brought Forward</span>
                            <span className="font-black text-[13px] text-orange-700">{formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between p-4 border-2 border-t-0 border-black bg-blue-50">
                            <span className="font-black uppercase text-[12px]">Net Amount Due</span>
                            <span className="font-black text-2xl tracking-tighter text-blue-900">KES {formatCurrency(totalAmountDue)}</span>
                        </div>
                    </div>
                </div>
            )}
            
            {pageIdx === pages.length - 1 && (
                 <p className="mt-6 text-[11px] font-black uppercase italic opacity-60 leading-relaxed border-l-4 border-black pl-4">
                    Amount in words: {numberToWords(totalAmountDue)}
                </p>
            )}
          </div>

          {/* FOOTER (On Every Page) */}
          <footer className="mt-auto pt-8 border-t-2 border-gray-200">
             <div className="flex justify-between items-end">
                <div className="text-[10px] font-bold text-gray-500 space-y-1">
                    <p className="uppercase">{workspace?.name}</p>
                    <p className="opacity-60">Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="text-[12px] font-black bg-gray-100 px-3 py-1 rounded">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}

