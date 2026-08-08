'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from "@/components/saas/saas-provider";

/**
 * @fileOverview Professional Thermal Receipt (80mm)
 * Optimized for POS printers. High-density branded layout.
 * Strictly uses 'Official Business Name' from settings.
 */
export function ThermalReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  // Secondary source: Live company profile if snapshot is missing details
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: liveCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-4 text-center text-xs">Error: No Data</div>;

  const data = docSnapshot.data;
  // Use archived workspace data, fallback to live company data if archived is missing
  const workspace = data.workspace || liveCompany;
  const items = data.items || [];
  const customer = data.customer || { name: data.customerName || 'Valued Client' };
  
  const subtotal = Number(data.subtotal || data.amount || 0);
  const vat = Number(data.vatAmount || data.vat || 0);
  const total = Number(data.total || (subtotal + vat));
  const paid = Number(data.amountPaid || total);
  const balance = Number(data.balance || 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const bizName = workspace?.name || liveCompany?.name || 'OFFICIAL BUSINESS';

  return (
    <div className="flex flex-col items-center bg-white p-0">
      <div className="w-[80mm] p-6 bg-white text-black font-sans text-[10px] leading-relaxed flex flex-col items-center min-h-fit">
        
        {/* BRANDED HEADER - HIGHEST PRIORITY */}
        <div className="text-center space-y-1 mb-6 w-full">
          <h1 className="text-xl font-black uppercase leading-none mb-2 tracking-tighter">
            {bizName}
          </h1>
          <p className="text-[11px] font-black tracking-[0.2em] border-y-2 border-black py-1.5 mb-3">OFFICIAL RECEIPT</p>
          
          <div className="text-[9px] uppercase font-bold space-y-1 opacity-80">
              <p className="leading-tight">{workspace?.address || 'Nairobi, Kenya'}</p>
              {workspace?.phone && <p>Tel: {workspace.phone}</p>}
              {workspace?.email && <p className="lowercase">Email: {workspace.email}</p>}
              {workspace?.website && <p className="lowercase">{workspace.website}</p>}
              {workspace?.taxPin && <p className="font-black pt-1 border-t border-dashed border-black/20 mt-1">KRA PIN: {workspace.taxPin}</p>}
          </div>
        </div>

        <div className="w-full border-t border-black my-4" />

        {/* TRANSACTION INFO - ENHANCED PADDING */}
        <div className="w-full space-y-4 mb-6 text-[10px]">
          <div className="flex justify-between items-baseline py-1">
            <span className="font-bold opacity-60">Receipt No:</span>
            <span className="font-black text-xs">#{docSnapshot.title?.split('#').pop() || '001'}</span>
          </div>
          <div className="flex justify-between items-baseline py-1">
            <span className="font-bold opacity-60">Date:</span>
            <span className="font-bold">{format(new Date(docSnapshot.generatedDate), "dd/MM/yy HH:mm")}</span>
          </div>
          
          <div className="pt-3 border-t border-black/20 space-y-3">
            <div className="flex justify-between items-start gap-4">
                <span className="opacity-60 whitespace-nowrap font-black uppercase text-[8px]">Served By:</span>
                <span className="font-black uppercase text-right leading-tight flex-1">
                    {docSnapshot.createdBy?.name || 'Staff Member'}
                </span>
            </div>
            <div className="flex justify-between items-start gap-4">
                <span className="opacity-60 whitespace-nowrap font-black uppercase text-[8px]">Customer:</span>
                <span className="font-black uppercase text-right leading-tight flex-1">
                    {customer.name}
                </span>
            </div>
          </div>
        </div>

        <div className="w-full border-t-2 border-black my-2" />

        {/* ITEMS TABLE - DYNAMIC FLOW */}
        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between font-black uppercase text-[8px] border-b border-black pb-1">
            <span className="w-1/2">Description</span>
            <span className="w-1/4 text-center">Qty</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-start pt-1 pb-1 border-b border-gray-50 last:border-0">
              <div className="w-1/2 flex flex-col">
                <span className="uppercase font-bold text-[9px] leading-tight">{item.name || item.description}</span>
                {item.serialNumber && <span className="text-[7px] opacity-70 font-mono mt-1">S/N: {item.serialNumber}</span>}
              </div>
              <span className="w-1/4 text-center font-bold">{item.quantity}</span>
              <span className="w-1/4 text-right font-black">{formatCurrency((item.sellingPrice || item.price || 0) * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* TOTALS & TAX */}
        <div className="w-full space-y-2 mb-8 bg-gray-50 p-3 rounded-lg border border-black/5">
          <div className="flex justify-between text-[10px]">
            <span className="uppercase font-bold">Subtotal:</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>
          {vat > 0 && (
            <div className="flex justify-between text-[10px]">
              <span className="uppercase font-bold">VAT (16%):</span>
              <span className="font-bold">{formatCurrency(vat)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black pt-2 border-t border-black/10 mt-1">
            <span className="uppercase">Net Total:</span>
            <span>KES {formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-black border-dotted mt-2">
            <span className="font-black uppercase text-[9px]">Amount Paid:</span>
            <span className="font-black text-xs text-green-700">KES {formatCurrency(paid)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between font-black text-red-600 pt-1">
              <span className="uppercase">Balance Due:</span>
              <span>KES {formatCurrency(balance)}</span>
            </div>
          )}
        </div>

        {/* FOOTER & SETTLEMENT */}
        <div className="text-center space-y-4 mb-6 w-full">
          <div className="py-2 border-y border-dashed border-black/20">
            <p className="text-[8px] font-black uppercase opacity-40 mb-1">Settlement Method</p>
            <p className="font-black uppercase text-[10px]">{data.paymentMethod || 'Settled'}</p>
          </div>
          
          <div className="space-y-1">
              <p className="text-[9px] uppercase font-black tracking-tighter">*** THANK YOU FOR YOUR BUSINESS ***</p>
              <p className="text-[8px] uppercase italic opacity-60 leading-tight">"Goods once sold cannot be returned"</p>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-black pt-4 text-center text-[7px] opacity-40 uppercase tracking-[0.3em]">
          Electronic Node: {bizName}
        </div>
      </div>
    </div>
  );
}
