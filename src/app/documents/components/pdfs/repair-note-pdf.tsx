'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function RepairNotePdf({ document }: { document: AppDocument }) {
  const company = useLiveQuery(() => db.companies.toCollection().last());

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, details } = document.data;
  const companyName = company?.name || 'The Company';

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
              <p className="font-bold text-lg uppercase text-black">{companyName}</p>
              <p className="text-xs text-gray-500">{company?.address}</p>
              <p className="text-xs text-gray-500">Tel: {company?.phone} | E-mail: {company?.email}</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-semibold uppercase">Repair Note</h2>
        </div>
      </header>

      <section className="flex justify-between mt-6 mb-8">
        <div>
          <h3 className="font-bold mb-1">Customer Details:</h3>
          {customer ? (
            <>
              <p className="font-semibold">{customer.name}</p>
              <p>{customer.address || 'Address not specified'}</p>
              <p>{customer.email}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
          <p><span className="font-bold">Job No:</span> {document.title}</p>
          <p><span className="font-bold">Date:</span> {format(new Date(document.generatedDate), "PPP")}</p>
        </div>
      </section>
      
      <section className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-bold text-base mb-2">Equipment for Repair</h3>
        {laptop ? (
        <>
            <p><strong>Type:</strong> Laptop</p>
            <p><strong>Model:</strong> {laptop.model}</p>
            <p><strong>Serial Number:</strong> {laptop.serialNumber}</p>
        </>
        ) : <p>Laptop details not available.</p>}
      </section>

      <section className="mb-8">
        <h3 className="font-bold text-base mb-2">Reported Issue / Repair Details</h3>
        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded min-h-[150px]">
            {details || 'No specific issue details were provided.'}
        </p>
      </section>
      
      <section className="mt-8 text-xs text-gray-600">
        <h3 className="font-bold text-base mb-2 text-gray-800 border-b pb-1">Terms & Conditions</h3>
        <ul className="list-disc list-inside space-y-1">
            <li>An estimate for the repair will be provided before any work is carried out.</li>
            <li>The company is not responsible for any data loss. Please ensure your data is backed up.</li>
            <li>Repairs are guaranteed for a period of 90 days from the date of completion.</li>
        </ul>
      </section>

      <div className="flex-grow"></div>

      <section className="mt-12 flex justify-between items-end">
        <div className="w-1/2">
            <div className="border-b border-gray-400 mt-12 w-3/4"></div>
            <p className="text-xs mt-1 font-medium">Customer Signature</p>
        </div>
        <div className="text-right">
            <p className="font-bold uppercase">{companyName}</p>
            <p className="text-[9px] text-muted-foreground mt-4 uppercase">powered by simonstyless technologies limited</p>
        </div>
      </section>

       <footer className="text-center text-xs text-gray-400 border-t pt-4 mt-8">
        <p>We appreciate your patience while we service your device.</p>
      </footer>
    </div>
  );
}
