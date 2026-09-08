'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 15;
const ITEMS_PER_PAGE_OTHER = 25;

export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: liveCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-10 text-center font-medium text-black border-4 border-black">Error: Document metadata is missing.</div>;

  const data = docSnapshot.data;
  const workspace = data.workspace || liveCompany;
  const items = data.items || [];
  
  const customer = data.customer || {
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const rawSubtotal = Number(data.subtotal || data.amount || 0);
  const applyVat = data.applyVat || false;
  const vatAmount = Number(data.vatAmount || data.vat || (applyVat ? rawSubtotal * 0.16 : 0));
  const todayTotal = Number(data.total || (rawSubtotal + vatAmount));
  
  const amountPaidToday = data.amountPaid !== undefined ? Number(data.amountPaid) : todayTotal;
  const balanceToday = Math.max(0, todayTotal - amountPaidToday);
  const previousBalance = Number(data.previousBalance || 0);
  const totalAccountBalance = balanceToday + previousBalance;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 8).toUpperCase();

  const primaryBlue = "#1e3a8a";
  const primaryGreen = "#10b981";

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
            <>
              <header className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-6 w-1/3">
                    {workspace?.logoUrl ? (
                        <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-medium border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center text-center w-1/3 pt-4">
                      <h1 className="text-[24px] font-bold uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                      <p className="font-medium text-[11px] uppercase tracking-wide mt-1" style={{ color: primaryGreen }}>Official Payment Receipt</p>
                  </div>
                  <div className="text-right w-1/3 space-y-0.5">
                      <p className="font-bold uppercase text-[11px]">HEAD OFFICE</p>
                      <p className="text-[9px] font-normal leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                      <p className="text-[9px] font-normal">Tel: {workspace?.phone || '+254 701 694 469'}</p>
                      <p className="text-[9px] font-normal">Email: {workspace?.email || 'office@company.com'}</p>
                      <div className="pt-3">
                          <p className="text-[12px] font-bold uppercase" style={{ color: primaryBlue }}>RECEIPT NO: {receiptNo}</p>
                          <p className="text-[10px] font-normal text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                      </div>
                  </div>
              </header>
              <div className="h-0.5 w-full bg-black mb-10" />
            </>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-8 mb-10">
                <div className="p-6 rounded-[20px] space-y-2 bg-[#F4F7FF]">
                    <h3 className="font-medium text-blue-600 text-[12px] uppercase">Payment From</h3>
                    <p className="font-medium uppercase text-[13px]">{customer.name}</p>
                    <p className="font-normal text-black/60 text-[11px]">{customer.address || 'Nairobi, Kenya'}</p>
                </div>
                <div className="p-6 rounded-[20px] space-y-3 bg-[#FFFBF0]">
                    <h3 className="font-medium text-orange-800 uppercase text-[11px] tracking-widest">ACCOUNT OVERVIEW</h3>
                    <div className="flex justify-between items-center text-[11px] border-b border-orange-100 pb-2">
                        <p className="font-normal opacity-60">Balance Brought Forward:</p>
                        <p className="font-medium">KES {formatCurrency(previousBalance)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <p className="font-medium text-orange-900 uppercase text-[11px]">TOTAL STATEMENT DUE:</p>
                        <p className="font-bold text-orange-900 tracking-tighter text-[18px]">KES {formatCurrency(totalAccountBalance)}</p>
                    </div>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[10px] font-medium uppercase opacity-40 tracking-widest">Receipt Continued: {receiptNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-bold text-[10px] uppercase">ITEM</th>
                        <th className="p-3 text-right font-bold text-[10px] w-20 uppercase">TAX</th>
                        <th className="p-3 text-right font-bold text-[10px] w-20 uppercase">QTY</th>
                        <th className="p-3 text-right font-bold text-[10px] w-32 uppercase">UNIT RATE</th>
                        <th className="p-3 text-right font-bold text-[10px] w-36 uppercase">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="p-3 flex gap-3">
                                    <span className="font-normal opacity-30 text-[10px]">{pageIdx * ITEMS_PER_PAGE_OTHER + idx + 1}.</span>
                                    <div>
                                      <p className="font-medium uppercase leading-tight text-[11px]">{item.name || item.description}</p>
                                      {item.serialNumber && <p className="text-[9px] text-gray-500 font-mono mt-1 uppercase opacity-60">S/N: {item.serialNumber}</p>}
                                    </div>
                                </td>
                                <td className="p-3 text-right font-normal text-[10px]">{applyVat ? '16%' : '0%'}</td>
                                <td className="p-3 text-right font-medium text-[10px]">{qty}</td>
                                <td className="p-3 text-right tabular-nums font-normal text-[10px]">KES {formatCurrency(unitRate)}</td>
                                <td className="p-3 text-right tabular-nums font-medium text-[11px]">KES {formatCurrency(rowTotal)}</td>
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
                    <div className="flex-1 pt-4">
                        <p className="font-medium uppercase text-[11px] leading-relaxed">
                            PAID IN WORDS: <span className="opacity-80 italic">{numberToWords(amountPaidToday)}</span>
                        </p>
                    </div>
                    <div className="w-[350px] space-y-1.5">
                        <div className="flex justify-between items-center py-1 text-[11px]">
                            <span className="font-normal opacity-60 uppercase">TODAY'S SUBTOTAL</span>
                            <span className="font-medium">{formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="h-px w-full bg-gray-200" />
                        <div className="flex justify-between items-center py-1 text-[12px]">
                            <span className="font-medium uppercase">RECEIPT TOTAL</span>
                            <span className="font-medium">KES {formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 my-1">
                            <span className="font-bold uppercase text-emerald-800 text-[10px]">AMOUNT PAID TODAY</span>
                            <span className="font-bold text-emerald-700 tracking-tighter text-[16px]">KES {formatCurrency(amountPaidToday)}</span>
                        </div>
                        <div className="h-0.5 w-full bg-black" />
                        <div className="flex justify-between items-center py-4 mt-2">
                            <span className="text-[13px] font-bold uppercase text-blue-900">TOTAL ACCOUNT DEBT</span>
                            <span className="font-bold text-blue-900 tracking-tighter text-[22px]">KES {formatCurrency(totalAccountBalance)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             <div className="flex justify-between items-end">
                <div className="font-normal text-gray-500 space-y-0.5 text-[9px]">
                    <p className="uppercase">{workspace?.name}</p>
                    <p className="opacity-60">Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className="font-medium bg-gray-100 px-3 py-1 rounded text-[10px]">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
