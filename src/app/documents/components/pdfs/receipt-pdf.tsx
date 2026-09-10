'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";
import { useMemo } from 'react';

/**
 * @fileOverview High-Fidelity Dynamic Paginated Receipt
 * Calibrated for zero clipping and absolute sequential numbering.
 */

// CONSERVATIVE HEIGHT CONSTANTS (Pixels)
const PAGE_HEIGHT = 1123;
const HEADER_P1 = 400;      // Branding + Payments
const HEADER_PX = 100;      // "Continued" header
const TABLE_HEADER = 50;
const FOOTER_RESERVE = 160;  
const ROW_BASE = 55;        
const SUMMARY_BLOCK = 280;   
const CHARS_PER_LINE = 50;

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

  const pages = useMemo(() => {
    const calculatedPages: any[][] = [];
    let currentPageItems: any[] = [];
    let currentHeightUsed = HEADER_P1 + TABLE_HEADER + FOOTER_RESERVE;

    items.forEach((item: any, idx: number) => {
        const isLastItem = idx === items.length - 1;
        const descText = (item.name || item.description || "");
        const lines = Math.max(1, Math.ceil(descText.length / CHARS_PER_LINE));
        const itemHeight = ROW_BASE + (lines > 1 ? (lines - 1) * 15 : 0);
        
        const spaceNeeded = itemHeight + (isLastItem ? SUMMARY_BLOCK : 0);

        if (currentHeightUsed + spaceNeeded > PAGE_HEIGHT && currentPageItems.length > 0) {
            calculatedPages.push(currentPageItems);
            currentPageItems = [item];
            currentHeightUsed = HEADER_PX + TABLE_HEADER + FOOTER_RESERVE + itemHeight + (isLastItem ? SUMMARY_BLOCK : 0);
        } else {
            currentPageItems.push(item);
            currentHeightUsed += itemHeight;
        }
    });

    if (currentPageItems.length > 0) calculatedPages.push(currentPageItems);
    return calculatedPages;
  }, [items]);

  return (
    <div className="flex flex-col items-center gap-6 bg-slate-100 p-8 no-scrollbar">
      {pages.map((pageItems, pageIdx) => (
        <div 
            key={pageIdx} 
            className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
        >
          {pageIdx === 0 ? (
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
                    <p className="font-black text-[10px] mt-0.5 uppercase tracking-widest text-black" style={{ color: successGreen }}>Official Payment Receipt</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="font-black uppercase text-9px text-black">Contact Details</p>
                    <p className="text-[8px] font-bold leading-tight uppercase text-black max-w-[200px]">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[8px] font-bold text-black">Tel: {workspace?.phone || '+254701694469'}</p>
                    <p className="text-[8px] font-bold lowercase text-black opacity-60">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
                    <div className="pt-2">
                        <p className="text-[11px] font-black uppercase" style={{ color: primaryBlue }}>Receipt: #{receiptNo}</p>
                        <p className="text-[8px] font-bold text-black opacity-50 uppercase">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          ) : (
             <div className="mb-4 border-b pb-4 flex justify-between items-end">
                <p className="text-[8px] font-black uppercase opacity-40 tracking-widest text-black">Receipt Continued: #{receiptNo}</p>
                <p className="text-[8px] font-black text-black">Page {pageIdx + 1}</p>
            </div>
          )}

          {pageIdx === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-[#f0f7ff] rounded-xl border border-blue-100/50 space-y-1">
                      <p className="text-[8px] font-black uppercase text-blue-800/60 tracking-widest">Client Name</p>
                      <p className="text-[12px] font-black uppercase tracking-tight text-black">{customer.name}</p>
                      <p className="text-[9px] font-medium text-black opacity-50 uppercase leading-none">{customer.address || 'Kenya'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-50 border rounded-lg border-black/5">
                          <p className="text-[6px] font-black uppercase text-black opacity-40 tracking-widest mb-1">Bank Settlement</p>
                          <p className="text-[9px] font-black text-black leading-tight">Bank DTB; MATESH TECHNOLOGIES</p>
                          <p className="text-[9px] font-black text-black uppercase">ACC: 0084976001</p>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-lg border-black/5">
                          <p className="text-[6px] font-black uppercase text-black opacity-40 tracking-widest mb-1">Mobile Money</p>
                          <p className="text-[9px] font-black text-black leading-tight">PAYBILL: 516600</p>
                          <p className="text-[9px] font-black text-black uppercase">ACC: 5084975001</p>
                      </div>
                  </div>
              </div>
            </>
          )}

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
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;

                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-11">
                                <td className="p-2.5">
                                    <p className="font-bold uppercase leading-tight text-[10px] text-black">
                                        {itemNumber.toString().padStart(2, '0')}. {item.name || item.description}
                                    </p>
                                </td>
                                <td className="p-2.5 text-center font-bold text-[9px] text-black opacity-40">{data.applyVat ? '16%' : '0%'}</td>
                                <td className="p-2.5 text-center font-black text-[10px] text-black">{qty}</td>
                                <td className="p-2.5 text-right tabular-nums font-bold text-[9px] text-black">KES {formatCurrency(unitRate)}</td>
                                <td className="p-2.5 text-right tabular-nums font-black text-[10px] text-black">KES {formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             {pageIdx === pages.length - 1 && (
                <div className="mb-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-8">
                        <div className="flex-1 pt-2">
                            <p className="font-black uppercase text-[10px] leading-relaxed text-black max-w-[350px]">
                                Paid in words: <span className="font-bold underline underline-offset-4">{numberToWords(amountPaidToday)}</span>
                            </p>
                        </div>
                        <div className="w-[300px] space-y-1">
                            <div className="flex justify-between items-center px-2 py-1 border-t border-black/10">
                                <span className="font-bold text-black opacity-40 uppercase text-[9px]">Today's Subtotal</span>
                                <span className="font-black text-[10px] text-black">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2 py-1">
                                <span className="font-black uppercase text-[9px] text-black opacity-80">Receipt Total</span>
                                <span className="font-black text-[10px] text-black">KES {formatCurrency(todayTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-[#f0fdf4] border-l-4 border-l-[#15803d] my-2 shadow-sm rounded-r-md">
                                <span className="text-[10px] font-black uppercase text-green-900">Amount Paid Today</span>
                                <span className="font-black tracking-tight text-[13px] text-green-900">KES {formatCurrency(amountPaidToday)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2 py-6 border-t-2 border-black mt-2">
                                <span className="text-[12px] font-black uppercase tracking-tighter text-black">Total Account Debt</span>
                                <span className="font-black tracking-tighter text-[24px] leading-none" style={{ color: primaryBlue }}>KES {formatCurrency(totalAccountDebt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {pageIdx === pages.length - 1 && (
                <div className="text-center space-y-1 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-tight text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES'}</p>
                    <p className="text-[9px] font-black text-black">
                        Phone: {workspace?.phone || '+254701694469'}. Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                    </p>
                </div>
             )}

             <div className="flex justify-between items-center mt-2 border-t pt-2">
                <div className="text-[8px] font-black uppercase tracking-normal text-black">
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
