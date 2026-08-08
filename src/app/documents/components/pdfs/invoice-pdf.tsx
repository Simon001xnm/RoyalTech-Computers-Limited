'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';
import { numberToWords } from "@/lib/utils";

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
  
  const customer = data.customer || {
    name: data.customerName || 'VALUED CLIENT',
    alias: '',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || 'Nairobi, Kenya'
  };

  const { items, subtotal, total, amountPaid = 0, previousBalance = 0 } = data;
  
  // The Gross Total is the current order + whatever they owed before
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

  return (
    <div className="p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border selection:bg-blue-100">
      
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
            <p className="font-bold text-[10px] opacity-70">Official Tax Invoice / Statement</p>
          </div>
        </div>
        <div className="text-right space-y-1">
            <p className="font-black text-[10px] uppercase">Head Office</p>
            <p className="text-[9px] font-medium max-w-[200px] leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="text-[9px] font-bold">Tel: {workspace?.phone || '0701694469'}</p>
            <p className="text-[9px] font-bold">Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-blue-800">Invoice No: {invoiceNo}</p>
                <p className="text-[9px] font-bold">Date: {format(new Date(docSnapshot.generatedDate), "dd MMM yyyy")}</p>
            </div>
        </div>
      </header>

      {/* Remittance & Account Summary Header */}
      <div className="flex w-full mb-4 border border-black overflow-hidden rounded-sm">
        <div className="w-7/12 bg-gray-200 px-4 py-2 border-r border-black font-black uppercase text-[10px]">Remittance Advice</div>
        <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-[10px]">Account Summary</div>
      </div>

      <div className="text-[10px] leading-relaxed mb-6 grid grid-cols-12 gap-4">
        <div className="col-span-7">
            <p>To ensure proper credit, please enclose a copy of this statement with your payment and remit to: <span className="font-black uppercase">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</span></p>
            <p className="mt-2">Payment Due Date: <span className="font-black">{format(new Date(), "dd/MM/yyyy")}</span></p>
        </div>
        <div className="col-span-5 border-l border-black/10 pl-4">
             <p className="font-black text-xs">Total Balance Due:</p>
             <p className="text-xl font-black text-blue-900">KES {formatCurrency(totalAmountDue)}</p>
        </div>
      </div>

      {/* Bank & Payment Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 border-y border-black/10 py-6">
        <div className="space-y-1 text-[10px]">
          <h3 className="font-black text-blue-900 uppercase mb-2">Electronic Settlement Details</h3>
          <p className="font-black">BANK: DIAMOND TRUST BANK (DTB)</p>
          <p className="font-bold">NAME: {workspace?.name || 'MATESH TECHNOLOGIES'}</p>
          <p className="font-bold">ACC NO: 0084976001</p>
          <p className="font-bold">BRANCH: NAIROBI</p>
        </div>
        <div className="flex flex-col items-end justify-center">
            <div className="border-2 border-black p-4 min-w-[200px] text-center bg-gray-50 rounded-lg shadow-sm">
                <p className="text-[9px] font-black uppercase opacity-60">Current Amount Paid</p>
                <p className="text-xl font-black">KES {formatCurrency(amountPaid)}</p>
            </div>
        </div>
      </div>

      {/* Billing Addresses */}
      <div className="grid grid-cols-2 gap-10 mb-8 px-2">
        <div className="space-y-1">
            <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billing From</h3>
            <p className="font-black uppercase text-xs">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</p>
            <p className="opacity-70 leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
        </div>
        <div className="space-y-1">
            <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billing To</h3>
            <p className="font-black uppercase text-xs">{customer.alias || customer.name}</p>
            {customer.alias && <p className="text-[8px] font-bold opacity-50 uppercase">Attn: {customer.name}</p>}
            <p className="opacity-70 leading-tight">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="opacity-70 font-bold">{customer.phone}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                    <th className="p-3 font-black text-[9px] border border-blue-900">ITEM NO</th>
                    <th className="p-3 font-black text-[9px] border border-blue-900">DESCRIPTION</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-20">UNITS</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-28">UNIT PRICE</th>
                    <th className="p-3 text-right font-black text-[9px] border border-blue-900 w-32">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => {
                    const name = item.name || item.description;
                    const unitPrice = item.price || item.sellingPrice || item.unitPrice || 0;
                    const qty = item.quantity || 1;
                    return (
                        <tr key={idx} className="border-b border-gray-200">
                            <td className="p-3 font-medium text-center">{idx + 1}.</td>
                            <td className="p-3">
                                <p className="font-bold uppercase leading-normal">{name}</p>
                                {item.serialNumber && <p className="text-[8px] font-mono opacity-50 mt-0.5">S/N: {item.serialNumber}</p>}
                            </td>
                            <td className="p-3 text-right tabular-nums">{qty.toFixed(2)}</td>
                            <td className="p-3 text-right tabular-nums">{formatCurrency(unitPrice)}</td>
                            <td className="p-3 text-right tabular-nums font-bold">{formatCurrency(qty * unitPrice)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mt-6">
            <div className="w-[300px]">
                <div className="flex justify-between p-2 border border-gray-200">
                    <span className="font-black uppercase text-[9px] opacity-60">current order subtotal</span>
                    <span className="font-bold">{formatCurrency(currentTotal)}</span>
                </div>
                <div className="flex justify-between p-2 border border-t-0 border-gray-200 bg-orange-50">
                    <span className="font-black uppercase text-[9px] text-orange-600">previous account balance</span>
                    <span className="font-bold text-orange-700">{formatCurrency(previousBalance)}</span>
                </div>
                <div className="flex justify-between p-3 border border-t-0 border-black bg-blue-50">
                    <span className="font-black uppercase text-xs">net amount due</span>
                    <span className="font-black text-lg">{formatCurrency(totalAmountDue)}</span>
                </div>
            </div>
        </div>

        {/* Words Amount */}
        <p className="mt-4 text-[9px] font-black uppercase italic opacity-60">
            Amount in words: {numberToWords(totalAmountDue)}
        </p>
      </div>

      {/* Footer Contact */}
      <footer className="mt-auto pt-8 border-t border-gray-200 text-center">
         <div className="mb-6 space-y-1">
            <p className="text-[10px] font-bold">If you have any questions about this INVOICE, please contact,</p>
            <p className="text-[10px] font-black uppercase">{workspace?.createdBy?.name || 'Samuel Luyo'}</p>
            <p className="text-[10px] opacity-70">Nairobi, Kenya. Phone: {workspace?.phone || '0701694469'} Email: {workspace?.email || 'mateshtechltd@gmail.com'}</p>
         </div>
         <p className="text-sm font-black italic uppercase tracking-tighter text-blue-900">
            Thank You for Your Business!
         </p>
         <p className="text-[7px] text-gray-300 mt-4 uppercase tracking-[0.3em]">
            Electronically Generated &bull; Secured Node Sync
         </p>
      </footer>
    </div>
  );
}
