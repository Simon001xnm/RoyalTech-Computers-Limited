'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";
import { useMemo } from 'react';

/**
 * @fileOverview High-Fidelity Detailed Dynamic Paginated Receipt
 * Recalibrated for large branding and font sizes.
 */

// CALIBRATED HEIGHT CONSTANTS (Pixels)
const PAGE_HEIGHT = 1123;
const HEADER_P1 = 420;      
const HEADER_PX = 150;      
const TABLE_HEADER = 50;
const FOOTER_RESERVE = 120;  
const ROW_BASE = 44;        
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

  if (!docSnapshot?.data) return <div className="p-10 text-center font-bold text-black border-4 border-black uppercase">ERROR: DOCUMENT_DATA_MISSING</div>;

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
        const itemHeight = ROW_BASE + (lines > 1 ? (lines - 1) * 18 : 0);
        
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
    <div className="flex flex-col items-center gap-0 bg-slate-200 p-0 no-scrollbar">
      {pages.map((pageItems, pageIdx) => (
        <div 
            key={pageIdx} 
            className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
        >
          {pageIdx === 0 ? (
            <header className="flex justify-between items-start mb-6 pb-6 border-b">
                <div className="flex items-center gap-6 flex-1 overflow-hidden">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain shrink-0" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-24 w-24 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300 shrink-0">LOGO</div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h1 className="text-[38px] font-black uppercase tracking-tighter leading-[0.9] text-black whitespace-nowrap" style={{ color: primaryBlue }}>
                      {workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}
                    </h1>
                    <p className="font-black text-[11px] mt-1 uppercase tracking-widest text-black" style={{ color: successGreen }}>Official Payment Receipt</p>
                  </div>
                </div>
                
                <div className="text-right ml-4 space-y-1 shrink-0">
                    <p className="text-[10px] font-bold leading-tight uppercase text-black">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[10px] font-bold text-black">Tel: {workspace?.phone || 'N/A'}</p>
                    <div className="pt-2">
                        <p className="text-[12px] font-black uppercase" style={{ color: primaryBlue }}>RECEIPT NO: #{receiptNo}</p>
                        <p className="text-[10px] font-bold text-black opacity-50 uppercase">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          ) : (
            <div className="mb-6 border-b pb-4 flex justify-between items-end">
                <p className="text-[12px] font-black uppercase opacity-40 tracking-widest text-black">Receipt Continued: #{receiptNo}</p>
                <p className="text-[11px] font-black text-black">Page {pageIdx + 1}</p>
            </div>
          )}

          {pageIdx === 0 && (
            <div className="grid grid-cols-[60%_40%] gap-0 mb-6 border-b pb-6">
                <div className="pr-8 space-y-5">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase text-blue-800 tracking-widest">Billing From</p>
                            <p className="text-[11px] font-black uppercase leading-tight text-black">{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
                            <p className="text-[10px] font-medium text-black opacity-60 uppercase leading-tight">{workspace?.address || 'Kenya'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase text-blue-800 tracking-widest">Billing To</p>
                            <p className="text-[11px] font-black uppercase leading-tight text-black">{customer.name}</p>
                            <p className="text-[10px] font-medium text-black opacity-60 uppercase leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
                            <p className="text-[10px] font-bold text-black">{customer.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-slate-50 border rounded-lg border-black/5">
                          <p className="text-[8px] font-black uppercase text-blue-900/60 tracking-widest mb-1.5">Bank Payment</p>
                          <p className="text-[10px] font-black text-black leading-tight uppercase">Bank DTB; NAME-MATESH TECHNOLOGIES LIMITED</p>
                          <p className="text-[11px] font-black uppercase text-black">ACC NO: 0084976001</p>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-lg border-black/5">
                          <p className="text-[8px] font-black uppercase text-blue-900/60 tracking-widest mb-1.5">Lipan Na M-Pesa</p>
                          <p className="text-[10px] font-black text-black">PAYBILL NO: 516600</p>
                          <p className="text-[11px] font-black text-black">ACC NO: 5084975001</p>
                      </div>
                    </div>
                </div>
                <div className="bg-green-50/40 p-5 flex flex-col justify-center border-l border-black/5 rounded-r-xl">
                    <p className="text-[11px] font-black text-green-800 uppercase tracking-widest mb-2">Amount Paid Today</p>
                    <div className="pb-3">
                        <p className="text-[26px] font-black tracking-tighter leading-none" style={{ color: successGreen }}>KES {formatCurrency(amountPaidToday)}</p>
                    </div>
                    <div className="mt-2 pt-3 border-t border-green-200">
                        <p className="text-[10px] font-bold uppercase tracking-tight text-black">Term: <span className="font-black">DUE ON RECEIPT</span></p>
                    </div>
                </div>
            </div>
          )}

          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-black text-[10px] uppercase w-12 text-center">Ref</th>
                        <th className="p-3 font-black text-[10px] uppercase">Description</th>
                        <th className="p-3 text-center font-black text-[10px] uppercase w-20">Qty</th>
                        <th className="p-3 text-right font-black text-[10px] uppercase w-36">Rate</th>
                        <th className="p-3 text-right font-black text-[10px] uppercase w-40">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitPrice = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitPrice * qty;
                        
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;

                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-12">
                                <td className="p-3 text-[11px] font-black text-center text-black opacity-20">
                                    {itemNumber.toString().padStart(2, '0')}
                                </td>
                                <td className="p-3">
                                    <p className="font-black uppercase leading-tight text-[12px] tracking-tight text-black">{item.name || item.description}</p>
                                    {item.serialNumber && (
                                        <p className="text-[9px] text-gray-400 font-mono mt-1 uppercase tracking-tighter">S/N: {item.serialNumber}</p>
                                    )}
                                </td>
                                <td className="p-3 text-center font-black text-[11px] text-black">{qty}</td>
                                <td className="p-3 text-right tabular-nums font-bold text-[11px] text-black opacity-70">{formatCurrency(unitPrice)}</td>
                                <td className="p-3 text-right tabular-nums font-black text-[12px] text-black">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             {pageIdx === pages.length - 1 && (
                <div className="mb-6 pt-4 border-t-2 border-black/5">
                    <div className="flex justify-between items-start gap-12">
                        <div className="flex-1 space-y-4">
                            <div className="p-4 bg-slate-50 border rounded-xl">
                                <p className="text-[9px] font-black uppercase text-blue-900/40 tracking-widest mb-1.5">Receipt Terms</p>
                                <p className="font-bold text-[10px] leading-relaxed italic text-black">
                                    This receipt confirms payment received for the transaction stated above. Please retain it as proof of payment. Any discrepancies should be reported to the business promptly.
                                </p>
                            </div>
                            <p className="font-black uppercase text-[11px] leading-relaxed text-black max-w-[380px]">
                                Paid in words: <span className="font-bold underline underline-offset-4">{numberToWords(amountPaidToday)}</span>
                            </p>
                        </div>
                        
                        <div className="w-[350px] space-y-0">
                            <div className="flex justify-between items-center p-3 bg-slate-50/50 border-b border-white">
                                <span className="font-bold text-black opacity-50 uppercase text-[10px]">Transaction Subtotal</span>
                                <span className="font-black text-[12px] text-black">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#f0fdf4] border-b border-white">
                                <span className="font-bold text-green-800/60 uppercase text-[10px]">Amount Paid Today</span>
                                <span className="font-black text-green-800 text-[12px]">{formatCurrency(amountPaidToday)}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-blue-900 text-white shadow-xl mt-1 rounded-sm">
                                <span className="text-[13px] font-black uppercase tracking-tighter">Total Account Debt</span>
                                <span className="font-black tracking-tight text-[22px]">KES {formatCurrency(totalAccountDebt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {pageIdx === pages.length - 1 && (
                <div className="text-center space-y-1.5 pb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black">THIS DOCUMENT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[12px] font-black uppercase tracking-widest" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</p>
                    <p className="text-[11px] font-black text-black">
                        Phone: {workspace?.phone || '+254701694469'}. Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                    </p>
                </div>
             )}
             
             <div className="flex justify-between items-center border-t pt-3">
                <div className="text-[10px] font-black uppercase tracking-normal text-black">
                   GENERATED: {format(new Date(), 'dd/MM/yy HH:mm')}
                </div>
                <div className="font-black text-[10px] text-black uppercase tracking-widest">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
