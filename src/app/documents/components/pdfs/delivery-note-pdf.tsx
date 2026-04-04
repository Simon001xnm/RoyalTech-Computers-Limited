
import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";

export function DeliveryNotePdf({ document }: { document: AppDocument }) {
  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, items, details, deliveredBy, receivedBy, delivererSignature, recipientSignature } = document.data;

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
        {/* Deliverer Side */}
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
                <p className="font-bold text-sm">{deliveredBy || 'RoyalTech Agent'}</p>
                <p className="text-[10px] text-gray-400 uppercase">Signature & Name</p>
            </div>
        </div>

        {/* Recipient Side */}
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

       <footer className="text-center text-[10px] text-gray-400 border-t pt-4 mt-16 flex justify-between">
        <p>White: Office Copy | Blue: Customer Copy | Yellow: Delivery Copy</p>
        <p>Thank you for choosing RoyalTech Computers Limited!</p>
      </footer>
    </div>
  );
}
