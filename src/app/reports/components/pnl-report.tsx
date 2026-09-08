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
 * Enhanced with deep padding and stable layout for overwriting prevention in PDF downloads.
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
      "flex justify-between py-3.5 border-b border-gray-100 min-h-[44px] items-center",
      isTotal ? 'font-black bg-gray-50/80 px-2' : 'font-medium',
      isHeader ? 'text-[11px] font-black mt-8 uppercase tracking-wider' : 'text-[10px]',
      isSubItem ? 'pl-6' : ''
    )}
    style={isHeader ? { color: primaryColor } : {}}
  >
    <div className="flex-1 uppercase tracking-tight">{label}</div>
    <div className="w-48 text-right font-mono">
      <span className="opacity-30 mr-2 text-[8px] font-sans">KES</span>
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
    <div className="p-[15mm] font-sans text-black bg-white w-[210mm] min-h-[297mm] flex flex-col box-border">
      
      {/* 1. BRANDED HEADER - Deep Spacing */}
      <header className="flex justify-between items-start mb-12 pb-8 border-b-2 border-black/10">
        <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>Profit & Loss</h1>
            <div className="space-y-1 text-[10px] font-bold text-black/60">
                <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest">Report Type</span> <span className="font-black text-black">OFFICIAL LEDGER ANALYSIS</span></p>
                <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest">Generated</span> <span className="font-black text-black">{format(new Date(), "MMM dd, yyyy HH:mm")}</span></p>
                {dateRange?.from && dateRange.to && (
                  <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-primary">Period</span> <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{format(dateRange.from, 'dd MMM yyyy')} — {format(dateRange.to, 'dd MMM yyyy')}</span></p>
                )}
            </div>
        </div>
        
        <div className="flex flex-col items-end">
           {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-32 w-auto object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-20 w-20 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300 uppercase">Logo</div>
          )}
        </div>
      </header>

      {/* 2. ENTITY INFORMATION BOX */}
      <section className="p-6 rounded-2xl space-y-1 mb-12 shadow-sm border border-indigo-100" style={{ backgroundColor: secondaryIndigo }}>
          <h3 className="font-black text-[9px] uppercase tracking-[0.2em] mb-2 opacity-50" style={{ color: primaryIndigo }}>Entity Identification</h3>
          <p className="font-black text-lg uppercase tracking-tight">{companyName}</p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
                <p className="text-[9px] font-bold text-black/50 uppercase">Address</p>
                <p className="text-[10px] font-medium">{company?.address || 'Kenya'}</p>
            </div>
            <div>
                <p className="text-[9px] font-bold text-black/50 uppercase">Contact</p>
                <p className="text-[10px] font-medium">{company?.email || company?.phone || 'N/A'}</p>
            </div>
          </div>
      </section>

      {/* 3. FINANCIAL SECTIONS - Deep Margin Bottoms to prevent Overlapping */}
      <div className="flex-grow space-y-12">
        
        {/* REVENUE SECTION */}
        <div className="block">
            <div className="text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-sm mb-4 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                <span>1. Revenue & Operating Income</span>
                <span className="opacity-60 text-[8px]">Primary Inflows</span>
            </div>
            <ReportRow label="Gross Sales Transactions" amount={operatingIncome.totalSales} />
            <ReportRow label="Total Operating Income" amount={operatingIncome.totalSales} isTotal />
        </div>

        {/* COGS SECTION */}
        <div className="block">
            <div className="text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-sm mb-4 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                <span>2. Cost of Sales (Direct Expenses)</span>
                <span className="opacity-60 text-[8px]">Inventory/Production Costs</span>
            </div>
            {Object.entries(costOfGoodsSold.cogsByCategory).length > 0 ? (
                Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                    <ReportRow key={category} label={category} amount={amount} isSubItem />
                ))
            ) : (
                <p className="text-[9px] italic opacity-40 px-4 py-3 border-b border-gray-100">No direct COGS recorded.</p>
            )}
            <ReportRow label="Total Cost of Goods Sold" amount={costOfGoodsSold.totalCogs} isTotal />
        </div>

        {/* GROSS PROFIT SECTION - Distinct block */}
        <div className="py-2 border-t-2 border-b-2 border-black/5 bg-gray-50/30">
            <ReportRow label="Gross Profit Margin" amount={grossProfit} isTotal primaryColor={primaryIndigo} />
        </div>
        
        {/* OPERATING EXPENSE SECTION */}
        <div className="block">
            <div className="text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-sm mb-4 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                <span>3. Indirect Operating Expenses</span>
                <span className="opacity-60 text-[8px]">Daily Overheads</span>
            </div>
            {Object.entries(operatingExpenses.expenseByCategory).length > 0 ? (
                Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                    <ReportRow key={category} label={category} amount={amount} isSubItem />
                ))
            ) : (
                <p className="text-[9px] italic opacity-40 px-4 py-3 border-b border-gray-100">No overhead expenses recorded.</p>
            )}
            <ReportRow label="Total Operating Expenses" amount={operatingExpenses.totalExpenses} isTotal />
        </div>

        {/* FINAL NET INCOME - Dynamic High Contrast Block */}
        <div className={cn(
          "mt-12 flex justify-between p-8 items-center rounded-2xl shadow-2xl border-4",
          isNegative ? "bg-red-600 border-red-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
        )}>
          <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Report Bottom Line</span>
              <p className="text-2xl font-black uppercase tracking-tighter">Net Income (Period Profit)</p>
          </div>
          <div className="text-right">
              <span className="text-[10px] block font-bold opacity-60 mb-1">FINAL BALANCE</span>
              <span className="text-4xl font-black tabular-nums tracking-tighter">
                {netIncome < 0 ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
              </span>
          </div>
        </div>
      </div>

      {/* FINANCIAL DEFINITIONS - Pushed to bottom */}
      <section className="mt-20 p-6 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: primaryIndigo }}>Financial Definitions</h4>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-black">Operating Income</p>
                  <p className="text-[9px] text-gray-500 leading-tight">Total revenue from primary shop sales before any deductions.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-black">Cost of Goods Sold</p>
                  <p className="text-[9px] text-gray-500 leading-tight">Direct acquisition costs for inventory units sold during this period.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-black">Operating Expenses</p>
                  <p className="text-[9px] text-gray-500 leading-tight">Daily shop running costs such as rent, transport, and staff wages.</p>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-black">Net Income</p>
                  <p className="text-[9px] text-gray-500 leading-tight">The actual money earned after all costs are subtracted from revenue.</p>
              </div>
          </div>
      </section>

      <footer className="mt-auto pt-10 text-center border-t border-gray-100">
         <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Internal Financial Intelligence Node
         </p>
      </footer>
    </div>
  );
}
