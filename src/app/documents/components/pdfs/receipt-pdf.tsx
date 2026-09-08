'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

const ITEMS_PER_PAGE_FIRST = 8;
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

  const companyName = workspace?.name || 'THE BUSINESS';
  const primaryIndigo = "#1d4ed8";
  const secondaryIndigo = "#f8fafc";

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
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>{companyName}</h1>
                    <p className="font-bold text-[11px] opacity-70 text-green-700 uppercase tracking-widest">Official Payment Receipt</p>
                </div>
                </div>
                <div className="text-right space-y-1.5">
                    <p className="font-black text-[12px] uppercase">Head Office</p>
                    <p className="text-[10px] font-medium max-w-[220px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[10px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <p className="text-[10px] font-bold">Email: {workspace?.email || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-[14px] font-black uppercase text-blue-800">Receipt No: {receiptNo}</p>
                        <p className="text-[11px] font-bold">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          )}

          {pageIdx === 0 && (
            <section className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-6 rounded-xl space-y-2 bg-slate-50 border-2 border-slate-100 shadow-sm">
                    <h3 className="font-black text-[12px] mb-2 uppercase tracking-tight" style={{ color: primaryIndigo }}>Payment From</h3>
                    <p className="font-black text-[14px] uppercase">{customer.name}</p>
                    <p className="text-[11px] font-medium text-black/70 leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[11px] font-black text-black/70">{customer.phone}</p>
                </div>
                <div className="p-6 rounded-xl space-y-2 border-2 border-orange-100 bg-orange-50/50 shadow-sm">
                    <h3 className="font-black text-[12px] mb-2 text-orange-800 uppercase tracking-tight">Account Overview</h3>
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                        <p className="text-[11px] font-bold opacity-60 uppercase">Brought Forward:</p>
                        <p className="font-black text-[13px]">KES {formatCurrency(previousBalance)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                        <p className="text-[12px] font-black text-orange-900 uppercase">Statement Total:</p>
                        <p className="font-black text-2xl text-orange-900 tracking-tighter">KES {formatCurrency(totalAccountBalance)}</p>
                    </div>
                </div>
            </section>
          )}

          {pageIdx > 0 && (
            <div className="mb-6">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Receipt Continued: {receiptNo} - Page {pageIdx + 1}</p>
            </div>
          )}

          <section className="flex-grow">
            <table className="w-full border-collapse border-2 border-black">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className="p-4 font-black text-[11px] border-r border-blue-900 uppercase">Item</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">Tax</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-20 uppercase">Qty</th>
                        <th className="p-4 text-right font-black text-[11px] border-r border-blue-900 w-32 uppercase">Unit Rate</th>
                        <th className="p-4 text-right font-black text-[11px] w-36 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const globalIdx = (pageIdx === 0 ? 0 : ITEMS_PER_PAGE_FIRST + (pageIdx - 1) * ITEMS_PER_PAGE_OTHER) + idx;
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="p-4 border-r border-gray-100">
                                    <div className="flex gap-3">
                                        <span className="opacity-40 text-[11px] font-black">{globalIdx + 1}.</span>
                                        <div>
                                            <p className="font-black text-[13px] uppercase leading-tight">{item.name || item.description}</p>
                                            {item.serialNumber && <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">S/N: {item.serialNumber}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right text-[11px] font-bold border-r border-gray-100">{applyVat ? '16%' : '0%'}</td>
                                <td className="p-4 text-right text-[11px] font-black border-r border-gray-100">{qty}</td>
                                <td className="p-4 text-right text-[11px] font-medium border-r border-gray-100">{formatCurrency(unitRate)}</td>
                                <td className="p-4 text-right text-[13px] font-black">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pageIdx === pages.length - 1 && (
                <div className="flex justify-between items-start mt-8">
                    <div className="max-w-[380px]">
                        <p className="text-[11px] font-black uppercase text-black leading-relaxed border-l-4 border-black pl-4">
                            Paid in words: {numberToWords(amountPaidToday)}
                        </p>
                    </div>
                    <div className="w-[350px] space-y-2">
                        <div className="flex justify-between items-center p-2 border-b border-black/10">
                            <span className="font-bold opacity-60 uppercase text-[10px]">Today's Subtotal</span>
                            <span className="font-black text-[13px]">{formatCurrency(rawSubtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-black/10">
                            <span className="font-black uppercase text-[11px]">Gross Receipt Total</span>
                            <span className="font-black text-[14px]">KES {formatCurrency(todayTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg shadow-inner">
                            <span className="font-black uppercase text-emerald-800 text-[11px]">Amount Settled</span>
                            <span className="font-black text-2xl text-emerald-700 tracking-tighter">KES {formatCurrency(amountPaidToday)}</span>
                        </div>
                        <div className="pt-4 border-t-4 border-black flex justify-between items-center px-2">
                            <span className="text-[11px] font-black uppercase text-red-700">Net Account Debt</span>
                            <span className="text-2xl font-black text-red-800 tracking-tighter">KES {formatCurrency(totalAccountBalance)}</span>
                        </div>
                    </div>
                </div>
            )}
          </section>

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

