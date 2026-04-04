
import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";

export function DeliveryNotePdf({ document }: { document: AppDocument }) {
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
            <h2 className="text-xl font-semibold uppercase">Delivery Note</h2>
        </div>
      </header>

      <section className="flex justify-between mt-6 mb-8">
        <div>
          <h3 className="font-bold mb-1">Deliver To:</h3>
          {customer ? (
            <>
              <p>{customer.name}</p>
              <p>{customer.address || 'Address not specified'}</p>
              <p>{customer.email}</p>
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
              <th className="p-2 font-bold">Serial Number</th>
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
            <h3 className="font-bold mb-1">Notes:</h3>
            <p className="text-xs text-gray-600">{details}</p>
        </section>
      )}

      <section className="mt-16">
        <p className="mb-2">Received in good condition by:</p>
        <div className="flex justify-between items-end">
            <div className="w-2/5">
                <div className="border-b border-gray-400 mt-12"></div>
                <p className="text-xs text-center mt-1">Recipient's Signature</p>
            </div>
            <div className="w-2/5">
                <div className="border-b border-gray-400 mt-12"></div>
                <p className="text-xs text-center mt-1">Date</p>
            </div>
        </div>
      </section>

       <footer className="text-center text-xs text-gray-400 border-t pt-4 mt-16">
        <p>Thank you for your business!</p>
      </footer>
    </div>
  );
}
