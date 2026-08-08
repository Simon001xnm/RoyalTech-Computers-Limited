
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

  const { items, subtotal, total, amountPaid = 0, balance = 0, previousBalance = 0 } = data;
  
  // The Gross Total is the current order + whatever they owed before
  const totalAmountDue = (total || 0) + previousBalance;

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

  const primaryBlue = "#1e3a8a"; // Dark blue for headers
  const lightBlue = "#dbeafe";
  const lightGray = "#f3f4f6";

  return (
    <div className="p-[12mm] font-sans text-[11px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border selection:bg-blue-100">
      
      {/* Remittance & Account Summary Header */}
      <div className="flex w-full mb-4 border border-black">
        <div className="w-7/12 bg-gray-200 px-4 py-2 border-r border-black font-black uppercase text-[10px]">Remittance</div>
        <div className="w-5/12 bg-blue-100 px-4 py-2 font-black uppercase text-[10px]">Account Summary</div>
      </div>

      <div className="text-[10px] leading-relaxed mb-6">
        <p>To ensure proper credit, please enclose a copy of this statement <span className="font-black text-xs">Balance Due: {formatCurrency(totalAmountDue)}</span> with your check and remit to: <span className="font-black uppercase">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</span></p>
        <p className="mt-1">Payment Due Date: <span className="font-bold">{format(new Date(), "dd/MM/yyyy")}</span></p>
      </div>

      {/* Bank & Payment Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-6">
        <div className="space-y-1 text-[10px]">
          <p className="font-black">BANK; DIAMOND TRUST BANK (DTB)</p>
          <p className="font-bold">NAME: {workspace?.name || 'MATESH TECHNOLOGIES'}</p>
          <p className="font-bold">ACC NO: 0084976001</p>
          <p className="font-bold">CONTACT: {workspace?.phone || '0701694469'}</p>
        </div>
        <div className="flex flex-col items-end justify-center">
            <div className="border-2 border-black p-4 min-w-[200px] text-center bg-gray-50">
                <p className="text-[9px] font-black uppercase opacity-60">Amount Enclosed</p>
                <p className="text-xl font-black">{formatCurrency(amountPaid)}</p>
            </div>
        </div>
      </div>

      {/* Billing Addresses */}
      <div className="grid grid-cols-2 gap-10 mb-8">
        <div>
            <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billed By</h3>
            <p className="font-black uppercase">{workspace?.name || 'MATESH TECHNOLOGIES LTD'}</p>
            <p className="opacity-70">{workspace?.address || 'Nairobi, Kenya'}</p>
        </div>
        <div>
            <h3 className="text-[9px] font-black uppercase text-blue-900 mb-1">Billed To</h3>
            <p className="font-black uppercase">{customer.alias || customer.name}</p>
            {customer.alias && <p className="text-[8px] font-bold opacity-50 uppercase">Attn: {customer.name}</p>}
            <p className="opacity-70">{customer.address || 'Nairobi, Kenya'}</p>
            <p className="opacity-70">{customer.phone}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                    <th className="p-2 font-black text-[9px] border border-blue-900">ITEM NO</th>
                    <th className="p-2 font-black text-[9px] border border-blue-900">DESCRIPTION</th>
                    <th className="p-2 text-right font-black text-[9px] border border-blue-900 w-20">UNITS</th>
                    <th className="p-2 text-right font-black text-[9px] border border-blue-900 w-28">UNIT PRICE</th>
                    <th className="p-2 text-right font-black text-[9px] border border-blue-900 w-32">AMOUNT</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, idx: number) => {
                    const name = item.name || item.description;
                    const unitPrice = item.price || item.sellingPrice || item.unitPrice || 0;
                    const qty = item.quantity || 1;
                    return (
                        <tr key={idx} className="border-b border-gray-200 h-10">
                            <td className="px-2 font-medium text-center">{idx + 1}.</td>
                            <td className="px-2">
                                <p className="font-bold uppercase">{name}</p>
                                {item.serialNumber && <p className="text-[8px] font-mono opacity-50">S/N: {item.serialNumber}</p>}
                            </td>
                            <td className="px-2 text-right tabular-nums">{qty.toFixed(2)}</td>
                            <td className="px-2 text-right tabular-nums">{formatCurrency(unitPrice)}</td>
                            <td className="px-2 text-right tabular-nums font-bold">{formatCurrency(qty * unitPrice)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mt-6">
            <div className="w-[300px]">
                <div className="flex justify-between p-2 border border-gray-200">
                    <span className="font-black uppercase text-[9px] opacity-60">subtotal</span>
                    <span className="font-bold">{formatCurrency(subtotal || total)}</span>
                </div>
                <div className="flex justify-between p-2 border border-t-0 border-gray-200 bg-gray-50">
                    <span className="font-black uppercase text-[9px] opacity-60">PREV BAL</span>
                    <span className="font-bold">{formatCurrency(previousBalance)}</span>
                </div>
                <div className="flex justify-between p-3 border border-t-0 border-black bg-blue-50">
                    <span className="font-black uppercase text-xs">TOTAL</span>
                    <span className="font-black text-lg">{formatCurrency(totalAmountDue)}</span>
                </div>
            </div>
        </div>

        {/* Words Amount */}
        <p className="mt-4 text-[9px] font-black uppercase italic opacity-60">
            Total Amount (in words): {numberToWords(totalAmountDue)}
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
            Powered by ShopManager Suite &bull; Secured Node Sync
         </p>
      </footer>
    </div>
  );
}
