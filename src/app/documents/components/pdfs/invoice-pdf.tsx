
import type { Document as AppDocument, DocumentLineItem } from "@/types";
import { format } from "date-fns";

const VAT_RATE = 0.16;

export function InvoicePdf({ document }: { document: AppDocument }) {
  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, items, details, subtotal, vat, total, applyVat, invoiceType, leaseDetails } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const isLease = invoiceType === 'lease' && leaseDetails;

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-800 w-full">
      {/* Header */}
      <header className="flex justify-between items-start pb-4">
        <div className="flex items-center gap-4">
          <img src="/picture1.png" alt="Company Logo" className="h-28 w-auto object-contain" />
          <div>
              <h1 className="text-2xl font-bold text-black">ROYALTECH</h1>
              <p className="text-xs text-gray-600 mt-1">Revlon Professional Plaza, 2nd Floor, Suite 1, Biashara Street, Nairobi</p>
              <p className="text-xs text-gray-500">Tel: +254 724404935 | E-mail: info@royaltech.co.ke | Web: www.royaltech.co.ke</p>
          </div>
        </div>
        <div className="text-right">
            <h2 className="text-4xl font-light uppercase text-gray-700">Invoice</h2>
        </div>
      </header>

      <div className="border-t border-gray-300 mb-8"></div>

      {/* Bill To & Invoice Info */}
      <section className="flex justify-between mt-8 mb-10">
        <div>
          <h3 className="font-semibold text-gray-500 mb-2">Bill To:</h3>
          {customer ? (
            <>
              <p className="font-medium">{customer.name}</p>
              <p>{customer.address || 'Nairobi, Kenya'}</p>
              <p>{customer.email}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
        <div className="text-right">
           <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
             <span className="font-semibold text-gray-600">Invoice No:</span>
             <span className="text-gray-800">{document.title}</span>
             <span className="font-semibold text-gray-600">Date:</span>
             <span className="text-gray-800">{format(new Date(document.generatedDate), "PPP")}</span>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section>
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="p-2 font-semibold text-sm">Description</th>
              <th className="p-2 font-semibold text-sm text-right w-24">Quantity</th>
              <th className="p-2 font-semibold text-sm text-right w-32">{isLease ? 'Lease Terms' : 'Unit Price'}</th>
              <th className="p-2 font-semibold text-sm text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLease ? (
                 <tr className="border-b bg-gray-50">
                    <td className="p-3 text-sm">{leaseDetails.description}</td>
                    <td className="p-3 text-right text-sm">{leaseDetails.quantity}</td>
                    <td className="p-3 text-right text-sm">{`${leaseDetails.duration} ${leaseDetails.durationUnit} @ ${formatCurrency(leaseDetails.rate)}`}</td>
                    <td className="p-3 text-right font-medium text-sm">{formatCurrency(subtotal || 0)}</td>
                </tr>
            ) : items && items.length > 0 ? (
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
      
      {/* Notes & Totals */}
      <section className="flex justify-between mt-6 items-start">
         <div className="w-1/2 mt-8">
            {details && (
                <>
                    <h3 className="font-semibold text-gray-800 mb-1">Notes:</h3>
                    <p className="text-xs text-gray-600">{details}</p>
                </>
            )}
         </div>
        <div className="w-full max-w-xs mt-4">
             <div className="flex justify-between py-1 text-sm">
                <span className="font-semibold text-gray-600">Subtotal:</span>
                <span className="text-right font-medium">{formatCurrency(subtotal || 0)}</span>
            </div>
             {applyVat && <div className="flex justify-between py-1 text-sm">
                <span className="font-semibold text-gray-600">VAT ({(VAT_RATE * 100).toFixed(0)}%):</span>
                <span className="text-right font-medium">{formatCurrency(vat || 0)}</span>
            </div>}
            <div className="flex justify-between font-bold text-base py-2 mt-2 border-t border-gray-300">
                <span>Total Due:</span>
                <span className="text-right">{formatCurrency(total || 0)}</span>
            </div>
        </div>
      </section>
      
      {/* Spacer to push footer down */}
      <div className="flex-grow min-h-[50px]"></div>

      {/* Footer */}
      <footer className="text-xs text-gray-700 border-t-2 border-gray-300 pt-6 mt-10 space-y-5">
        <div>
            <h4 className="font-bold text-xs uppercase text-gray-800 mb-2">Other Comments</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Total payment on due date.</li>
                <li>Payment via MPESA, Bank or Cash.</li>
                <li>All cheques addressed to ROYALTECH COMPUTERS LIMITED.</li>
            </ol>
        </div>

        <div>
            <h4 className="font-bold text-xs uppercase text-gray-800 mb-2">Payment Details</h4>
            <div className="flex justify-between">
                <div>
                    <p><span className="font-semibold">BANK:</span> KENYA COMMERCIAL BANK</p>
                    <p><span className="font-semibold">ACC NAME:</span> ROYALTECH COMPUTERS LIMITED.</p>
                    <p><span className="font-semibold">ACC NO:</span> 1286805015</p>
                </div>
                 <div className="text-right">
                    <p><span className="font-semibold">BRANCH:</span> KCB Gardens Plaza</p>
                    <p><span className="font-semibold">Bank Code:</span> 01290</p>
                </div>
            </div>
        </div>

        <div className="text-center font-semibold text-gray-600 pt-4">
            <p>Thank you for your business!</p>
            <p>Should you have any question please contact: 0724 404 935</p>
        </div>
      </footer>
    </div>
  );
}
