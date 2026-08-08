'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from "@/components/saas/saas-provider";

/**
 * @fileOverview Professional Thermal Receipt (80mm)
 * Optimized for POS printers with authentic monospaced typography.
 * Strictly uses 'Official Business Name' from settings.
 */
export function ThermalReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  // Connect to live company profile to ensure branding is always fresh
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: liveCompany } = useDoc(companyRef);

  if (!docSnapshot?.data) return <div className="p-4 text-center text-xs font-mono">ERROR: DATA_NODE_MISSING</div>;

  const data = docSnapshot.data;
  const workspace = data.workspace || liveCompany;
  const items = data.items || [];
  const customer = data.customer || { name: data.customerName || 'VALUED CLIENT' };
  
  const subtotal = Number(data.subtotal || data.amount || 0);
  const vat = Number(data.vatAmount || data.vat || 0);
  const total = Number(data.total || (subtotal + vat));
  const paid = Number(data.amountPaid || total);
  const balance = Number(data.balance || 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const bizName = workspace?.name || liveCompany?.name || 'OFFICIAL BUSINESS';

  return (
    <div className="flex flex-col items-center bg-white p-0 overflow-visible">
      <div className="w-[80mm] p-4 bg-white text-black font-mono text-[10px] leading-tight flex flex-col items-center min-h-fit">
        
        {/* BRANDED HEADER - POS STYLE */}
        <div className="text-center space-y-2 mb-2 w-full">
          <h1 className="text-lg font-black uppercase leading-tight tracking-tighter pb-1">
            {bizName}
          </h1>
          
          <p className="text-[11px] font-black py-1">*** OFFICIAL RECEIPT ***</p>
          
          <div className="text-[9px] uppercase space-y-1 opacity-90 pb-2">
              <p className="font-bold">NAIROBI, KENYA</p>
              {workspace?.address && <p>{workspace.address}</p>}
              {workspace?.phone && <p>TEL: {workspace.phone}</p>}
              {workspace?.email && <p className="lowercase">EMAIL: {workspace.email}</p>}
              {workspace?.website && <p className="lowercase">{workspace.website}</p>}
              {workspace?.taxPin && <p className="font-black pt-1">KRA PIN: {workspace.taxPin}</p>}
          </div>
        </div>

        {/* SECTION SEPARATOR */}
        <div className="w-full border-t border-black border-dashed my-2" />

        {/* TRANSACTION METADATA */}
        <div className="w-full space-y-3 mb-4 text-[9px]">
          <div className="flex justify-between items-center py-0.5">
            <span className="font-bold">RCPT NO:</span>
            <span className="font-black">#{docSnapshot.title?.split('#').pop() || '001'}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="font-bold">DATE:</span>
            <span>{format(new Date(docSnapshot.generatedDate), "dd/MM/yy HH:mm")}</span>
          </div>
          
          <div className="pt-2 border-t border-black border-dotted space-y-2">
            <div className="flex justify-between items-start gap-4 py-1.5">
                <span className="font-bold uppercase text-[8px] whitespace-nowrap pt-0.5">SERVED BY:</span>
                <span className="font-black uppercase text-right leading-tight flex-1">
                    {docSnapshot.createdBy?.name || 'STAFF'}
                </span>
            </div>
            <div className="flex justify-between items-start gap-4 py-1.5">
                <span className="font-bold uppercase text-[8px] whitespace-nowrap pt-0.5">CUSTOMER:</span>
                <span className="font-black uppercase text-right leading-tight flex-1">
                    {customer.name}
                </span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-black my-1" />

        {/* ITEMS LIST */}
        <div className="w-full space-y-3 mb-6">
          <div className="flex justify-between font-black uppercase text-[8px] border-b border-black pb-1">
            <span className="w-1/2">DESC</span>
            <span className="w-1/4 text-center">QTY</span>
            <span className="w-1/4 text-right">TOTAL</span>
          </div>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-start border-b border-gray-100 border-dotted pb-2 last:border-0">
              <div className="w-1/2 flex flex-col pr-1">
                <span className="uppercase font-bold text-[9px] leading-tight">{item.name || item.description}</span>
                {item.serialNumber && <span className="text-[7px] opacity-70 font-mono">S/N: {item.serialNumber}</span>}
              </div>
              <span className="w-1/4 text-center">{item.quantity}</span>
              <span className="w-1/4 text-right font-bold">{formatCurrency((item.sellingPrice || item.price || 0) * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* TOTALS BLOCK */}
        <div className="w-full space-y-2 mb-6 border-t border-black pt-2">
          <div className="flex justify-between py-0.5">
            <span className="uppercase">SUBTOTAL:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {vat > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="uppercase">VAT (16%):</span>
              <span>{formatCurrency(vat)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black pt-2 border-t border-black border-double mt-1">
            <span className="uppercase">TOTAL KES:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-black border-dotted">
            <span className="uppercase text-[9px] pt-1">PAID:</span>
            <span className="font-black text-[12px]">{formatCurrency(paid)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between font-black text-red-600 pt-1">
              <span className="uppercase">BALANCE DUE:</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          )}
        </div>

        {/* SETTLEMENT & FOOTER */}
        <div className="text-center space-y-4 mb-4 w-full">
          <div className="py-2 border-y border-black border-dotted">
            <p className="text-[8px] font-bold uppercase opacity-60 mb-1">METHOD OF SETTLEMENT</p>
            <p className="font-black uppercase text-[10px]">{data.paymentMethod || 'CASH'}</p>
          </div>
          
          <div className="space-y-1.5 pt-2">
              <p className="text-[10px] font-black">*** THANK YOU ***</p>
              <p className="text-[8px] italic opacity-70 uppercase leading-normal">Goods once sold cannot be returned</p>
          </div>
        </div>

        <div className="w-full border-t border-black border-dashed pt-3 text-center text-[7px] opacity-40 uppercase tracking-widest">
          ELECTRONIC NODE: {bizName}
        </div>
      </div>
    </div>
  );
}
