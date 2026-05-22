
'use client';

import type { Document as AppDocument, SaleItem } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function ReceiptPdf({ document: docSnapshot }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: cloudCompany } = useDoc(companyRef);

  if (!docSnapshot.data) {
    return <div className="p-4">Document data is missing.</div>;
  }

  const workspace = docSnapshot.data.workspace || cloudCompany;
  const data = docSnapshot.data;
  
  const customer = data.customer || {
    name: data.customerName || 'GENERAL WALK-IN CLIENT',
    phone: data.customerPhone || '',
    email: data.customerEmail || '',
    address: data.customerAddress || ''
  };

  const { items, paymentMethod, referenceCode, amount, amountPaid, changeDue, subtotal, totalDiscount, vat, createdBy, applyVat } = data;

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("en-KE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };
  
  const receiptNo = docSnapshot.title.split('#').pop() || docSnapshot.id.slice(0, 4).toUpperCase();
  const companyName = workspace?.name || 'SIMONSTYLESTECHNOLOGIES LIMITED';

  return (
    <div className="p-[15mm] font-sans text-[12px] bg-white text-black w-[210mm] min-h-[297mm] flex flex-col box-border border border-gray-100">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
           {workspace?.logoUrl ? (
            <img src={workspace.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed">LOGO</div>
          )}
          <div className="space-y-0.5">
             <h1 className="text-xl font-black text-primary uppercase leading-tight">{companyName}</h1>
             <p className="text-[9px] italic opacity-60">Let's Tech-it!</p>
          </div>
        </div>
        <div>
            <div className="bg-black text-white px-8 py-2 text-xl font-black uppercase tracking-widest">
                RECEIPT
            </div>
        </div>
      </div>

      {/* Bill To & Meta Info */}
      <div className="flex justify-between mb-8">
        <div className="space-y-1">
            <h3 className="font-black uppercase text-[13px] border-b border-black pb-0.5 mb-1 w-fit">RECEIVED FROM:</h3>
            <p className="font-black text-[14px] uppercase">{customer.name}</p>
            <p className="font-bold">{customer.email}</p>
            <p className="font-bold">{customer.phone}</p>
        </div>
        <div className="text-right space-y-1">
            <p className="font-bold"><span className="opacity-60">Receipt No:</span> {receiptNo}</p>
            <p className="font-bold"><span className="opacity-60">Date:</span> {format(new Date(docSnapshot.generatedDate), "MM/dd/yyyy")}</p>
            <p className="font-bold uppercase"><span className="opacity-60">Payment:</span> {paymentMethod}</p>
            {referenceCode && <p className="font-bold uppercase"><span className="opacity-60">Ref:</span> {referenceCode}</p>}
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b-2 border-black text-left">
                    <th className="py-2 font-black uppercase">DESCRIPTION OF GOODS/SERVICES</th>
                    <th className="py-2 px-2 text-center font-black uppercase w-16">QTY</th>
                    <th className="py-2 text-right font-black uppercase w-32">UNIT PRICE</th>
                    <th className="py-2 text-right font-black uppercase w-32">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: SaleItem, idx: number) => (
                    <tr key={idx} className="font-bold">
                        <td className="py-4 align-top pr-4">
                            <p className="leading-tight">{item.name}</p>
                            {item.serialNumber && item.serialNumber !== 'N/A' && <p className="text-[9px] font-mono opacity-50 mt-1 uppercase">S/N: {item.serialNumber}</p>}
                        </td>
                        <td className="py-4 align-top text-center">{item.quantity}</td>
                        <td className="py-4 align-top text-right">{formatCurrency(item.price)}</td>
                        <td className="py-4 align-top text-right">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                ))}
                {!items && (
                    <tr className="font-bold">
                        <td className="py-4 align-top">General Sales Transaction</td>
                        <td className="py-4 align-top text-center">1</td>
                        <td className="py-4 align-top text-right">{formatCurrency(amount)}</td>
                        <td className="py-4 align-top text-right">{formatCurrency(amount)}</td>
                    </tr>
                )}
                <tr>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                    <td className="border-b border-black border-dotted pt-4"></td>
                </tr>
            </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mt-4">
            <div className="w-[300px] space-y-1">
                <div className="flex justify-between items-center py-1">
                    <span className="font-black uppercase">SUB TOTAL</span>
                    <span className="font-black">KES. {formatCurrency(subtotal || amount)}</span>
                </div>
                {applyVat && (
                    <div className="flex justify-between items-center py-1">
                        <span className="font-black uppercase">VAT 16%</span>
                        <span className="font-black">KSH. {formatCurrency(vat || 0)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center bg-gray-50 p-2 border-y-2 border-black">
                    <span className="font-black text-sm uppercase">AMOUNT PAID</span>
                    <span className="font-black text-sm uppercase">Ksh.{formatCurrency(amountPaid || amount)}</span>
                </div>
                {changeDue > 0 && (
                    <div className="flex justify-between items-center py-1 italic opacity-60">
                        <span className="font-bold uppercase text-[10px]">Balance Returned</span>
                        <span className="font-bold text-[10px]">KSH. {formatCurrency(changeDue)}</span>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-12 text-center pt-8 border-t border-gray-100">
            <div className="inline-block border-4 border-double border-primary/20 px-8 py-3 rounded-xl mb-6">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">PAID IN FULL</h2>
            </div>
            <p className="font-bold">Thank you for your business!</p>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="mt-auto pt-10 text-center space-y-3">
         <div className="w-full h-px bg-gray-400 mb-2"></div>
         <p className="italic font-bold text-[11px] tracking-wide">
            Laptops Lease | Desktops | Laptops | Printers | Chargers | Memory etc | Sales & Services
         </p>
         <div className="text-[10px] space-y-1 opacity-80">
            <p className="font-black tracking-widest overflow-hidden h-2 leading-none">****************************************************************************************************************************************************************</p>
            <p className="font-bold">{workspace?.address || 'Nairobi, Kenya'}</p>
            <p className="font-bold">Tel: {workspace?.phone} E-mail: {workspace?.email} Web: {workspace?.website || 'www.royaltech.co.ke'}</p>
         </div>

         <div className="pt-6 text-[8px] font-bold opacity-40 uppercase flex justify-center gap-4">
            <span>Receipt Printed On: {format(new Date(), "PPPP | p")}</span>
            <span>&gt;&gt;Served By: {docSnapshot.createdBy?.name || 'System'}</span>
         </div>
      </footer>
    </div>
  );
}
