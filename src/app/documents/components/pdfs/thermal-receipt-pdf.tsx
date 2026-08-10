'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from "@/components/saas/saas-provider";

/**
 * @fileOverview Professional Thermal Receipt (80mm)
 * Enhanced with Account Balance tracking.
 */
export function ThermalReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
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
  
  // CALCULATIONS
  const subtotal = Number(data.subtotal || data.amount || 0);
  const vat = Number(data.vatAmount || data.vat || 0);
  const todayTotal = Number(data.total || (subtotal + vat));
  
  // FIX: Ensure 0 is handled correctly
  const amountPaidToday = data.amountPaid !== undefined ? Number(data.amountPaid) : todayTotal;
  const balanceToday = Math.max(0, todayTotal - amountPaidToday);
  const previousBalance = Number(data.previousBalance || 0);
  const totalAccountBalance = balanceToday + previousBalance;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const bizName = workspace?.name || liveCompany?.name || 'OFFICIAL BUSINESS';

  return (
    <div className="flex flex-col items-center bg-white p-0 overflow-visible">
      <div className="w-[80mm] p-4 bg-white text-black font-mono text-[10px] leading-tight flex flex-col items-center min-h-fit">
        
        {/* BRANDED HEADER */}
        <div className="text-center space-y-2 mb-2 w-full">
          <h1 className="text-lg font-black uppercase leading-tight tracking-tighter pb-1">
            {bizName}
          </h1>
          <p className="text-[11px] font-black">*** OFFICIAL RECEIPT ***</p>
          <div className="text-[9px] uppercase space-y-1 opacity-90 pb-2">
              {workspace?.address && <p>{workspace.address}</p>}
              {workspace?.phone && <p>TEL: {workspace.phone}</p>}
              {workspace?.taxPin && <p className="font-black pt-1">KRA PIN: {workspace.taxPin}</p>}
          </div>
        </div>

        <div className="w-full border-t border-black border-dashed my-2" />

        {/* METADATA */}
        <div className="w-full space-y-2 mb-4 text-[9px]">
          <div className="flex justify-between py-0.5">
            <span className="font-bold">RCPT NO:</span>
            <span className="font-black">#{docSnapshot.title?.split('#').pop() || '001'}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="font-bold">DATE:</span>
            <span>{format(new Date(docSnapshot.generatedDate), "dd/MM/yy HH:mm")}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="font-bold">CUSTOMER:</span>
            <span className="font-black uppercase">{customer.name}</span>
          </div>
        </div>

        <div className="w-full border-t border-black my-1" />

        {/* ITEMS */}
        <div className="w-full space-y-3 mb-6">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-start border-b border-gray-100 border-dotted pb-2 last:border-0">
              <div className="w-1/2 flex flex-col">
                <span className="uppercase font-bold text-[9px]">{item.name || item.description}</span>
                {item.serialNumber && <span className="text-[7px] opacity-70 font-mono">S/N: {item.serialNumber}</span>}
              </div>
              <span className="w-1/4 text-center">{item.quantity}</span>
              <span className="w-1/4 text-right font-bold">{formatCurrency((item.sellingPrice || item.price || 0) * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="w-full space-y-2 mb-4 border-t border-black pt-2">
          <div className="flex justify-between py-0.5">
            <span className="uppercase">TOTAL TODAY:</span>
            <span className="font-black">{formatCurrency(todayTotal)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-t border-black border-dotted pt-1">
            <span className="uppercase">PAID TODAY:</span>
            <span className="font-black">{formatCurrency(amountPaidToday)}</span>
          </div>
        </div>

        {/* STATEMENT SECTION */}
        <div className="w-full p-2 bg-gray-50 border border-black/10 rounded-sm space-y-1.5 mb-6">
          <p className="text-[8px] font-black uppercase text-center opacity-60">Account Statement Summary</p>
          <div className="flex justify-between text-[9px]">
            <span>Brought Forward:</span>
            <span>{formatCurrency(previousBalance)}</span>
          </div>
          {balanceToday > 0 && (
            <div className="flex justify-between text-[9px] text-red-600 font-bold">
              <span>Unpaid Today:</span>
              <span>{formatCurrency(balanceToday)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] font-black border-t border-black/20 pt-1">
            <span>NET TOTAL DUE:</span>
            <span>KES {formatCurrency(totalAccountBalance)}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center space-y-3 mb-2 w-full">
          <p className="text-[9px] font-black">*** THANK YOU ***</p>
          <div className="text-[8px] uppercase space-y-1 opacity-80">
            {workspace?.website && <p>{workspace.website}</p>}
            <p>TEL: {workspace?.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="w-full border-t border-black border-dashed pt-3 text-center text-[7px] opacity-40 uppercase tracking-widest">
          {bizName}
        </div>
      </div>
    </div>
  );
}
