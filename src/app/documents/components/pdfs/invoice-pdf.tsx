'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";
import { useMemo } from 'react';

/**
 * @fileOverview High-Fidelity Dynamic Paginated Invoice
 * Updated with specific payment gateways and zero tax-labeling.
 */

// CONSERVATIVE HEIGHT CONSTANTS (Pixels)
const PAGE_HEIGHT = 1123;   // A4 Standard
const HEADER_P1 = 640;      // Branded Header + Payment Info
const HEADER_PX = 120;      // "Continued" header height
const TABLE_HEADER = 50;    // Blue header height
const FOOTER_RESERVE = 180;  // Disclaimer + Signature area padding
const ROW_BASE = 60;        // Single-line row height
const SUMMARY_BLOCK = 320;   // Totals/Sign-off block
const CHARS_PER_LINE = 45;   // Conservative wrap limit

export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
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
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { subtotal = 0, total, previousBalance = 0, vat = 0 } = data;
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

  /**
   * REINFORCED PAGINATION ENGINE
   * Prevents clipping by measuring before rendering.
   */
  const pages = useMemo(() => {
    const calculatedPages: any[][] = [];
    let currentPageItems: any[] = [];
    let currentHeightUsed = HEADER_P1 + TABLE_HEADER + FOOTER_RESERVE;

    items.forEach((item: any, idx: number) => {
        const isLastItem = idx === items.length - 1;
        
        // 1. Estimate Row Height with wrap safety
        const descText = (item.name || item.description || "");
        const lines = Math.max(1, Math.ceil(descText.length / CHARS_PER_LINE));
        const itemHeight = ROW_BASE + (lines > 1 ? (lines - 1) * 18 : 0);

        // 2. Space needed on current page
        const totalsSpace = isLastItem ? SUMMARY_BLOCK : 0;
        const spaceNeeded = itemHeight + totalsSpace;

        // 3. Page Break Logic (Strict)
        if (currentHeightUsed + spaceNeeded > PAGE_HEIGHT && currentPageItems.length > 0) {
            calculatedPages.push(currentPageItems);
            currentPageItems = [item];
            // Reset for next page (Continued header overhead)
            currentHeightUsed = HEADER_PX + TABLE_HEADER + FOOTER_RESERVE + itemHeight + totalsSpace;
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
            className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
        >
          {/* HEADER (First Page Only) */}
          {pageIdx === 0 ? (
            <header className="flex justify-between items-start mb-8 pb-4">
                <div className="flex items-center gap-6 w-[45%]">
                  {workspace?.logoUrl ? (
                      <img src={workspace.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
                  ) : (
                      <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-[26px] font-black uppercase tracking-tighter leading-tight" style={{ color: primaryBlue }}>
                      {workspace?.name || 'OFFICIAL BUSINESS'}
                    </h1>
                  </div>
                </div>
                
                <div className="text-right w-[45%] space-y-1">
                    <p className="font-black uppercase text-[10px] tracking-widest opacity-40">Head Office</p>
                    <p className="text-[9px] font-bold leading-tight uppercase">{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className="text-[9px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
                    <p className="text-[9px] font-bold lowercase opacity-70">Email: {workspace?.email || 'N/A'}</p>
                    <div className="pt-4">
                        <p className="text-[12px] font-black uppercase" style={{ color: primaryBlue }}>INVOICE NO: #{invoiceNo}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
            </header>
          ) : (
            <div className="mb-6 border-b pb-4 flex justify-between items-end">
                <p className="text-[11px] font-black uppercase opacity-40 tracking-widest">Invoice Continued: #{invoiceNo}</p>
                <p className="text-[9px] font-black">Page {pageIdx + 1}</p>
            </div>
          )}

          {pageIdx === 0 && (
            <>
              {/* ADVICE BAR */}
              <div className="flex w-full mb-6 border border-black rounded-sm overflow-hidden">
                  <div className="w-[60%] border-r border-black py-2 bg-slate-50 flex items-center justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Remittance Advice</p>
                  </div>
                  <div className="w-[40%] py-2 bg-blue-50 flex items-center justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-900/60">Account Summary</p>
                  </div>
              </div>

              <div className="grid grid-cols-[60%_40%] gap-0 mb-8 border-b pb-8">
                  <div className="pr-12 space-y-4">
                      <p className="text-[10px] font-medium leading-relaxed opacity-80">
                        Please remit your payment to: <span className="font-black uppercase">{workspace?.name || 'THE BUSINESS'}</span>. Include your Invoice Number as the reference.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1.5">
                              <p className="text-[8px] font-black uppercase text-blue-800 tracking-widest">Billing From</p>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-black uppercase leading-tight">{workspace?.name || 'The Shop'}</p>
                                <p className="text-[9px] font-medium opacity-50 uppercase leading-tight">{workspace?.address || 'Kenya'}</p>
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <p className="text-[8px] font-black uppercase text-blue-800 tracking-widest">Billing To</p>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-black uppercase leading-tight">{customer.name}</p>
                                <p className="text-[9px] font-medium opacity-50 uppercase leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
                                <p className="text-[9px] font-bold pt-1">{customer.phone}</p>
                              </div>
                          </div>
                      </div>

                      {/* PAYMENT DETAILS BLOCK */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 border rounded-md border-black/5">
                            <p className="text-[7px] font-black uppercase text-blue-900/40 tracking-widest mb-1">Bank Payment</p>
                            <p className="text-[9px] font-black">DTB</p>
                            <p className="text-[9px] font-medium uppercase">MATESH TECHNOLOGIES</p>
                            <p className="text-[9px] font-black">ACC NO: 0084976001</p>
                        </div>
                        <div className="p-3 bg-slate-50 border rounded-md border-black/5">
                            <p className="text-[7px] font-black uppercase text-blue-900/40 tracking-widest mb-1">Lipan Na M-Pesa</p>
                            <p className="text-[9px] font-black">PAYBILL NO: 516600</p>
                            <p className="text-[9px] font-black">ACC NO: 5084975001</p>
                        </div>
                      </div>
                  </div>
                  <div className="bg-blue-50/40 p-8 flex flex-col justify-center border-l border-black/5 rounded-r-lg">
                      <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-1">Net Balance Due</p>
                      <p className="text-[28px] font-black tracking-tighter leading-none" style={{ color: primaryBlue }}>KES {formatCurrency(totalAmountDue)}</p>
                      <div className="mt-4 pt-4 border-t border-blue-200">
                         <p className="text-[9px] font-bold uppercase tracking-tight">Payment Term: <span className="font-black">DUE ON RECEIPT</span></p>
                      </div>
                  </div>
              </div>
            </>
          )}

          {/* ITEM TABLE */}
          <div className="flex-grow overflow-hidden flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-4 font-black text-[9px] uppercase w-16 text-center">Ref</th>
                        <th className="p-4 font-black text-[9px] uppercase">Description & Specifications</th>
                        <th className="p-4 text-center font-black text-[9px] uppercase w-20">Qty</th>
                        <th className="p-4 text-right font-black text-[9px] uppercase w-32">Unit Price</th>
                        <th className="p-4 text-right font-black text-[9px] uppercase w-36">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.map((item: any, idx: number) => {
                        const unitPrice = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitPrice * qty;
                        
                        const itemNumber = pages.slice(0, pageIdx).reduce((acc, p) => acc + p.length, 0) + idx + 1;

                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 min-h-[50px]">
                                <td className="p-4 text-[10px] font-black text-center opacity-20">
                                    {itemNumber.toString().padStart(2, '0')}
                                </td>
                                <td className="p-4">
                                    <p className="font-black uppercase leading-tight text-[11px] tracking-tight">{item.name || item.description}</p>
                                    {item.serialNumber && (
                                        <p className="text-[8px] text-gray-400 font-mono mt-1 uppercase tracking-tighter">S/N: {item.serialNumber}</p>
                                    )}
                                </td>
                                <td className="p-4 text-center font-black text-[10px]">{qty}</td>
                                <td className="p-4 text-right tabular-nums font-bold text-[10px] opacity-70">{formatCurrency(unitPrice)}</td>
                                <td className="p-4 text-right tabular-nums font-black text-[11px]">{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          {/* TOTALS & FOOTER */}
          <footer className="mt-auto pt-6 border-t border-gray-100 bg-white">
             {pageIdx === pages.length - 1 && (
                <div className="mb-8 pt-4 border-t-2 border-black/5">
                    <div className="flex justify-between items-start gap-12">
                        <div className="flex-1 space-y-4">
                            <div className="p-4 bg-slate-50 border rounded-lg">
                                <p className="text-[8px] font-black uppercase text-blue-900/40 tracking-widest mb-1">Amount in Words</p>
                                <p className="font-black uppercase text-[10px] leading-relaxed italic text-blue-900">
                                    {numberToWords(currentTotal)}
                                </p>
                            </div>
                            <div className="text-[9px] font-medium text-muted-foreground italic max-w-[300px]">
                                * All items remain property of {workspace?.name || 'the seller'} until the total balance is cleared.
                            </div>
                        </div>
                        
                        <div className="w-[340px] space-y-0">
                            <div className="flex justify-between items-center p-3.5 bg-slate-50/50 border-b border-white">
                                <span className="font-bold opacity-40 uppercase text-[9px]">Invoice Subtotal</span>
                                <span className="font-black text-[11px]">{formatCurrency(subtotal)}</span>
                            </div>
                            {vat > 0 && (
                                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 border-b border-white">
                                    <span className="font-bold opacity-40 uppercase text-[9px]">Tax Amount (16%)</span>
                                    <span className="font-black text-[11px]">{formatCurrency(vat)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center p-3.5 bg-orange-50/30 border-b border-white">
                                <span className="font-bold text-orange-800/60 uppercase text-[9px]">Brought Forward</span>
                                <span className="font-black text-orange-800 text-[11px]">{formatCurrency(previousBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-blue-900 text-white shadow-xl mt-2 rounded-sm">
                                <span className="text-[12px] font-black uppercase tracking-tighter">Net Amount Due</span>
                                <span className="font-black tracking-tight text-[22px]">KES {formatCurrency(totalAmountDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {pageIdx === pages.length - 1 && (
                <div className="text-center space-y-1.5 pb-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES'}</p>
                    <p className="text-[8px] font-bold text-black">
                        Phone: {workspace?.phone || '+254701694469'}. Email: {workspace?.email || 'mateshtechltd@gmail.com'}
                    </p>
                </div>
             )}
             
             <div className="flex justify-between items-center border-t pt-4">
                <div className="text-[8px] font-black uppercase tracking-tighter text-black">
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
