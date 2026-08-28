'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 10;
const ITEMS_PER_PAGE_OTHER = 22;

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

  const { subtotal, total, amountPaid = 0, previousBalance = 0 } = data;
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
            className="a4-pdf-page p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] h-[297mm] flex flex-col box-border shadow-md"
        >
          {/* HEADER (Only on First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
                <div className="flex items-center gap-6">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</h1>
                    <p className="font-bold text-[10px] opacity-70">Official Tax Invoice / Statement</p>
                </div>
                </div>
                <div className="text-right space-y-1">
                    <p className="font-black text-[10px] uppercase">Head Office</p>
                    <p className="text-[9px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[9px] font-bold">Tel: {workspace?.phone || '0701694469'}</p>
                    <p className="text-[9px] font-bold">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
                    <div className="pt-2">
                        <p className="text-[10px] font-black uppercase text-blue-800">Invoice No: {invoiceNo}</p>
                        <p className="text-[9px] font-bold">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {/* Account Summary (Only on First Page) */}
          {pageIdx === 0 && (
            <>
                <div className="flex w-full mb-4 border border-black overflow-hidden rounded-sm">
                    <div className="w-7/12 bg-gray-200 px-4 py-2 border-r border-black font-black uppercase text-[10px]">Remittance Advice</div>
                    <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-[10px]">Account Summary</div>
                </div>
                <div className="text-[10px] leading-relaxed mb-6 grid grid-cols-12 gap-4">
                    <div className="col-span-7">
                        <p>To ensure proper credit, please enclose a copy of this statement with your payment and remit to: <span className="font-black uppercase">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</span></p>
                        <p className="mt-2">Payment Due Date: <span className="font-black">{format(new Date(), "dd/MM/yyyy")}</span></p>
                    </div>
                    <div className="col-span-5 border-l border-black/10 pl-4">
                        <p className="font-black text-xs">Total Balance Due:</p>
                        <p className="text-xl font-black text-blue-900">KES {formatCurrency(totalAmountDue)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-10 mb-8 px-2">
                    <div className="space-y-1">
                        <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billing From</h3>
                        <p className="font-black uppercase text-xs">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</p>
                        <p className="opacity-70 leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billing To</h3>
                        <p className="font-black uppercase text-xs">{customer.alias || customer.name}</p>
                        <p className="opacity-70 leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
                        <p className="opacity-70 font-bold">{customer.phone}</p>
                    </div>
                </div>
            </>
          )}

          {/* TABLE HEADER (If subsequent page, start fresh) */}
          {pageIdx > 0 && (
            <div className="mb-4">
                <p className="text-[10px] font-black uppercase opacity-40">Invoice Continued: {invoiceNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          {/* ITEMS TABLE */}
          <div className="flex-grow">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-black text-[9px] border border-blue-900">ITEM NO</th>
                        <th className="p-3 font-black text-[9px] border border-blue-900">DESCRIPTION</th>
                        <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-20">UNITS</th>
                        <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-28">UNIT PRICE</th>
                        <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-32">TOTAL</th>
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
                                <td className="p-3 font-medium text-center">{globalIdx + 1}.</td>
                                <td className="p-3">
                                    <p className="font-bold uppercase leading-normal">{name}</p>
                                    {item.serialNumber && <p className="text-[8px] font-mono opacity-50 mt-0.5">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-3 text-right tabular-nums">{qty.toFixed(2)}</td>
                                <td className="p-3 text-right tabular-nums">{formatCurrency(unitPrice)}</td>
                                <td className="p-3 text-right tabular-nums font-bold">{formatCurrency(qty * unitPrice)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Totals Section (Only on Last Page) */}
            {pageIdx === pages.length - 1 && (
                <div className="flex justify-end mt-6">
                    <div className="w-[300px]">
                        <div className="flex justify-between p-2 border border-gray-200">
                            <span className="font-black uppercase text-[9px] opacity-60">current order subtotal</span>
                            <span className="font-bold">{formatCurrency(currentTotal)}</span>
                        </div>
                        <div className="flex justify-between p-2 border border-t-0 border-gray-200 bg-orange-50">
                            <span className="font-black uppercase text-[9px] text-orange-600">previous account balance</span>
                            <span className="font-bold text-orange-700">{formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between p-3 border border-t-0 border-black bg-blue-50">
                            <span className="font-black uppercase text-xs">net amount due</span>
                            <span className="font-black text-lg">{formatCurrency(totalAmountDue)}</span>
                        </div>
                    </div>
                </div>
            )}
            
            {pageIdx === pages.length - 1 && (
                 <p className="mt-4 text-[9px] font-black uppercase italic opacity-60">
                    Amount in words: {numberToWords(totalAmountDue)}
                </p>
            )}
          </div>

          {/* FOOTER (On Every Page) */}
          <footer className="mt-auto pt-8 border-t border-gray-200">
             <div className="flex justify-between items-end">
                <div className="text-[9px] font-bold text-gray-500 space-y-0.5">
                    <p>{workspace?.name}</p>
                    <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="text-[10px] font-black">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
