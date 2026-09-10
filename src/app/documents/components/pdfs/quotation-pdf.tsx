'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";
import { useMemo } from 'react';

/**
 * @fileOverview High-Fidelity Dynamic Paginated Quotation
 * Re-engineered to match the clean, unboxed Invoice aesthetic.
 */

// CALIBRATED HEIGHT CONSTANTS (Pixels)
const PAGE_HEIGHT = 1123;   
const HEADER_P1 = 440;      // Header + Quote/Payment Info
const HEADER_PX = 100;      // "Continued" header height
const TABLE_HEADER = 50;    
const FOOTER_RESERVE = 160;  
const ROW_BASE = 55;        
const SUMMARY_BLOCK = 280;   
const CHARS_PER_LINE = 55;   

export function QuotationPdf({ document: docSnapshot }: { document: AppDocument }) {
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
    name: data.customerName || 'VALUED CLIENT',
    phone: '',
    email: '',
    address: 'Nairobi, Kenya'
  };

  const subtotal = Number(data.subtotal || 0);
  const total = Number(data.total || subtotal);

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const quoteNo = (docSnapshot.title || '').includes('#') 
    ? docSnapshot.title.split('#').pop() 
    : (docSnapshot.id || 'TEMP').slice(0, 5).toUpperCase();

  const primaryBlue = "#1e3a8a";

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
    
    // Safety check: ensure 100% item delivery
    const totalItemsCalculated = calculatedPages.reduce((acc, p) => acc + p.length, 0);
    if (totalItemsCalculated !== items.length) {
        console.warn(`PAGINATION_VALIDATION_ERROR: Rendered ${totalItemsCalculated}/${items.length} items.`);
    }

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
            <header className="flex justify-between items-start mb-6 pb-2 border-b">
                <div className="flex items-center gap-4 w-[50%]">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-14 w-14 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300 uppercase">LOGO</div>
                  )}
                  <div>
                    <h1 className="text-[22px] font-black uppercase tracking-tighter leading-tight" style={{ color: primaryBlue }}>
                      {workspace?.name || 'MATESH TECHNOLOGIES'}
                    </h1>
                  </div>
                </div>
                
                <div className="text-right w-[45%] space-y-0.5">
                    <p className="text-[11px] font-black uppercase" style={{ color: primaryBlue }}>QUOTE: #{quoteNo}</p>
                    <p className="text-[8px] font-bold text-black opacity-50 uppercase">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    <div className="pt-2 text-[8px] font-bold leading-tight uppercase text-black">
                        <p>{workspace?.address || 'Nairobi, Kenya'}</p>
                        <p>Tel: {workspace?.phone || 'N/A'}</p>
                        <p className="lowercase opacity-70">Email: {workspace?.email || 'N/A'}</p>
                    </div>
                </div>
            </header>
          ) : (
            <div className="mb-4 border-b pb-2 flex justify-between items-end">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest text-black">Quote Continued: #{quoteNo}</p>
                <p className="text-[9px] font-black text-black">Page {pageIdx + 1}</p>
            </div>
          )}

          {pageIdx === 0 && (
            <>
              <div className="grid grid-cols-[60%_40%] gap-4 mb-6">
                  <div className="space-y-4">
                      <div className="p-3.5 bg-slate-50 border rounded-xl border-black/5 space-y-1">
                          <p className="text-[7px] font-black uppercase text-blue-900/60 tracking-widest">Client Name</p>
                          <p className="text-[12px] font-black uppercase tracking-tight text-black">{customer.name}</p>
                          <p className="text-[8px] font-medium text-black opacity-50 uppercase">{customer.address || 'Kenya'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 border rounded-md border-black/5">
                            <p className="text-[7px] font-black uppercase text-blue-900/60 tracking-widest mb-1">Bank Payment</p>
                            <p className="text-[9px] font-black text-black">Bank DTB; NAME-MATESH TECHNOLOGIES</p>
                            <p className="text-[10px] font-black uppercase text-black">ACC NO: 0084976001</p>
                        </div>
                        <div className="p-3 bg-slate-50 border rounded-md border-black/5">
                            <p className="text-[7px] font-black uppercase text-blue-900/60 tracking-widest mb-1">Lipan Na M-Pesa</p>
                            <p className="text-[9px] font-black text-black">PAYBILL NO: 516600</p>
                            <p className="text-[10px] font-black text-black">ACC NO: 5084975001</p>
                        </div>
                      </div>
                  </div>
                  <div className="bg-blue-50/40 p-6 flex flex-col justify-center border border-black/5 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Total Quote Value</p>
                      <div className="pb-4">
                          <p className="text-[26px] font-black tracking-tighter leading-none" style={{ color: primaryBlue }}>KES {formatCurrency(total)}</p>
                      </div>
                      <div className="mt-2 pt-4 border-t border-blue-200">
                         <p className="text-[9px] font-bold uppercase tracking-tight text-black">Validity: <span className="font-black">30 DAYS</span></p>
                      </div>
                  </div>
              </div>
            </>
          )}

          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-2.5 font-black text-[8px] uppercase w-12 text-center rounded-l-sm">Ref</th>
                        <th className="p-2.5 font-black text-[8px] uppercase">Description & Specifications</th>
                        <th className="p-2.5 text-center font-black text-[8px] uppercase w-16">Qty</th>
                        <th className="p-2.5 text-right font-black text-[8px] uppercase w-28">Unit Price</th>
                        <th className="p-2.5 text-right font-black text-[8px] uppercase w-32 rounded-r-sm">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitPrice = Number(item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitPrice * qty;
                        
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;

                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 h-12">
                                <td className="p-2.5 text-[9px] font-black text-center text-black opacity-20">
                                    {itemNumber.toString().padStart(2, '0')}
                                </td>
                                <td className="p-2.5">
                                    <p className="font-black uppercase leading-tight text-[10px] tracking-tight text-black">{item.name || item.description}</p>
                                </td>
                                <td className="p-2.5 text-center font-black text-[9px] text-black">{qty}</td>
                                <td className="p-2.5 text-right tabular-nums font-bold text-[9px] text-black opacity-70">{formatCurrency(unitPrice)}</td>
                                <td className="p-2.5 text-right tabular-nums font-black text-[10px] text-black">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          <footer className="mt-auto pt-4 border-t border-gray-100 bg-white">
             {pageIdx === pages.length - 1 && (
                <div className="mb-6 pt-2 border-t-2 border-black/5">
                    <div className="flex justify-between items-start gap-8">
                        <div className="flex-1 space-y-3">
                            <div className="p-4 bg-slate-50 border rounded-lg">
                                <p className="text-[7px] font-black uppercase text-blue-900/40 tracking-widest mb-1">Amount in Words</p>
                                <p className="font-black uppercase text-[10px] leading-relaxed italic text-blue-900">
                                    {numberToWords(total)}
                                </p>
                            </div>
                            <div className="text-[8px] font-medium text-black italic max-w-[280px]">
                                * This quotation is valid for a period of 30 days from the date of issue.
                            </div>
                        </div>
                        
                        <div className="w-[300px] space-y-0">
                            <div className="flex justify-between items-center p-2.5 bg-slate-50/50 border-b border-white">
                                <span className="font-bold text-black opacity-40 uppercase text-[8px]">Quote Subtotal</span>
                                <span className="font-black text-[10px] text-black">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-blue-900 text-white shadow-xl mt-1 rounded-sm">
                                <span className="text-[11px] font-black uppercase tracking-tighter">Grand Total</span>
                                <span className="font-black tracking-tight text-[20px]">KES {formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {pageIdx === pages.length - 1 && (
                <div className="text-center space-y-1 pb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES'}</p>
                    <p className="text-[9px] font-black text-black">
                        Phone: {workspace?.phone || '+254701694469'}. Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                    </p>
                </div>
             )}
             
             <div className="flex justify-between items-center border-t pt-2">
                <div className="text-[8px] font-black uppercase tracking-normal text-black">
                   GENERATED: {format(new Date(), 'dd/MM/yy HH:mm')}
                </div>
                <div className="font-black text-[9px] text-black uppercase tracking-widest">
                    PAGE {pageIdx + 1} OF {pages.length}
                </div>
             </div>
          </footer>
        </div>
      ))}
    </div>
  );
}
