'use client';

import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function LpoPdf({ document }: { document: AppDocument }) {
  const company = useLiveQuery(() => db.companies.toCollection().last());

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { supplier, items, subtotal, total, notes } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const companyName = company?.name || 'The Company';

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-800 w-full min-h-[1000px] flex flex-col">
      <header className="flex justify-between items-start pb-4">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" />
          ) : (
            <div className="h-28 w-28 bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
              <h1 className="text-2xl font-bold text-black uppercase">{companyName}</h1>
              <p className="text-xs text-gray-600 mt-1">{company?.address}</p>
              <p className="text-xs text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-4xl font-light uppercase text-gray-700">Purchase Order</h2>
        </div>
      </header>

      <div className="border-t border-gray-300 mb-8"></div>

      <section className="flex justify-between mt-8 mb-10">
        <div>
          <h3 className="font-semibold text-gray-500 mb-2">Vendor/Supplier:</h3>
          {supplier ? (
            <>
              <p className="font-medium">{supplier.name}</p>
              <p>{supplier.address || 'Address not available'}</p>
              <p>{supplier.email}</p>
            </>
          ) : <p>Supplier details not available.</p>}
        </div>
        <div className="text-right">
           <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
             <span className="font-semibold text-gray-600">LPO No:</span>
             <span className="text-gray-800">{document.title}</span>
             <span className="font-semibold text-gray-600">Date:</span>
             <span className="text-gray-800">{format(new Date(document.generatedDate), "PPP")}</span>
          </div>
        </div>
      </section>

      <section>
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="p-2 font-semibold text-sm">Item Description</th>
              <th className="p-2 font-semibold text-sm text-right w-24">Quantity</th>
              <th className="p-2 font-semibold text-sm text-right w-32">Unit Price</th>
              <th className="p-2 font-semibold text-sm text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item: DocumentLineItem, index: number) => (
              <tr key={index} className="border-b bg-gray-50">
                <td className="p-3 text-sm">{item.description}</td>
                <td className="p-3 text-right text-sm">{item.quantity}</td>
                <td className="p-3 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="p-3 text-right font-medium text-sm">{formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
              ))
            ) : (
                <tr className="border-b">
                    <td colSpan={4} className="p-3 text-center text-gray-500">No items available.</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      <section className="flex justify-end mt-6 items-start">
        <div className="w-full max-w-xs mt-4">
             <div className="flex justify-between py-1 text-sm">
                <span className="font-semibold text-gray-600">Subtotal:</span>
                <span className="text-right font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-base py-2 mt-2 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-right">{formatCurrency(total)}</span>
            </div>
        </div>
      </section>

       {notes && (
        <section className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-1">Notes:</h3>
            <p className="text-xs text-gray-600">{notes}</p>
        </section>
      )}

      <div className="flex-grow min-h-[100px]"></div>

      <footer className="text-xs text-gray-700 border-t-2 border-gray-300 pt-6 mt-10">
        <p className="mb-8">This Purchase Order is subject to the terms and conditions agreed upon between {companyName} and the supplier.</p>
        <div className="flex justify-between items-center">
            <div className="w-2/5">
                <div className="border-b border-gray-400 mt-12"></div>
                <p className="text-xs text-center mt-1">Authorized Signature</p>
                <p className="text-xs text-center mt-1 font-semibold uppercase">{companyName}</p>
            </div>
             <div className="text-right">
                <p>Thank you for your business!</p>
                <p className="text-[10px] text-muted-foreground mt-4 uppercase">powered by simonstyless technologies limited</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
