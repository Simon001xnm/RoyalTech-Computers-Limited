'use client';

import { format } from 'date-fns';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-Fidelity P&L Report
 * Redesigned to match the professional receipt/invoice aesthetic.
 */
interface PnlReportProps {
  data: PnlData;
  dateRange?: DateRange;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ReportRow = ({
  label,
  amount,
  isTotal = false,
  isHeader = false,
  isSubItem = false,
  primaryColor = "#7c3aed"
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
  isHeader?: boolean;
  isSubItem?: boolean;
  primaryColor?: string;
}) => (
  <div
    className={cn(
      "flex justify-between py-2 border-b border-gray-100",
      isTotal ? 'font-black bg-gray-50' : 'font-medium',
      isHeader ? 'text-[11px] font-black mt-4 uppercase tracking-wider' : 'text-[10px]',
      isSubItem ? 'pl-4' : ''
    )}
    style={isHeader ? { color: primaryColor } : {}}
  >
    <div className="flex-1">{label}</div>
    <div className="w-48 text-right">
      <span className="opacity-40 mr-2 text-[8px]">KES</span>
      {formatCurrency(amount)}
    </div>
  </div>
);

export function PnlReport({ data, dateRange }: PnlReportProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const { operatingIncome, costOfGoodsSold, operatingExpenses, grossProfit, netIncome } = data;

  const primaryIndigo = "#7c3aed";
  const secondaryIndigo = "#f5f3ff";
  const companyName = company?.name || 'YOUR BUSINESS';
  const isNegative = netIncome < 0;

  return (
    <div className="p-[12mm] font-sans text-black bg-white w-[210mm] min-h-[297mm] flex flex-col box-border selection:bg-indigo-100">
      
      {/* Header - Consistent with Receipts */}
      <header className="flex justify-between items-start mb-8">
        <div className="space-y-3">
            <h1 className="text-3xl font-medium tracking-tight" style={{ color: primaryIndigo }}>Profit & Loss</h1>
            <div className="space-y-0.5 text-[10px] font-medium text-black">
                <p><span className="w-24 inline-block opacity-60">Report Type</span> <span className="font-bold">Standard Ledger</span></p>
                <p><span className="w-24 inline-block opacity-60">Generated At</span> <span className="font-bold">{format(new Date(), "MMM dd, yyyy HH:mm")}</span></p>
                {dateRange?.from && dateRange.to && (
                  <p><span className="w-24 inline-block opacity-60">Reporting Period</span> <span className="font-bold text-primary">{format(dateRange.from, 'dd MMM yy')} — {format(dateRange.to, 'dd MMM yy')}</span></p>
                )}
            </div>
        </div>
        
        <div className="flex flex-col items-end">
           {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300 uppercase">Logo</div>
          )}
        </div>
      </header>

      {/* Summary Wash Box */}
      <section className="p-4 rounded-lg space-y-0.5 mb-8" style={{ backgroundColor: secondaryIndigo }}>
          <h3 className="font-medium text-[12px] mb-1" style={{ color: primaryIndigo }}>Entity Information</h3>
          <p className="font-bold text-xs uppercase">{companyName}</p>
          <p className="text-[10px] font-medium text-black/70">{company?.address || 'Kenya'}</p>
          <p className="text-[10px] font-medium text-black/70">{company?.email}</p>
      </section>

      <div className="flex-grow">
        {/* REVENUE SECTION */}
        <div className="mb-6">
            <h2 className="text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-sm mb-2" style={{ backgroundColor: primaryIndigo }}>1. Revenue & Operating Income</h2>
            <ReportRow label="Gross Sales Transactions" amount={operatingIncome.totalSales} />
            <ReportRow label="Total Operating Income" amount={operatingIncome.totalSales} isTotal />
        </div>

        {/* COGS SECTION */}
        <div className="mb-6">
            <h2 className="text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-sm mb-2" style={{ backgroundColor: primaryIndigo }}>2. Cost of Sales (Direct Expenses)</h2>
            {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                <ReportRow key={category} label={category} amount={amount} isSubItem />
            ))}
            <ReportRow label="Total Cost of Goods Sold" amount={costOfGoodsSold.totalCogs} isTotal />
        </div>

        {/* GROSS PROFIT SECTION */}
        <div className="mb-6 border-y-2 border-black py-1">
            <ReportRow label="Gross Profit Margin" amount={grossProfit} isTotal primaryColor={primaryIndigo} />
        </div>
        
        {/* OPERATING EXPENSE SECTION */}
        <div className="mb-8">
            <h2 className="text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-sm mb-2" style={{ backgroundColor: primaryIndigo }}>3. Indirect Operating Expenses</h2>
            {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                <ReportRow key={category} label={category} amount={amount} isSubItem />
            ))}
            {Object.keys(operatingExpenses.expenseByCategory).length === 0 && (
                 <p className="text-[9px] italic opacity-40 px-4 py-2">No indirect expenses recorded in this period.</p>
            )}
            <ReportRow label="Total Operating Expenses" amount={operatingExpenses.totalExpenses} isTotal />
        </div>

        {/* FINAL NET INCOME - High Contrast Block */}
        <div className={cn(
          "mt-8 flex justify-between p-5 items-center rounded-lg shadow-xl",
          isNegative ? "bg-red-600 text-white" : "bg-green-600 text-white"
        )}>
          <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bottom Line Result</span>
              <p className="text-xl font-black uppercase tracking-tighter">Net Income (Total Profit)</p>
          </div>
          <div className="text-right">
              <span className="text-[10px] block opacity-60">KES</span>
              <span className="text-3xl font-black tabular-nums">{formatCurrency(netIncome)}</span>
          </div>
        </div>
      </div>

      {/* FINANCIAL DEFINITIONS */}
      <section className="mt-12 p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryIndigo }}>Financial Glossary & Explanations</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase">Operating Income</p>
                  <p className="text-[9px] text-gray-500 leading-tight">Total revenue generated from your primary business activities and sales before any costs are deducted.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase">Cost of Goods Sold (COGS)</p>
                  <p className="text-[9px] text-gray-500 leading-tight">The direct costs involved in purchasing or manufacturing the inventory and items you sold during this period.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase">Operating Expenses</p>
                  <p className="text-[9px] text-gray-500 leading-tight">The daily running costs of the business not directly tied to production, such as rent, salaries, and marketing.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase">Net Income</p>
                  <p className="text-[9px] text-gray-500 leading-tight">The final profit remaining after all direct and indirect expenses have been subtracted from your total revenue.</p>
              </div>
          </div>
      </section>

      <footer className="mt-auto pt-8 text-center">
         <p className="text-[10px] font-black uppercase text-black tracking-tight mb-2">
            Official Financial Intelligence Document
         </p>
         <p className="text-[9px] font-medium text-black mb-4">
            For any enquiry, reach out via <span className="font-bold">{company?.phone || company?.email}</span>
         </p>
         <p className="text-[8px] font-medium text-gray-400">
            © 2026 ShopManager Suite • Powered by simonstyless technologies limited
         </p>
      </footer>
    </div>
  );
}
