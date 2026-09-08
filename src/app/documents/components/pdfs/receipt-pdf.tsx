'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

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

  // DYNAMIC DENSITY
  const itemCount = items.length;
  const isUltraCompact = itemCount > 25;
  const isCompact = itemCount > 15;

  const textBase = isUltraCompact ? "text-[9px]" : isCompact ? "text-[10px]" : "text-[12px]";
  const textLarge = isUltraCompact ? "text-[11px]" : isCompact ? "text-[12px]" : "text-[14px]";
  const paddingRow = isUltraCompact ? "p-1.5" : isCompact ? "p-2.5" : "p-4";
  const marginSection = isUltraCompact ? "mb-2" : isCompact ? "mb-4" : "mb-8";

  return (
    <div className="flex flex-col items-center bg-slate-100 p-4">
        <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden relative">
          
          <header className={cn("flex justify-between items-start border-b-4 border-black", marginSection, isUltraCompact ? "pb-4" : "pb-8")}>
                <div className="flex items-center gap-8">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className={cn("w-auto object-contain", isUltraCompact ? "h-16" : "h-28")} crossOrigin="anonymous" />
                ) : (
                    <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-0.5">
                    <h1 className={cn("font-black uppercase tracking-tighter", isUltraCompact ? "text-xl" : "text-3xl")} style={{ color: primaryIndigo }}>{companyName}</h1>
                    <p className={cn("font-bold text-green-700 uppercase tracking-widest opacity-70", textBase)}>Official Payment Receipt</p>
                </div>
                </div>
                <div className="text-right space-y-1">
                    <p className={cn("font-black uppercase", textBase)}>Head Office</p>
                    <p className={cn("font-medium max-w-[220px] leading-tight", isUltraCompact ? "text-[8px]" : "text-[10px]")}>{workspace?.address || 'Nairobi, Kenya'}</p>
                    <p className={cn("font-bold", isUltraCompact ? "text-[8px]" : "text-[10px]")}>Tel: {workspace?.phone || 'N/A'}</p>
                    <div className={isUltraCompact ? "pt-1" : "pt-4"}>
                        <p className={cn("font-black uppercase text-blue-800", textLarge)}>Receipt No: {receiptNo}</p>
                        <p className={cn("font-bold", textBase)}>Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                    </div>
                </div>
          </header>

          <section className={cn("grid grid-cols-2 gap-6", isUltraCompact ? "mb-2" : "mb-10")}>
                <div className={cn("rounded-xl space-y-1 bg-slate-50 border-2 border-slate-100 shadow-sm", paddingRow)}>
                    <h3 className={cn("font-black uppercase tracking-tight", textBase)} style={{ color: primaryIndigo }}>Payment From</h3>
                    <p className={cn("font-black uppercase", textLarge)}>{customer.name}</p>
                    <p className={cn("font-medium text-black/70 leading-tight", textBase)}>{customer.address || 'Nairobi, Kenya'}</p>
                </div>
                <div className={cn("rounded-xl space-y-1 border-2 border-orange-100 bg-orange-50/50 shadow-sm", paddingRow)}>
                    <h3 className={cn("font-black text-orange-800 uppercase tracking-tight", textBase)}>Account Overview</h3>
                    <div className="flex justify-between items-center">
                        <p className="text-[9px] font-bold opacity-60 uppercase">Previous Balance:</p>
                        <p className={cn("font-black", textBase)}>KES {formatCurrency(previousBalance)}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-orange-200 pt-1">
                        <p className={cn("font-black text-orange-900 uppercase", textBase)}>Account Total:</p>
                        <p className={cn("font-black text-orange-900 tracking-tighter", isUltraCompact ? "text-lg" : "text-xl")}>KES {formatCurrency(totalAccountBalance)}</p>
                    </div>
                </div>
          </section>

          <div className="flex-grow overflow-hidden border-2 border-black rounded-sm flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryIndigo }}>
                        <th className={cn("font-black border-r border-blue-900 uppercase", paddingRow, textBase)}>Description</th>
                        <th className={cn("text-right font-black border-r border-blue-900 w-16 uppercase", paddingRow, textBase)}>Tax</th>
                        <th className={cn("text-right font-black border-r border-blue-900 w-16 uppercase", paddingRow, textBase)}>Qty</th>
                        <th className={cn("text-right font-black w-32 uppercase", paddingRow, textBase)}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, idx: number) => {
                        const unitRate = Number(item.sellingPrice || item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const rowTotal = unitRate * qty;
                        
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className={cn("border-r border-gray-100", paddingRow)}>
                                    <p className={cn("font-black uppercase leading-tight", textLarge)}>{item.name || item.description}</p>
                                    {!isUltraCompact && item.serialNumber && <p className="text-[8px] text-gray-500 font-mono">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className={cn("text-right font-bold border-r border-gray-100", paddingRow, textBase)}>{applyVat ? '16%' : '0%'}</td>
                                <td className={cn("text-right font-black border-r border-gray-100", paddingRow, textBase)}>{qty}</td>
                                <td className={cn("text-right tabular-nums font-black", paddingRow, textLarge)}>{formatCurrency(rowTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-4">
              <div className="flex justify-end">
                  <div className={isUltraCompact ? "w-full" : "w-[350px] space-y-1"}>
                      <div className="flex justify-between p-1.5 border-b border-gray-100">
                          <span className="font-bold opacity-60 uppercase text-[9px]">Receipt Gross</span>
                          <span className={cn("font-black", textBase)}>{formatCurrency(todayTotal)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-emerald-50 rounded-lg shadow-inner">
                          <span className="font-black uppercase text-emerald-800 text-[10px]">Amount Settled</span>
                          <span className={cn("font-black text-emerald-700 tracking-tighter", isUltraCompact ? "text-xl" : "text-2xl")}>KES {formatCurrency(amountPaidToday)}</span>
                      </div>
                      <div className="flex justify-between p-3 border-t-4 border-black bg-red-50">
                          <span className="text-[10px] font-black uppercase text-red-700">Remaining Debt</span>
                          <span className={cn("font-black text-red-800 tracking-tighter", isUltraCompact ? "text-xl" : "text-2xl")}>KES {formatCurrency(totalAccountBalance)}</span>
                      </div>
                  </div>
              </div>
              
              <p className={cn("font-black uppercase italic opacity-60 leading-relaxed border-l-4 border-black pl-4", textBase)}>
                  Settled in words: {numberToWords(amountPaidToday)}
              </p>
          </div>

          <footer className="mt-auto pt-4 border-t-2 border-gray-200">
             <div className="flex justify-between items-end">
                <div className={cn("font-bold text-gray-500 space-y-0.5", isUltraCompact ? "text-[8px]" : "text-[10px]")}>
                    <p className="uppercase">{workspace?.name}</p>
                    <p className="opacity-60">Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
                </div>
                <div className={cn("font-black bg-gray-100 px-3 py-1 rounded", textBase)}>
                    PAGE 1 OF 1
                </div>
             </div>
          </footer>
        </div>
    </div>
  );
}
