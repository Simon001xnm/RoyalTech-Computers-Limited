'use client';

import type { Document as AppDocument, Sale, Customer } from "@/types";
import { format } from "date-fns";

interface CustomerStatementPdfProps {
  customer: Customer;
  sales: Sale[];
  workspace: any;
}

export function CustomerStatementPdf({ customer, sales, workspace }: CustomerStatementPdfProps) {
  const primaryBlue = "#1e3a8a"; 

  const totalInvoiced = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalPaid = sales.reduce((acc, s) => acc + (Number(s.amountPaid) || 0), 0);
  const currentBalance = totalInvoiced - totalPaid;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</h1>
            <p className="font-bold text-[10px] opacity-70">Official Customer Statement</p>
          </div>
        </div>
        <div className="text-right space-y-1">
            <p className="font-black text-[10px] uppercase">Contact Details</p>
            <p className="text-[9px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-bold">Tel: {workspace?.phone || 'N/A'}</p>
            <p className="text-[9px] font-bold">Email: {workspace?.email || 'N/A'}</p>
            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-blue-800">Generated: {format(new Date(), "dd MMM yyyy")}</p>
            </div>
        </div>
      </header>

      {/* Account Summary Header */}
      <div className="flex w-full mb-4 border border-black overflow-hidden rounded-sm">
        <div className="w-7/12 bg-gray-200 px-4 py-2 border-r border-black font-black uppercase text-[10px]">Client Information</div>
        <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-[10px]">Account Summary</div>
      </div>

      <div className="text-[10px] leading-relaxed mb-6 grid grid-cols-12 gap-4">
        <div className="col-span-7">
            <p className="font-black uppercase text-xs">{customer.alias || customer.name}</p>
            <p>{customer.address || 'Nairobi, Kenya'}</p>
            <p className="font-bold">{customer.phone}</p>
            <p className="mt-4">Payment remit to: <span className="font-black uppercase">{workspace?.name || 'THE BUSINESS'}</span></p>
        </div>
        <div className="col-span-5 border-l border-black/10 pl-4 space-y-2">
             <div>
                <p className="text-[8px] font-black uppercase opacity-60 leading-none">Total Invoiced</p>
                <p className="text-sm font-black">KES {formatCurrency(totalInvoiced)}</p>
             </div>
             <div>
                <p className="text-[8px] font-black uppercase opacity-60 leading-none text-green-600">Total Settled</p>
                <p className="text-sm font-black text-green-700">KES {formatCurrency(totalPaid)}</p>
             </div>
             <div className="pt-2 border-t border-black/10">
                <p className="text-[9px] font-black uppercase text-blue-900 leading-none">Net Balance Due</p>
                <p className="text-xl font-black text-blue-900">KES {formatCurrency(currentBalance)}</p>
             </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="p-4 bg-gray-50 border rounded-lg mb-8">
          <h3 className="font-black text-blue-900 uppercase text-[9px] mb-2">Settlement Details</h3>
          <div className="grid grid-cols-2 gap-4 text-[9px]">
            <div>
                <p className="font-black">BANK: DIAMOND TRUST BANK (DTB)</p>
                <p className="font-bold uppercase">NAME: {workspace?.name || 'THE BUSINESS'}</p>
                <p className="font-bold">ACC NO: 0084976001</p>
            </div>
            <div className="text-right">
                <p className="italic opacity-60">"Please use your account name as the reference when making payments."</p>
            </div>
          </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                    <th className="p-3 font-black text-[9px] border border-blue-900">DATE</th>
                    <th className="p-3 font-black text-[9px] border border-blue-900">REFERENCE</th>
                    <th className="p-3 font-black text-[9px] border border-blue-900">DESCRIPTION</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-24">INVOICED</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-24">PAID</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-28">BALANCE</th>
                </tr>
            </thead>
            <tbody>
                {sales.map((sale, idx) => {
                    const balance = (Number(sale.total) || 0) - (Number(sale.amountPaid) || 0);
                    return (
                        <tr key={sale.id} className="border-b border-gray-200">
                            <td className="p-3 font-medium">{format(new Date(sale.date), "dd/MM/yyyy")}</td>
                            <td className="p-3 font-mono font-bold text-[9px]">#{sale.id.slice(0,8).toUpperCase()}</td>
                            <td className="p-3">
                                <p className="font-bold uppercase leading-normal">
                                    {sale.items?.map(i => i.name).join(", ") || "Sales Transaction"}
                                </p>
                            </td>
                            <td className="p-3 text-right tabular-nums font-medium">{formatCurrency(Number(sale.total) || 0)}</td>
                            <td className="p-3 text-right tabular-nums text-green-600 font-medium">{formatCurrency(Number(sale.amountPaid) || 0)}</td>
                            <td className="p-3 text-right tabular-nums font-black text-blue-900">{formatCurrency(balance)}</td>
                        </tr>
                    );
                })}
                {sales.length === 0 && (
                    <tr><td colSpan={6} className="p-10 text-center italic opacity-30">No transaction records for this period.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Footer Contact */}
      <footer className="mt-auto pt-8 border-t border-gray-200 text-center">
         <p className="text-sm font-black italic uppercase tracking-tighter text-blue-900 mb-4">
            Thank You for Your Business!
         </p>
         <div className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {workspace?.website && <p>{workspace.website}</p>}
            <p>Phone: {workspace?.phone || 'N/A'} &bull; Email: {workspace?.email || 'N/A'}</p>
         </div>
      </footer>
    </div>
  );
}
