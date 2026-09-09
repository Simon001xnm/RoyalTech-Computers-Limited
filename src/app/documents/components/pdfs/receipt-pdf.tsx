'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 12;
const ITEMS_PER_PAGE_OTHER = 22;

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
  const successGreen = "#00c853";
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
            className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
        >
          {/* HEADER (First Page) */}
          {pageIdx === 0 && (
            <header className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-6">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-bold border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-[34px] font-black uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>
                      {workspace?.name || 'MATESH TECHNOLOGIES'}
                    </h1>
                    <p className="font-bold text-[14px] mt-1" style={{ color: successGreen }}>Official Payment Receipt</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="font-black uppercase text-[11px]">HEAD OFFICE</p>
                    <p className="text-[10px] font-bold leading-tight uppercase max-w-[200px]">{workspace?.address || 'GOOD HOPE PLAZA NAIROBI'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || '+254701694469'}</p>
                    <p className="text-[10px] font-bold lowercase">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
                    <div className="pt-3">
                        <p className="text-[13px] font-black uppercase" style={{ color: primaryBlue }}>RECEIPT NO: {receiptNo}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <>
              <div className="h-0.5 w-full bg-black mb-8" />
              
              {/* INFO BOXES */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="p-8 bg-[#f0f7ff] rounded-[24px] border border-blue-50 space-y-3 shadow-sm min-h-[140px]">
                      <p className="text-[12px] font-bold text-blue-600">Payment From</p>
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-black uppercase tracking-tight">{customer.name}</p>
                        <p className="text-[11px] font-medium opacity-60 uppercase">{customer.address || 'Nairobi, Kenya'}</p>
                      </div>
                  </div>
                  <div className="p-8 bg-[#fffbeb] rounded-[24px] border border-amber-50 space-y-4 shadow-sm min-h-[140px]">
                      <p className="text-[12px] font-bold text-amber-800">ACCOUNT OVERVIEW</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                            <span className="text-[11px] font-bold opacity-60">Balance Brought Forward:</span>
                            <span className="text-[12px] font-black uppercase">KES {formatCurrency(previousBalance)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[12px] font-black uppercase text-amber-900">TOTAL STATEMENT DUE:</span>
                            <span className="text-3xl font-black tracking-tighter" style={{ color: warningOrange }}>KES {formatCurrency(previousBalance + todayTotal)}</span>
                        </div>
                      </div>
                  </div>
              </div>
            </>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Receipt Continued: {receiptNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          {/* ITEM TABLE */}
          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-4 font-black text-[11px] uppercase rounded-l-sm">ITEM</th>
                        <th className="p-4 text-center font-black text-[11px] uppercase w-24">TAX</th>
                        <th className="p-4 text-center font-black text-[11px] uppercase w-24">QTY</th>
                        <th className="p-4 text-right font-black text-[11px] uppercase w-40">UNIT RATE</th>
                        <th className="p-4 text-right font-black text-[11px] uppercase w-44 rounded-r-sm">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-14">
                                <td className="p-4">
                                    <p className="font-black uppercase leading-tight text-[12px]">
                                        {pageIdx * ITEMS_PER_PAGE_OTHER + idx + 1}. {item.name || item.description}
                                    </p>
                                </td>
                                <td className="p-4 text-center font-bold text-[11px] opacity-40">{data.applyVat ? '16%' : '0%'}</td>
                                <td className="p-4 text-center font-black text-[12px]">{qty}</td>
                                <td className="p-4 text-right tabular-nums font-bold text-[12px]">KES {formatCurrency(unitRate)}</td>
                                <td className="p-4 text-right tabular-nums font-black text-[12px]">KES {formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* SUMMARY BLOCK (Last Page Only) */}
          {pageIdx === pages.length - 1 && (
            <div className="mt-8 flex flex-col gap-6">
                <div className="flex justify-between items-start gap-12">
                    <div className="flex-1 pt-4">
                        <p className="font-black uppercase text-[11px] leading-relaxed opacity-80 max-w-[400px]">
                            PAID IN WORDS: <span className="font-bold underline underline-offset-4">{numberToWords(amountPaidToday)}</span>
                        </p>
                    </div>
                    <div className="w-[380px] space-y-1">
                        <div className="flex justify-between items-center px-4 py-2 border-t border-black/10">
                            <span className="font-bold opacity-40 uppercase text-[11px]">TODAY'S SUBTOTAL</span>
                            <span className="font-black text-[12px]">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                            <span className="font-black uppercase text-[12px]">RECEIPT TOTAL</span>
                            <span className="font-black text-[12px]">KES {formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-[#f0fdf4] border-l-4 border-l-[#00c853] my-4 shadow-sm">
                            <span className="text-[12px] font-black uppercase text-green-800">AMOUNT PAID TODAY</span>
                            <span className="font-black tracking-tight text-[15px] text-green-800">KES {formatCurrency(amountPaidToday)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-6 border-t-2 border-black mt-2">
                            <span className="text-[15px] font-black uppercase">TOTAL ACCOUNT DEBT</span>
                            <span className="font-black tracking-tighter text-[28px]" style={{ color: primaryBlue }}>KES {formatCurrency(totalAccountDebt)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-auto pt-10 border-t border-gray-100 bg-white">
             <div className="text-center space-y-1.5 pb-4">
                <p className="text-[10px] font-black uppercase tracking-tight opacity-60">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                <p className="text-[11px] font-black uppercase tracking-widest">{workspace?.name || 'Matesh Technologies'}</p>
                <p className="text-[9px] font-bold text-gray-500">
                    Phone: {workspace?.phone || '+254701694469'} • Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                </p>
             </div>
             <div className="flex justify-end mt-4">
                <div className="font-black bg-gray-50 px-4 py-1.5 rounded text-[10px] text-gray-400">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
