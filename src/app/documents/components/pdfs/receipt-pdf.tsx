'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

/**
 * @fileOverview Professional Receipt PDF Component
 * Enhanced with Account Statement Logic for Debt Tracking.
 */
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
  
  const customer = data.customer || {
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const items = data.items || [];
  
  // CALCULATIONS
  const rawSubtotal = Number(data.subtotal || data.amount || 0);
  const applyVat = data.applyVat || false;
  const vatAmount = Number(data.vatAmount || data.vat || (applyVat ? rawSubtotal * 0.16 : 0));
  const todayTotal = Number(data.total || (rawSubtotal + vatAmount));
  
  // FIX: Ensure 0 is handled correctly by using nullish coalescing or explicit check
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

  const contactInfo = workspace?.phone || workspace?.email || 'Nairobi, Kenya';

  return (
    <div className="p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      
      {/* BRANDED HEADER */}
      <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>{companyName}</h1>
            <p className="font-bold text-[10px] opacity-70 text-green-700">Official Payment Receipt</p>
          </div>
        </div>
        <div className="text-right space-y-1">
            <p className="font-black text-[10px] uppercase">Head Office</p>
            <p className="text-[9px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
            <p className="text-[9px] font-bold">Email: {workspace?.email || 'N/A'}</p>
            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-blue-800">Receipt No: {receiptNo}</p>
                <p className="text-[9px] font-bold">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
            </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 rounded-lg space-y-0.5" style={{ backgroundColor: secondaryIndigo }}>
            <h3 className="font-medium text-[14px] mb-1" style={{ color: primaryIndigo }}>Payment From</h3>
            <p className="font-bold text-xs uppercase">{customer.name}</p>
            <p className="text-[10px] font-medium text-black/70">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="text-[10px] font-medium text-black/70">{customer.phone}</p>
        </div>
        <div className="p-4 rounded-lg space-y-0.5 border border-black/5" style={{ backgroundColor: "#fdfcf0" }}>
            <h3 className="font-medium text-[12px] mb-1 text-orange-800 uppercase">Account Overview</h3>
            <div className="flex justify-between items-center border-b border-orange-200 pb-1">
                <p className="text-[9px] font-bold opacity-60">Balance Brought Forward:</p>
                <p className="font-bold text-xs">KES {formatCurrency(previousBalance)}</p>
            </div>
            <div className="flex justify-between items-center pt-2">
                <p className="text-[10px] font-black text-orange-900 uppercase">Total Statement Due:</p>
                <p className="font-black text-lg text-orange-900">KES {formatCurrency(totalAccountBalance)}</p>
            </div>
            <p className="text-[7px] italic text-orange-700 mt-1 uppercase">* Includes current unpaid balance and historical debt</p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                    <th className="py-2 px-3 font-black text-[9px] rounded-l-sm">ITEM</th>
                    <th className="py-2 text-right font-black text-[9px] w-16">TAX</th>
                    <th className="py-2 text-right font-black text-[9px] w-16">QTY</th>
                    <th className="py-2 text-right font-black text-[9px] w-24">UNIT RATE</th>
                    <th className="py-2 px-3 text-right font-black text-[9px] rounded-r-sm w-32">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => {
                    const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                    const qty = Number(item.quantity || 1);
                    const rowTotal = unitRate * qty;
                    
                    return (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-3 px-3 align-top">
                                <div className="flex gap-2">
                                    <span className="opacity-50 text-[10px] font-bold">{idx + 1}.</span>
                                    <div>
                                        <p className="font-bold text-[11px] uppercase">{item.name || item.description}</p>
                                        {item.serialNumber && <p className="text-[9px] text-gray-500 mt-0.5 font-mono">S/N: {item.serialNumber}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 text-right text-[10px] font-medium">{applyVat ? '16%' : '0%'}</td>
                            <td className="py-3 text-right text-[10px] font-medium">{qty}</td>
                            <td className="py-3 text-right text-[10px] font-medium">KES {formatCurrency(unitRate)}</td>
                            <td className="py-3 px-3 text-right text-[10px] font-bold">KES {formatCurrency(rowTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        <div className="flex justify-between items-start mt-6">
            <div className="max-w-[350px]">
                <p className="text-[10px] font-bold text-black uppercase">
                    Paid in words: {numberToWords(amountPaidToday)}
                </p>
                <div className="mt-8 p-4 bg-muted/20 border-2 border-dashed rounded-xl">
                    <p className="text-[9px] font-black uppercase opacity-40 mb-2">Verification Notice</p>
                    <p className="text-[10px] font-medium leading-relaxed italic">
                        "This document confirms receipt of funds for the items listed above. Goods once sold cannot be returned. Please verify serial numbers and condition before departure."
                    </p>
                </div>
            </div>
            <div className="w-[300px] space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold opacity-60 uppercase">today's subtotal</span>
                    <span className="font-bold">{formatCurrency(rawSubtotal)}</span>
                </div>
                {applyVat && (
                  <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold opacity-60 uppercase">VAT (16%)</span>
                      <span className="font-bold">{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] border-t border-black/10 pt-1">
                    <span className="font-black uppercase">receipt total</span>
                    <span className="font-black">KES {formatCurrency(todayTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] bg-green-50 p-2 rounded">
                    <span className="font-black uppercase text-green-700">amount paid today</span>
                    <span className="font-black text-green-700">KES {formatCurrency(amountPaidToday)}</span>
                </div>
                {balanceToday > 0 && (
                  <div className="flex justify-between items-center text-[10px] bg-red-50 p-2 rounded">
                      <span className="font-black uppercase text-red-700">current balance due</span>
                      <span className="font-black text-red-700">KES {formatCurrency(balanceToday)}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t-2 border-black flex justify-between items-center px-1">
                    <span className="text-[11px] font-black uppercase">total account debt</span>
                    <span className="text-lg font-black text-blue-900">KES {formatCurrency(totalAccountBalance)}</span>
                </div>
                <div className="h-0.5 bg-black w-full mt-[-1px]"></div>
            </div>
        </div>
      </section>

      {/* Footer Contact */}
      <footer className="mt-auto pt-8 text-center">
         <p className="text-[10px] font-medium text-black mb-4">
            If you have any questions, reach out via <span className="font-bold">{contactInfo}</span>
         </p>
         <p className="text-[8px] font-medium text-gray-400">
            This is an electronically verified payment receipt. No physical signature is required.
         </p>
         <p className="text-[7px] text-gray-300 mt-2 uppercase tracking-[0.2em]">
            {companyName} Node Sync Active
         </p>
      </footer>
    </div>
  );
}
