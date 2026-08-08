'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";

/**
 * @fileOverview Professional Thermal Receipt (80mm)
 * Optimized for POS printers. Generates two copies (Customer & Merchant).
 */
export function ThermalReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  if (!docSnapshot?.data) return <div className="p-4 text-center text-xs">Error: No Data</div>;

  const data = docSnapshot.data;
  const workspace = data.workspace;
  const items = data.items || [];
  const customer = data.customer || { name: 'Valued Client' };
  
  const subtotal = Number(data.subtotal || data.amount || 0);
  const vat = Number(data.vatAmount || data.vat || 0);
  const total = Number(data.total || (subtotal + vat));
  const paid = Number(data.amountPaid || total);
  const balance = Number(data.balance || 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 1 }).format(val);

  const ReceiptLayout = ({ title }: { title: string }) => (
    <div className="w-[80mm] p-4 bg-white text-black font-mono text-[10px] leading-tight flex flex-col items-center">
      {/* HEADER */}
      <div className="text-center space-y-1 mb-4 w-full">
        <p className="text-[8px] font-black uppercase opacity-40 mb-2">{title}</p>
        {workspace?.logoUrl && (
          <img src={workspace.logoUrl} alt="Logo" className="h-16 mx-auto mb-2 object-contain grayscale" crossOrigin="anonymous" />
        )}
        <h1 className="text-sm font-black uppercase leading-tight">{workspace?.name || 'OFFICIAL RECEIPT'}</h1>
        <p className="text-[9px] uppercase font-bold">{workspace?.address || 'Nairobi, Kenya'}</p>
        <div className="text-[8px] space-y-0.5 mt-1">
            {workspace?.phone && <p>TEL: {workspace.phone}</p>}
            {workspace?.email && <p>EMAIL: {workspace.email}</p>}
            {workspace?.website && <p>WEB: {workspace.website}</p>}
            {workspace?.taxPin && <p className="font-black pt-1">KRA PIN: {workspace.taxPin}</p>}
        </div>
      </div>

      <div className="w-full border-t border-dashed border-black my-2" />

      {/* TRANSACTION INFO */}
      <div className="w-full space-y-0.5 mb-4 text-[9px]">
        <div className="flex justify-between uppercase font-bold">
          <span>Receipt No:</span>
          <span>{docSnapshot.title?.split('#').pop() || '001'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(docSnapshot.generatedDate), "dd/MM/yy HH:mm")}</span>
        </div>
        <div className="flex justify-between">
          <span>Served By:</span>
          <span className="truncate max-w-[40mm]">{docSnapshot.createdBy?.name || 'Staff'}</span>
        </div>
        <div className="flex justify-between font-bold pt-1 border-t border-black/5 mt-1">
          <span>Client:</span>
          <span className="truncate max-w-[45mm]">{customer.name}</span>
        </div>
      </div>

      <div className="w-full border-t border-black my-2" />

      {/* ITEMS TABLE */}
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between font-black uppercase text-[8px] border-b pb-1">
          <span className="w-1/2">Description</span>
          <span className="w-1/4 text-center">Qty</span>
          <span className="w-1/4 text-right">Total</span>
        </div>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start pt-1">
            <div className="w-1/2 flex flex-col">
              <span className="uppercase font-bold text-[9px]">{item.name || item.description}</span>
              {item.serialNumber && <span className="text-[7px] opacity-70 font-mono">S/N: {item.serialNumber}</span>}
            </div>
            <span className="w-1/4 text-center">{item.quantity}</span>
            <span className="w-1/4 text-right">{formatCurrency((item.price || item.sellingPrice || 0) * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="w-full border-t border-dashed border-black my-2" />

      {/* TOTALS */}
      <div className="w-full space-y-1 mb-6">
        <div className="flex justify-between text-[9px]">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {vat > 0 && (
          <div className="flex justify-between text-[9px]">
            <span>VAT (16%):</span>
            <span>{formatCurrency(vat)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black pt-1">
          <span>TOTAL:</span>
          <span>KES {formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-black border-dotted mt-1">
          <span>Amount Paid:</span>
          <span>{formatCurrency(paid)}</span>
        </div>
        {balance > 0 && (
          <div className="flex justify-between font-bold text-red-600">
            <span>Balance Due:</span>
            <span>{formatCurrency(balance)}</span>
          </div>
        )}
      </div>

      <div className="text-center space-y-1 mb-4 w-full">
        <p className="font-bold uppercase text-[9px]">Payment Method: {data.paymentMethod || 'Cash'}</p>
        <p className="text-[8px] uppercase mt-4 italic opacity-60">Goods once sold cannot be returned</p>
        <p className="text-[9px] font-black mt-2">*** Thank You for Shopping ***</p>
      </div>

      <div className="w-full border-t border-dashed border-black pt-2 text-center text-[7px] opacity-40 uppercase tracking-widest">
        Generated via {workspace?.name || 'The Hub'} Node
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 gap-8">
        <div className="bg-white shadow-xl">
            <ReceiptLayout title="CUSTOMER COPY" />
        </div>
        
        {/* CUT LINE INDICATOR */}
        <div className="w-full border-t-2 border-black border-dashed relative my-4 no-print">
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-gray-100 px-3 text-[10px] font-black uppercase text-gray-400">Tear Here</span>
        </div>

        <div className="bg-white shadow-xl">
            <ReceiptLayout title="MERCHANT COPY" />
        </div>
    </div>
  );
}
