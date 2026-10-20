'use client';

import type { Sale, Customer, Payment } from "@/types";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CustomerStatementPdfProps {
  customer: Customer;
  sales: Sale[];
  payments: Payment[];
  workspace: any;
}

export function CustomerStatementPdf({ customer, sales, payments, workspace }: CustomerStatementPdfProps) {
  const primaryBlue = "#1e3a8a"; 

  const totalInvoiced = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const netBalance = totalInvoiced - totalPaid;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const unifiedLedger = useMemo(() => {
    const items = [
      ...sales.map(s => ({
        date: s.date || s.createdAt,
        reference: s.invoiceNumber || `SALE_${s.id.slice(0, 8)}`,
        description: 'INVOICED AMOUNT',
        type: 'SALE',
        invoiced: Number(s.total) || 0,
        paid: 0
      })),
      ...payments.map(p => ({
        date: p.date || p.createdAt,
        reference: p.reference || `PAY_${p.id.slice(0, 8)}`,
        description: `PAYMENT RECEIVED (${p.method})`,
        type: p.type === 'Credit Note' ? 'CREDIT' : 'PAYMENT',
        invoiced: 0,
        paid: Number(p.amount) || 0
      }))
    ].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    let runningBalance = 0;
    return items.map(item => {
      runningBalance += (item.invoiced - item.paid);
      return { ...item, balance: runningBalance };
    });
  }, [sales, payments]);

  return (
    <div className="p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border">
      
      {/* BRANDED HEADER */}
      <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-6">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300 uppercase">LOGO</div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES LIMITED'}</h1>
            <p className="font-bold text-[10px] opacity-70 uppercase tracking-widest">Official Customer Statement</p>
          </div>
        </div>
        <div className="text-right space-y-1">
            <p className="font-black text-[10px] uppercase">Contact Details</p>
            <p className="text-[9px] font-medium max-w-[200px] leading-tight uppercase">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
            <p className="text-[9px] font-bold">Email: {workspace?.email || 'N/A'}</p>
            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-blue-800">Date: {format(new Date(), "dd MMM yyyy")}</p>
            </div>
        </div>
      </header>

      <div className="flex w-full mb-4 border border-black overflow-hidden rounded-sm">
        <div className="w-7/12 bg-gray-200 px-4 py-2 border-r border-black font-black uppercase text-[10px]">Client Information</div>
        <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-[10px]">Account Summary</div>
      </div>

      <div className="text-[10px] leading-relaxed mb-6 grid grid-cols-12 gap-4">
        <div className="col-span-7">
            <p className="font-black uppercase text-xs">{customer.alias || customer.name}</p>
            <p className="uppercase">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="font-bold">{customer.phone}</p>
            <p className="mt-4">Payment remit to: <span className="font-black uppercase">{workspace?.name || 'THE BUSINESS'}</span></p>
        </div>
        <div className="col-span-5 border-l border-black/10 pl-4 space-y-2">
             <div className="flex justify-between items-center">
                <p className="text-[8px] font-black uppercase opacity-60">Total Invoiced</p>
                <p className="font-black">KES {formatCurrency(totalInvoiced)}</p>
             </div>
             <div className="flex justify-between items-center">
                <p className="text-[8px] font-black uppercase opacity-60 text-green-600">Total Settled</p>
                <p className="font-black text-green-700">KES {formatCurrency(totalPaid)}</p>
             </div>
             <div className="pt-2 border-t border-black/10 text-right">
                <p className="text-[9px] font-black uppercase text-blue-900 leading-none">
                  {netBalance >= 0 ? 'Net Balance Due' : 'Account Credit Balance'}
                </p>
                <p className={cn(
                  "text-xl font-black",
                  netBalance > 0 ? "text-blue-900" : "text-green-700"
                )}>
                  KES {formatCurrency(netBalance)}
                  {netBalance < 0 && <span className="text-[8px] block mt-1 uppercase text-green-600">(We owe you)</span>}
                </p>
             </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border rounded-lg mb-8">
          <h3 className="font-black text-blue-900 uppercase text-[9px] mb-2">Settlement Instructions</h3>
          <div className="grid grid-cols-2 gap-4 text-[9px]">
            <div>
                <p className="font-black">BANK: {workspace?.bankName || 'DIAMOND TRUST BANK (DTB)'}</p>
                <p className="font-bold uppercase">NAME: {workspace?.bankAccName || workspace?.name || 'THE BUSINESS'}</p>
                <p className="font-bold">ACC NO: {workspace?.bankAccNo || '0084976001'}</p>
            </div>
            <div className="text-right">
                {workspace?.paybillNumber && (
                    <p className="font-black">MPESA PAYBILL: {workspace.paybillNumber} | ACC: {workspace.paybillAccount || 'BUSINESS'}</p>
                )}
                {workspace?.tillNumber && (
                    <p className="font-black">MPESA TILL: {workspace.tillNumber}</p>
                )}
                <p className="italic opacity-60 mt-2">"Please use your account name as reference for reconciliations."</p>
            </div>
          </div>
      </div>

      <div className="flex-grow">
        <table className="w-full border-collapse border border-black">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                    <th className="p-3 font-black text-[9px] border border-black uppercase w-24">Date</th>
                    <th className="p-3 font-black text-[9px] border border-black uppercase">Reference & Detail</th>
                    <th className="p-3 text-right font-black text-[9px] border border-black w-28 uppercase">Invoiced</th>
                    <th className="p-3 text-right font-black text-[9px] border border-black w-28 uppercase">Paid</th>
                    <th className="p-3 text-right font-black text-[9px] border border-black w-32 uppercase">Account Bal</th>
                </tr>
            </thead>
            <tbody>
                {unifiedLedger.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 h-10">
                        <td className="p-3 font-medium border-x border-black/5">{format(parseISO(item.date), "dd/MM/yy")}</td>
                        <td className="p-3">
                          <p className="font-black uppercase text-[10px] leading-tight">{item.reference}</p>
                          <p className="text-[8px] opacity-40 uppercase">{item.description}</p>
                        </td>
                        <td className="p-3 text-right tabular-nums font-medium border-x border-black/5">{item.invoiced > 0 ? formatCurrency(item.invoiced) : '—'}</td>
                        <td className="p-3 text-right tabular-nums text-green-600 font-black border-x border-black/5">{item.paid > 0 ? formatCurrency(item.paid) : '—'}</td>
                        <td className={cn(
                          "p-3 text-right tabular-nums font-black border-x border-black/5",
                          item.balance > 0 ? "text-blue-900" : "text-green-700"
                        )}>
                          {formatCurrency(item.balance)}
                        </td>
                    </tr>
                ))}
                {unifiedLedger.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center italic opacity-30 font-black uppercase text-[10px]">No transaction flow logged for this silo</td></tr>
                )}
            </tbody>
        </table>
      </div>

      <footer className="mt-auto pt-8 border-t border-gray-200 text-center">
         <p className="text-sm font-black italic text-blue-900 mb-4">Thank you for your business!</p>
         <div className="space-y-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            <p>Generated: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')} &bull; Permanent Audit Record</p>
         </div>
      </footer>
    </div>
  );
}
