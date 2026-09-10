'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

// Increased capacity for high-density content
const ITEMS_PER_PAGE_FIRST = 18;
const ITEMS_PER_PAGE_OTHER = 26;

export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
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
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const subtotal = Number(data.subtotal || data.amount || 0);
  const vat = Number(data.vat || 0);
  const todayTotal = Number(data.total || (subtotal + vat));
  const amountPaidToday = data.amountPaid !== undefined ? Number(data.amountPaid) : todayTotal;
  const previousBalance = Number(data.previousBalance || 0);
  const balanceToday = Math.max(0, todayTotal - amountPaidToday);
  const totalAccountDebt = balanceToday + previousBalance;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 3).toUpperCase();

  const primaryBlue = "#1e3a8a";
  const successGreen = "#15803d"; 
  const warningOrange = "#9a3412";

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
            <header className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-16 w-auto object-contain" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-12 w-12 bg-gray-50 flex items-center justify-center text-[8px] font-bold border-2 border-dashed border-gray-200 text-gray-300 uppercase">LOGO</div>
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-[22px] font-black uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>
                      {workspace?.name || 'MATESH TECHNOLOGIES'}
                    </h1>
                    <p className="font-black text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: successGreen }}>Official Payment Receipt</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="font-black uppercase text-[9px]">Head Office Contact</p>
                    <p className="text-[8px] font-bold leading-tight uppercase max-w-[200px]">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[8px] font-bold">Tel: {workspace?.phone || '+254701694469'}</p>
                    <p className="text-[8px] font-bold lowercase opacity-60">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
                    <div className="pt-2">
                        <p className="text-[11px] font-black uppercase" style={{ color: primaryBlue }}>Receipt: #{receiptNo}</p>
                        <p className="text-[8px] font-bold text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <>
              <div className="h-0.5 w-full bg-black/10 mb-6" />
              
              {/* INFO BOXES */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-5 bg-[#f0f7ff] rounded-2xl border border-blue-100/50 space-y-2 min-h-[100px]">
                      <p className="text-[9px] font-black uppercase text-blue-800/60 tracking-widest">Payment From</p>
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-black uppercase tracking-tight leading-tight">{customer.name}</p>
                        <p className="text-[9px] font-medium opacity-50 uppercase leading-none">{customer.address || 'Nairobi, Kenya'}</p>
                      </div>
                  </div>
                  <div className="p-5 bg-[#fffbeb] rounded-2xl border border-amber-200/50 space-y-3 min-h-[100px]">
                      <p className="text-[9px] font-black uppercase text-amber-900/60 tracking-widest">Account Overview</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-amber-300/20 pb-1">
                            <span className="text-[9px] font-bold opacity-60">Prev Balance:</span>
                            <span className="text-[10px] font-black uppercase">KES {formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black uppercase text-amber-900 leading-none">Statement Due:</span>
                            <span className="text-xl font-black tracking-tighter leading-none" style={{ color: warningOrange }}>KES {formatCurrency(previousBalance + todayTotal)}</span>
                        </div>
                      </div>
                  </div>
              </div>
            </>
          )}

          {pageIdx > 0 && (
            <div className="mb-4">
                <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Receipt Continued: {receiptNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          {/* ITEM TABLE */}
          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-2.5 font-black text-[9px] uppercase rounded-l-sm">Description</th>
                        <th className="p-2.5 text-center font-black text-[9px] uppercase w-20">Tax</th>
                        <th className="p-2.5 text-center font-black text-[9px] uppercase w-20">Qty</th>
                        <th className="p-2.5 text-right font-black text-[9px] uppercase w-32">Rate</th>
                        <th className="p-2.5 text-right font-black text-[9px] uppercase w-36 rounded-r-sm">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-10">
                                <td className="p-2.5">
                                    <p className="font-bold uppercase leading-tight text-[10px]">
                                        {pageIdx * ITEMS_PER_PAGE_OTHER + idx + 1}. {item.name || item.description}
                                    </p>
                                </td>
                                <td className="p-2.5 text-center font-bold text-[9px] opacity-40">{data.applyVat ? '16%' : '0%'}</td>
                                <td className="p-2.5 text-center font-black text-[10px]">{qty}</td>
                                <td className="p-2.5 text-right tabular-nums font-bold text-[9px]">KES {formatCurrency(unitRate)}</td>
                                <td className="p-2.5 text-right tabular-nums font-black text-[10px]">KES {formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* SUMMARY BLOCK */}
          {pageIdx === pages.length - 1 && (
            <div className="mt-6 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-8">
                    <div className="flex-1 pt-2">
                        <p className="font-black uppercase text-[9px] leading-relaxed text-black max-w-[350px]">
                            Paid in words: <span className="font-bold underline underline-offset-4">{numberToWords(amountPaidToday)}</span>
                        </p>
                    </div>
                    <div className="w-[300px] space-y-1">
                        <div className="flex justify-between items-center px-2 py-1 border-t border-black/10">
                            <span className="font-bold opacity-40 uppercase text-[9px]">Today's Subtotal</span>
                            <span className="font-black text-[10px]">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2 py-1">
                            <span className="font-black uppercase text-[9px] opacity-80">Receipt Total</span>
                            <span className="font-black text-[10px]">KES {formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#f0fdf4] border-l-4 border-l-[#15803d] my-2 shadow-sm rounded-r-md">
                            <span className="text-[10px] font-black uppercase text-green-900">Amount Paid Today</span>
                            <span className="font-black tracking-tight text-[12px] text-green-900">KES {formatCurrency(amountPaidToday)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2 py-4 border-t-2 border-black mt-1">
                            <span className="text-[12px] font-black uppercase tracking-tighter">Total Account Debt</span>
                            <span className="font-black tracking-tighter text-[22px] leading-none" style={{ color: primaryBlue }}>KES {formatCurrency(totalAccountDebt)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             <div className="text-center space-y-1 pb-2">
                <p className="text-[8px] font-black uppercase tracking-tight text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                <p className="text-[9px] font-bold uppercase tracking-widest leading-none" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES'}</p>
                <p className="text-[8px] font-bold text-black">
                    Phone: {workspace?.phone || '+254701694469'}. Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                </p>
             </div>
             <div className="flex justify-between items-center mt-2">
                <div className="text-[8px] font-black uppercase tracking-tighter text-black">
                   GENERATED: {format(new Date(), 'dd/MM/yy HH:mm')}
                </div>
                <div className="font-black text-[8px] text-black uppercase tracking-widest">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}