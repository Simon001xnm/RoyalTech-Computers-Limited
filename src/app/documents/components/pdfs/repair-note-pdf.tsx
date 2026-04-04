
import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";

export function RepairNotePdf({ document }: { document: AppDocument }) {
  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, details } = document.data;

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-900 w-full">
      <header className="flex justify-between items-start pb-4 border-b">
        <div className="flex items-center gap-4">
          <img src="/picture1.png" alt="Company Logo" className="h-28 w-auto object-contain" />
          <div>
              <p className="font-bold text-lg uppercase text-black">ROYALTECH COMPUTERS LIMITED</p>
              <p className="text-xs text-gray-500">Revlon Professional Plaza, 2nd Floor, Suite 1, Biashara Street, Nairobi</p>
              <p className="text-xs text-gray-500">Tel: +254 724404935 | E-mail: info@royaltech.co.ke</p>
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
              <p>{customer.name}</p>
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
        <p className="text-gray-700 leading-relaxed">
            {details || 'No specific issue details were provided.'}
        </p>
      </section>
      
      <section className="mt-16 text-xs text-gray-600">
        <h3 className="font-bold text-base mb-2 text-gray-800">Terms & Conditions</h3>
        <ul className="list-disc list-inside space-y-1">
            <li>An estimate for the repair will be provided before any work is carried out.</li>
            <li>RoyalTech is not responsible for any data loss. Please ensure your data is backed up.</li>
            <li>Repairs are guaranteed for a period of 90 days from the date of completion.</li>
        </ul>
      </section>

      <section className="mt-12">
        <div className="border-b border-gray-400 mt-12 w-1/2"></div>
        <p className="text-xs mt-1">Customer Signature</p>
      </section>

       <footer className="text-center text-xs text-gray-400 border-t pt-4 mt-16">
        <p>We appreciate your patience while we service your device.</p>
      </footer>
    </div>
  );
}
