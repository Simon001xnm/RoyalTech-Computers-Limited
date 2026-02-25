
import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";

export function LeaseAgreementPdf({ document }: { document: AppDocument }) {
  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, lease } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-900 w-full">
      <header className="text-center mb-8">
        <img src="/picture1.png" alt="Company Logo" className="h-28 w-auto object-contain mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">Lease Agreement</h1>
        <p className="text-gray-500 mt-1">Document No: {document.title}</p>
      </header>

      <section className="mb-6">
        <p className="leading-relaxed">
          This Lease Agreement ("Agreement") is made and entered into on{" "}
          <strong>{format(new Date(document.generatedDate), "PPP")}</strong>, by and between:
        </p>
      </section>

      <section className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold text-base mb-2 border-b pb-1">LESSOR</h2>
          <p className="font-semibold">RoyalTech Computers Limited</p>
          <p>Revlon Professional Plaza, 2nd Floor, Suite 1</p>
          <p>Biashara Street, Nairobi</p>
          <p>info@royaltech.co.ke | +254 724404935</p>
        </div>
        <div>
          <h2 className="font-bold text-base mb-2 border-b pb-1">LESSEE</h2>
          {customer ? (
            <>
              <p className="font-semibold">{customer.name}</p>
              <p>{customer.address || "Address not specified"}</p>
              <p>{customer.email}</p>
              <p>{customer.phone || "Phone not specified"}</p>
            </>
          ) : <p>Customer details not available.</p>}
        </div>
      </section>
      
      {lease && customer && laptop ? (
        <>
            <section className="mb-6">
                <p>The Lessor agrees to lease to the Lessee, and the Lessee agrees to lease from the Lessor, the following equipment ("Equipment"):</p>
            </section>
            
            <section className="mb-8 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-bold text-base mb-2">1. Leased Equipment</h3>
                <p><strong>Type:</strong> Laptop</p>
                <p><strong>Model:</strong> {laptop.model}</p>
                <p><strong>Serial Number:</strong> {laptop.serialNumber}</p>
                {laptop.specifications && <p><strong>Specifications:</strong> {laptop.specifications.processor}, {laptop.specifications.ram}, {laptop.specifications.storage}</p>}
            </section>

            <section className="mb-8 space-y-4">
                <div>
                    <h3 className="font-bold text-base mb-1">2. Lease Term</h3>
                    <p>The lease term shall commence on <strong>{format(new Date(lease.startDate), "PPP")}</strong> and shall continue until <strong>{format(new Date(lease.endDate), "PPP")}</strong>.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-base mb-1">3. Lease Payments</h3>
                    <p>The Lessee shall pay the Lessor a monthly rent of <strong>{formatCurrency(lease.monthlyPayment || 0)}</strong>. Payments are due on the first day of each month.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-base mb-1">4. Ownership</h3>
                    <p>The Equipment is and shall remain the exclusive property of the Lessor. The Lessee shall have no right, title, or interest in the Equipment except as expressly set forth in this Agreement.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-base mb-1">5. Condition and Repair</h3>
                    <p>The Lessee agrees to keep the Equipment in good repair and condition. Any damage beyond normal wear and tear shall be the responsibility of the Lessee.</p>
                </div>
            </section>

            <section className="mt-16">
                 <p className="text-xs text-gray-600 mb-8">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.</p>
                <div className="flex justify-between items-end gap-8">
                    <div className="w-1/2">
                        <h4 className="font-bold">LESSOR:</h4>
                        <div className="border-b border-gray-400 mt-16"></div>
                        <p className="text-xs mt-1">RoyalTech</p>
                    </div>
                    <div className="w-1/2">
                        <h4 className="font-bold">LESSEE:</h4>
                        <div className="border-b border-gray-400 mt-16"></div>
                        <p className="text-xs mt-1">{customer.name}</p>
                    </div>
                </div>
            </section>
        </>
      ) : (
        <p className="text-center py-8 bg-gray-100 rounded-md">Full lease, customer, and laptop details are required to generate the agreement.</p>
      )}


      <footer className="text-center text-xs text-gray-400 border-t pt-4 mt-16">
        <p>This is a legally binding document.</p>
      </footer>
    </div>
  );
}
