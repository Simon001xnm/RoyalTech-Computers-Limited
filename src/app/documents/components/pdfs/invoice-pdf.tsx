'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords, cn } from "@/lib/utils";

export function InvoicePdf({ document: docSnapshot }: { document: AppDocument }) {
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
    name: data.customerName || 'VALUED CLIENT',
    alias: '',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { subtotal, total, previousBalance = 0 } = data;
  const currentTotal = total || subtotal || 0;
  const totalAmountDue = currentTotal + previousBalance;

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

  // DYNAMIC DENSITY CALCULATION
  const itemCount = items.length;
  const isUltraCompact = itemCount > 25;
  const isCompact = itemCount > 15;

  const textBase = isUltraCompact ? "text-[9px]" : isCompact ? "text-[10px]" : "text-[12px]";
  const textLarge = isUltraCompact ? "text-[11px]" : isCompact ? "text-[12px]" : "text-[14px]";
  const textTitle = isUltraCompact ? "text-xl" : isCompact ? "text-2xl" : "text-3xl";
  const paddingRow = isUltraCompact ? "p-1.5" : isCompact ? "p-2.5" : "p-4";
  const marginSection = isUltraCompact ? "mb-2" : isCompact ? "mb-4" : "mb-8";

  return (
    <div className="flex flex-col items-center bg-slate-100 p-4">
        <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden relative">
          
          <header className={cn("flex justify-between items-start border-b-4 border-black", marginSection, isUltraCompact ? "pb-4" : "pb-8")}>
              <div className="flex items-center gap-6">
                {workspace?.logoUrl ? (
                    <img src={workspace.logoUrl} alt="Logo" className={cn("w-auto object-contain", isUltraCompact ? "h-16" : "h-24")} crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
                <div className="space-y-0.5">
                    <h1 className={cn("font-black uppercase tracking-tighter", textTitle)} style={{ color: primaryBlue }}>{workspace?.name || 'OFFICIAL BUSINESS'}</h1>
                    <p className={cn("font-bold uppercase tracking-widest opacity-60", textBase)}>Official Tax Invoice / Statement</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                  <p className={cn("font-black uppercase", textBase)}>Head Office</p>
                  <p className={cn("font-medium max-w-[200px] leading-tight", isUltraCompact ? "text-[8px]" : "text-[10px]")}>{workspace?.address || 'Nairobi, Kenya'}</p>
                  <p className={cn("font-bold", isUltraCompact ? "text-[8px]" : "text-[10px]")}>Tel: {workspace?.phone || 'N/A'}</p>
                  <div className={isUltraCompact ? "pt-1" : "pt-4"}>
                      <p className={cn("font-black uppercase text-blue-800", textLarge)}>Invoice No: {invoiceNo}</p>
                      <p className={cn("font-bold", textBase)}>Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
                  </div>
              </div>
          </header>

          <div className={cn("flex w-full border-2 border-black overflow-hidden rounded-sm", isUltraCompact ? "mb-2" : "mb-6")}>
              <div className={cn("w-7/12 bg-gray-200 border-r-2 border-black font-black uppercase", paddingRow, textBase)}>Remittance Advice</div>
              <div className={cn("w-5/12 bg-blue-100 font-black uppercase", paddingRow, textBase)}>Account Summary</div>
          </div>

          <div className={cn("leading-relaxed grid grid-cols-12 gap-6", textBase, isUltraCompact ? "mb-4" : "mb-8")}>
              <div className="col-span-7">
                  <p className="font-medium">Remit payment to: <span className="font-black uppercase">{workspace?.name || 'THE BUSINESS'}</span></p>
                  <p className={isUltraCompact ? "mt-1" : "mt-3"}>Due Date: <span className="font-black underline">{format(new Date(), "dd/MM/yyyy")}</span></p>
              </div>
              <div className="col-span-5 border-l-2 border-black/10 pl-6">
                  <p className="font-black uppercase opacity-60">Balance Due:</p>
                  <p className={cn("font-black text-blue-900 tracking-tighter", isUltraCompact ? "text-xl" : "text-3xl")}>KES {formatCurrency(totalAmountDue)}</p>
              </div>
          </div>

          <div className={cn("grid grid-cols-2 gap-12 px-4", isUltraCompact ? "mb-4" : "mb-10")}>
              <div className="space-y-1">
                  <h3 className={cn("font-black uppercase text-blue-900 underline decoration-2", textBase, isUltraCompact ? "mb-1" : "mb-2")}>Billing From</h3>
                  <p className={cn("font-black uppercase", textLarge)}>{workspace?.name || 'OFFICIAL BUSINESS'}</p>
                  <p className="opacity-80 leading-tight font-medium">{workspace?.address || 'Nairobi, Kenya'}</p>
              </div>
              <div className="space-y-1">
                  <h3 className={cn("font-black uppercase text-blue-900 underline decoration-2", textBase, isUltraCompact ? "mb-1" : "mb-2")}>Billing To</h3>
                  <p className={cn("font-black uppercase", textLarge)}>{customer.alias || customer.name}</p>
                  <p className="opacity-80 leading-tight font-medium">{customer.address || 'Nairobi, Kenya'}</p>
              </div>
          </div>

          <div className="flex-grow overflow-hidden border-2 border-black rounded-sm flex flex-col">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className={cn("font-black border-r border-blue-900 uppercase text-center w-12", paddingRow, textBase)}>#</th>
                        <th className={cn("font-black border-r border-blue-900 uppercase", paddingRow, textBase)}>Description</th>
                        <th className={cn("text-right font-black border-r border-blue-900 w-16 uppercase", paddingRow, textBase)}>Qty</th>
                        <th className={cn("text-right font-black border-r border-blue-900 w-24 uppercase", paddingRow, textBase)}>Rate</th>
                        <th className={cn("text-right font-black w-32 uppercase", paddingRow, textBase)}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, idx: number) => {
                        const name = item.name || item.description;
                        const unitPrice = item.price || item.sellingPrice || item.unitPrice || 0;
                        const qty = item.quantity || 1;
                        return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className={cn("font-medium text-center border-r border-gray-100", paddingRow, textBase)}>{idx + 1}</td>
                                <td className={cn("border-r border-gray-100", paddingRow)}>
                                    <p className={cn("font-black uppercase leading-tight", textLarge)}>{name}</p>
                                    {item.serialNumber && !isUltraCompact && <p className="text-[8px] font-mono opacity-50 uppercase">S/N: {item.serialNumber}</p>}
                                </td>
                                <td className={cn("text-right tabular-nums font-bold border-r border-gray-100", paddingRow, textBase)}>{qty.toFixed(0)}</td>
                                <td className={cn("text-right tabular-nums font-medium border-r border-gray-100", paddingRow, textBase)}>{formatCurrency(unitPrice)}</td>
                                <td className={cn("text-right tabular-nums font-black", paddingRow, textLarge)}>{formatCurrency(qty * unitPrice)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-4">
              <div className="flex justify-end">
                  <div className={isUltraCompact ? "w-full" : "w-[350px]"}>
                      <div className="flex justify-between p-2 border-b border-gray-100">
                          <span className={cn("font-black uppercase opacity-60", isUltraCompact ? "text-[8px]" : "text-[10px]")}>Current Total</span>
                          <span className={cn("font-black", textLarge)}>{formatCurrency(currentTotal)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-gray-100 bg-orange-50/30">
                          <span className={cn("font-black uppercase text-orange-600", isUltraCompact ? "text-[8px]" : "text-[10px]")}>Brought Forward</span>
                          <span className={cn("font-black text-orange-700", textLarge)}>{formatCurrency(previousBalance)}</span>
                      </div>
                      <div className="flex justify-between p-3 border-t-2 border-black bg-blue-50">
                          <span className={cn("font-black uppercase", textBase)}>Net Amount Due</span>
                          <span className={cn("font-black tracking-tighter text-blue-900", isUltraCompact ? "text-xl" : "text-2xl")}>KES {formatCurrency(totalAmountDue)}</span>
                      </div>
                  </div>
              </div>
              
              <p className={cn("font-black uppercase italic opacity-60 leading-relaxed border-l-4 border-black pl-4", textBase)}>
                  Amount in words: {numberToWords(totalAmountDue)}
              </p>
          </div>

          <footer className="mt-auto pt-4 border-t-2 border-gray-200 bg-white">
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
