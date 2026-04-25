'use client';

import type { Document as AppDocument } from "@/types";
import { format } from "date-fns";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useSaaS } from '@/components/saas/saas-provider';

export function LeaseAgreementPdf({ document }: { document: AppDocument }) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  if (!document.data) {
    return <div className="p-4">Document data is missing.</div>;
  }
  const { customer, laptop, lease, signature } = document.data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const companyName = company?.name || 'The Company';

  return (
    <div className="p-8 font-sans text-sm bg-white text-gray-900 w-full flex flex-col min-h-[1000px]">
      <header className="text-center mb-8">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain mx-auto mb-4" />
        ) : (
          <div className="h-20 w-full flex items-center justify-center text-muted-foreground italic mb-4">Logo not set</div>
        )}
        <h1 className="text-3xl font-bold text-gray-800 uppercase">{companyName}</h1>
        <h2 className="text-xl font-semibold text-gray-600">Lease Agreement</h2>
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
          <p className="font-semibold">{companyName}</p>
          <p>{company?.address || 'Address not specified'}</p>
          <p>{company?.email || 'Email not specified'}</p>
          <p>{company?.phone || 'Phone not specified'}</p>
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
                        <p className="text-xs mt-1 uppercase">{companyName}</p>
                    </div>
                    <div className="w-1/2">
                        <h4 className="font-bold">LESSEE:</h4>
                        {signature ? (
                            <div className="h-20 flex items-center justify-center mb-2">
                                <img src={signature} alt="Customer Signature" className="max-h-full w-auto" />
                            </div>
                        ) : (
                            <div className="border-b border-gray-400 mt-16"></div>
                        )}
                        <p className="text-xs mt-1">{customer.name}</p>
                    </div>
                </div>
            </section>
        </>
      ) : (
        <p className="text-center py-8 bg-gray-100 rounded-md">Full lease, customer, and laptop details are required to generate the agreement.</p>
      )}

      <div className="flex-grow"></div>

      <footer className="text-center text-[10px] text-gray-400 border-t pt-4 mt-16 flex flex-col gap-1">
        <p>This is a legally binding document.</p>
        <p className="uppercase">powered by simonstyless technologies limited</p>
      </footer>
    </div>
  );
}