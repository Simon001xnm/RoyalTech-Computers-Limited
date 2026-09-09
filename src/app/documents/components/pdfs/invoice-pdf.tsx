'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 12;
const ITEMS_PER_PAGE_OTHER = 22;

export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: liveCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black">Error: Document metadata is missing.</div>;

  const data = docSnapshot.data;
  const workspace = data.workspace || liveCompany;
  const items = data.items || [];
  
  const customer = data.customer || {
    name: data.customerName || 'VALUED CLIENT',
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
  const headerGray = "#f1f5f9";

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
          {/* HEADER (First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4 w-1/4">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-bold border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-center flex-1 pt-2 px-4 overflow-hidden">
                    <h1 className="text-[28px] font-black uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>
                      {workspace?.name || 'MATESH TECHNOLOGIES'}
                    </h1>
                    <p className="font-bold text-[10px] uppercase tracking-wide mt-1 opacity-70">Official Tax Invoice / Statement</p>
                </div>
                <div className="text-right w-1/3 space-y-0.5">
                    <p className="font-black uppercase text-[10px]">HEAD OFFICE</p>
                    <p className="text-[9px] font-bold leading-tight uppercase">{workspace?.address || 'GOOD HOPE PLAZA NAIROBI'}</p>
                    <p className="text-[9px] font-bold">Tel: {workspace?.phone || '+254701694469'}</p>
                    <p className="text-[9px] font-bold lowercase">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
                    <div className="pt-3">
                        <p className="text-[11px] font-black uppercase" style={{ color: primaryBlue }}>INVOICE NO: {invoiceNo}</p>
                        <p className="text-[9px] font-bold text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <>
              <div className="h-0.5 w-full bg-black mb-8" />
              
              {/* ADVICE BAR */}
              <div className="flex w-full mb-6 border border-black rounded-[8px] overflow-hidden">
                  <div className="w-[60%] border-r border-black p-2 bg-slate-50">
                      <p className="text-[10px] font-black uppercase tracking-widest">REMITTANCE ADVICE</p>
                  </div>
                  <div className="w-[40%] p-2 bg-[#e0f2fe]">
                      <p className="text-[10px] font-black uppercase tracking-widest">ACCOUNT SUMMARY</p>
                  </div>
              </div>

              <div className="grid grid-cols-[60%_40%] gap-0 mb-8 border-b pb-8">
                  <div className="pr-12 space-y-4">
                      <p className="text-[9px] leading-relaxed font-medium">
                        To ensure proper credit, please enclose a copy of this statement with your payment and remit to: <span className="font-black uppercase">{workspace?.name || 'MATESH TECHNOLOGIES'}</span>
                      </p>
                      <p className="text-[10px] font-bold">Payment Due Date: <span className="font-black">{format(new Date(docSnapshot.generatedDate), "dd/MM/yyyy")}</span></p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-blue-800">BILLING FROM</p>
                              <p className="text-[10px] font-black uppercase leading-tight">{workspace?.name || 'MATESH TECHNOLOGIES'}</p>
                              <p className="text-[9px] font-medium opacity-60 uppercase">{workspace?.address || 'GOOD HOPE PLAZA NAIROBI'}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-blue-800">BILLING TO</p>
                              <p className="text-[10px] font-black uppercase leading-tight">{customer.name}</p>
                              <p className="text-[9px] font-medium opacity-60 uppercase">{customer.address || 'Nairobi, Kenya'}</p>
                              <p className="text-[9px] font-bold">{customer.phone}</p>
                          </div>
                      </div>
                  </div>
                  <div className="bg-[#eff6ff]/30 p-6 flex flex-col justify-center border-l">
                      <p className="text-[12px] font-bold opacity-60">Total Balance Due:</p>
                      <p className="text-3xl font-black tracking-tighter" style={{ color: primaryBlue }}>KES {formatCurrency(totalAmountDue)}</p>
                  </div>
              </div>
            </>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Invoice Continued: {invoiceNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-black text-[9px] uppercase w-20">ITEM NO</th>
                        <th className="p-3 font-black text-[9px] uppercase">DESCRIPTION</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-24">UNITS</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-32">UNIT PRICE</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-36">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-12">
                                <td className="p-3 text-[10px] font-bold text-center opacity-40">{pageIdx * ITEMS_PER_PAGE_OTHER + idx + 1}.</td>
                                <td className="p-3">
                                    <p className="font-black uppercase leading-tight text-[11px]">{item.name || item.description}</p>
                                    {item.serialNumber && <p className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase opacity-60">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-3 text-right font-bold text-[10px]">{qty.toFixed(2)}</td>
                                <td className="p-3 text-right tabular-nums font-bold text-[10px]">{formatCurrency(unitRate)}</td>
                                <td className="p-3 text-right tabular-nums font-black text-[11px]">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* TOTALS (Last Page) */}
          {pageIdx === pages.length - 1 && (
            <div className="mt-8 flex flex-col gap-6">
                <div className="flex justify-between items-start gap-12">
                    <div className="flex-1 pt-12">
                        <p className="font-black uppercase text-[10px] leading-relaxed italic opacity-70">
                            AMOUNT IN WORDS: <span className="opacity-80">{numberToWords(currentTotal)}</span>
                        </p>
                    </div>
                    <div className="w-[340px] space-y-0 border-t border-black">
                        <div className="flex justify-between items-center p-3 bg-slate-50">
                            <span className="font-bold opacity-60 uppercase text-[9px]">CURRENT ORDER SUBTOTAL</span>
                            <span className="font-black text-[11px]">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50/50">
                            <span className="font-bold text-orange-700 uppercase text-[9px]">PREVIOUS ACCOUNT BALANCE</span>
                            <span className="font-black text-orange-700 text-[11px]">{formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center p-5 bg-[#e0f2fe]/40 border-2 border-black mt-2">
                            <span className="text-[12px] font-black uppercase">NET AMOUNT DUE</span>
                            <span className="font-black tracking-tight text-[22px]">KES {formatCurrency(totalAmountDue)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             <div className="flex justify-between items-end">
                <div className="font-bold text-gray-400 space-y-0.5 text-[8px]">
                    <p className="uppercase tracking-widest">{workspace?.name}</p>
                    <p className="opacity-60">Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="font-black bg-gray-50 px-3 py-1 rounded text-[9px] text-gray-400">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
