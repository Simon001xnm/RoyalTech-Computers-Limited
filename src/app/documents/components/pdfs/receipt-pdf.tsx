'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 10;
const ITEMS_PER_PAGE_OTHER = 18;

export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
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

  const primaryIndigo = "#1d4ed8";

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
            <header className="flex justify-between items-start mb-8 pb-8 border-b-4 border-black">
                <div className="flex items-center gap-8">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                    <p className="font-black text-green-700 uppercase tracking-widest opacity-70 text-sm">Official Payment Receipt</p>
                </div>
                </div>
                <div className="text-right space-y-1">
                    <p className="font-black uppercase text-xs">Head Office</p>
                    <p className="text-[10px] font-medium max-w-[220px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-lg font-black uppercase text-blue-800">Receipt No: {receiptNo}</p>
                        <p className="text-xs font-bold text-muted-foreground">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-4 rounded-xl space-y-1 bg-slate-50 border-2 border-slate-100 shadow-sm">
                    <h3 className="font-black uppercase text-xs tracking-tight text-blue-900">Payment From</h3>
                    <p className="font-black uppercase text-sm">{customer.name}</p>
                    <p className="font-medium text-black/70 text-xs">{customer.address || 'Nairobi, Kenya'}</p>
                </div>
                <div className="p-4 rounded-xl space-y-1 border-2 border-orange-100 bg-orange-50/50 shadow-sm">
                    <h3 className="font-black text-orange-800 uppercase text-xs tracking-tight">Account Overview</h3>
                    <div className="flex justify-between items-center text-xs">
                        <p className="font-bold opacity-60 uppercase text-[9px]">Previous Balance:</p>
                        <p className="font-black">KES {formatCurrency(previousBalance)}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-orange-200 pt-1 text-xs">
                        <p className="font-black text-orange-900 uppercase">Account Total:</p>
                        <p className="font-black text-orange-900 tracking-tighter text-lg">KES {formatCurrency(totalAccountBalance)}</p>
                    </div>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Receipt Continued: {receiptNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <div className="flex-grow overflow-hidden border-2 border-black rounded-sm flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className="p-3 font-black text-xs border-r border-blue-900 uppercase">Description</th>
                        <th className="p-3 text-right font-black text-xs border-r border-blue-900 w-20 uppercase">Tax</th>
                        <th className="p-3 text-right font-black text-xs border-r border-blue-900 w-20 uppercase">Qty</th>
                        <th className="p-3 text-right font-black text-xs w-32 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="p-3 border-r border-gray-100">
                                    <p className="font-black uppercase leading-tight text-xs">{item.name || item.description}</p>
                                    {item.serialNumber && <p className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className="p-3 text-right font-bold border-r border-gray-100 text-xs">{applyVat ? '16%' : '0%'}</td>
                                <td className="p-3 text-right font-black border-r border-gray-100 text-xs">{qty}</td>
                                <td className="p-3 text-right tabular-nums font-black text-xs">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* TOTALS (Last Page) */}
          {pageIdx === pages.length - 1 && (
            <div className="mt-6 flex flex-col gap-6">
                <div className="flex justify-end">
                    <div className="w-[350px] space-y-1">
                        <div className="flex justify-between p-1.5 border-b border-gray-100">
                            <span className="font-bold opacity-60 uppercase text-[9px]">Receipt Gross</span>
                            <span className="font-black text-xs">{formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-emerald-50 rounded-lg shadow-inner mt-2 border-2 border-emerald-100">
                            <span className="font-black uppercase text-emerald-800 text-xs">Amount Settled</span>
                            <span className="font-black text-emerald-700 tracking-tighter text-3xl">KES {formatCurrency(amountPaidToday)}</span>
                        </div>
                        <div className="flex justify-between p-4 border-t-4 border-black bg-red-50 mt-2">
                            <span className="text-xs font-black uppercase text-red-700">Remaining Debt</span>
                            <span className="font-black text-red-800 tracking-tighter text-2xl">KES {formatCurrency(totalAccountBalance)}</span>
                        </div>
                    </div>
                </div>
                
                <p className="font-black uppercase italic opacity-60 text-[10px] leading-relaxed border-l-4 border-black pl-4">
                    Settled in words: {numberToWords(amountPaidToday)}
                </p>

                <div className="mt-4 pt-10 border-t border-dashed grid grid-cols-2 gap-20">
                    <div className="space-y-4">
                        <div className="h-10 border-b border-black border-dotted"></div>
                        <p className="text-[10px] font-black uppercase text-center opacity-40">Cashier / Agent</p>
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-[10px] font-black uppercase text-primary">PAID IN FULL</p>
                            <p className="text-[8px] opacity-60 mt-1 uppercase">Cloud Document Sync Valid</p>
                        </div>
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
