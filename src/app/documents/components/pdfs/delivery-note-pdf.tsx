'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSaaS } from '@/components/saas/saas-provider';

export function DeliveryNotePdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  
  // SECURE QUERY: Filter by active tenantId to prevent cross-account leakage
  const company = useLiveQuery(
    async () => tenant?.id ? await db.companies.get(tenant.id) : null,
    [tenant?.id]
  );

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, items, details, deliveredBy, receivedBy, delivererSignature, recipientSignature } = document.data;

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-900 w-full min-h-[1000px] flex flex-col">
      <header className="flex justify-between items-start pb-4 border-b">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" />
          ) : (
            <div className="h-28 w-28 bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase font-bold border">No Logo</div>
          )}
          <div>
              <p className="font-bold text-lg uppercase text-black">{company?.name || 'Your Company'}</p>
              <p className="text-xs text-gray-500">{company?.address}</p>
              <p className="text-xs text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-semibold uppercase">Delivery Note</h2>
        </div>
      </header>

      <section className="flex justify-between mt-6 mb-8">
        <div>
          <h3 className="font-bold mb-1">Deliver To:</h3>
          {customer ? (
            <>
              <p className="font-semibold">{customer.name}</p>
              <p>{customer.address || 'Address not specified'}</p>
              <p>{customer.email}</p>
              <p>{customer.phone || 'Phone not specified'}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
          <p><span className="font-bold">Document No:</span> {document.title}</p>
          <p><span className="font-bold">Date:</span> {format(new Date(document.generatedDate), "PPP")}</p>
        </div>
      </section>

      <section>
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 font-bold">Item Description</th>
              <th className="p-2 font-bold">Serial Number / Details</th>
              <th className="p-2 font-bold text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {laptop ? (
              <tr className="border-b">
                <td className="p-2">{laptop.model}</td>
                <td className="p-2">{laptop.serialNumber}</td>
                <td className="p-2 text-center">1</td>
              </tr>
            ) : items && items.length > 0 ? (
                items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2">{item.serialNumber || 'N/A'}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                    </tr>
                ))
            ) : (
                 <tr className="border-b">
                    <td colSpan={3} className="p-2 text-center text-gray-500">No item details available.</td>
                </tr>
            )}
          </tbody>
        </table>
      </section>
      
      {details && (
        <section className="mt-6">
            <h3 className="font-bold mb-1 text-xs text-gray-500 uppercase">Special Instructions / Notes:</h3>
            <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">{details}</p>
        </section>
      )}

      <section className="mt-16 grid grid-cols-2 gap-12">
        <div className="space-y-4">
            <h4 className="font-bold border-b pb-1 text-xs uppercase text-gray-500">Delivered By:</h4>
            <div className="h-24 flex flex-col justify-end">
                {delivererSignature ? (
                    <img src={delivererSignature} alt="Deliverer Signature" className="max-h-full w-auto object-contain mx-auto" />
                ) : (
                    <div className="border-b border-gray-300 w-full mb-2"></div>
                )}
            </div>
            <div className="text-center">
                <p className="font-bold text-sm">{deliveredBy || 'Authorized Agent'}</p>
                <p className="text-[10px] text-gray-400 uppercase">Signature & Name</p>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="font-bold border-b pb-1 text-xs uppercase text-gray-500">Received In Good Condition By:</h4>
            <div className="h-24 flex flex-col justify-end">
                {recipientSignature ? (
                    <img src={recipientSignature} alt="Recipient Signature" className="max-h-full w-auto object-contain mx-auto" />
                ) : (
                    <div className="border-b border-gray-300 w-full mb-2"></div>
                )}
            </div>
            <div className="text-center">
                <p className="font-bold text-sm">{receivedBy || customer?.name || 'Authorized Recipient'}</p>
                <p className="text-[10px] text-gray-400 uppercase">Signature & Name</p>
            </div>
        </div>
      </section>

      <div className="flex-grow"></div>

       <footer className="text-center text-[10px] text-gray-400 border-t pt-4 mt-16 flex flex-col items-center gap-2">
        <div className="flex justify-between w-full">
            <p>White: Office Copy | Blue: Customer Copy | Yellow: Delivery Copy</p>
            <p>Thank you for choosing us!</p>
        </div>
        <div className="text-[10px] text-muted-foreground pt-2 border-t w-full">
            powered by simonstyless technologies limited
        </div>
      </footer>
    </div>
  );
}
