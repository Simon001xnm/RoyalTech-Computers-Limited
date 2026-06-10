'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * @fileOverview High-Fidelity P&L Report
 * Complies with BusinessHub SaaS High-Contrast PDF Standards.
 */
interface PnlReportProps {
  data: PnlData;
  dateRange?: DateRange;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ReportRow = ({
  label,
  code,
  amount,
  isTotal = false,
  isHeader = false,
  isSubItem = false,
  isGrossProfit = false,
}: {
  label: string;
  code?: string | number;
  amount?: number;
  isTotal?: boolean;
  isHeader?: boolean;
  isSubItem?: boolean;
  isGrossProfit?: boolean;
}) => (
  <div
    className={`flex justify-between py-2 border-b-2 border-black ${
      isTotal ? 'font-black' : 'font-bold'
    } ${isHeader ? 'text-lg font-black mt-6 border-b-4' : 'text-sm'} ${
      isSubItem ? 'pl-6' : ''
    } ${isGrossProfit ? 'bg-black text-white px-2 py-4' : 'text-black'}`}
  >
    <div className="flex-1 uppercase">{label}</div>
    <div className="w-24 text-center">{code}</div>
    <div className="w-48 text-right">
      {amount !== undefined ? formatCurrency(amount) : ''}
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

  const companyName = company?.name || 'YOUR BUSINESS';

  return (
    <div id="pnl-report" className="p-[20mm] font-sans text-black bg-white w-[210mm] min-h-[297mm] flex flex-col box-border border-4 border-black">
      <header className="text-center mb-12">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain mx-auto mb-6" crossOrigin="anonymous" />
        ) : (
          <div className="h-20 w-40 border-4 border-black flex items-center justify-center font-black mx-auto mb-6">LOGO</div>
        )}
        <h1 className="text-3xl font-black uppercase text-black tracking-tighter">{companyName}</h1>
        <p className="text-2xl font-bold text-black mt-2">PROFIT AND LOSS STATEMENT</p>
        <div className="h-1 w-20 bg-black mx-auto mt-4"></div>
        {dateRange?.from && dateRange.to && (
          <p className="text-sm font-black text-black mt-4 uppercase tracking-widest">
            PERIOD: {format(dateRange.from, 'dd MMM yyyy')} — {format(dateRange.to, 'dd MMM yyyy')}
          </p>
        )}
      </header>

      <div className="flex-grow">
        <div className="flex justify-between font-black text-xs text-black pb-2 border-b-4 border-black uppercase tracking-widest">
          <div className="flex-1">Account Category</div>
          <div className="w-24 text-center">Code</div>
          <div className="w-48 text-right">Balance (KES)</div>
        </div>

        {/* Operating Income */}
        <ReportRow label="Operating Income" isHeader />
        <ReportRow label="Gross Sales" code={200} amount={operatingIncome.totalSales} isSubItem />
        <ReportRow
          label="Total Operating Income"
          amount={operatingIncome.totalSales}
          isTotal
        />

        {/* Cost of Goods Sold */}
        <ReportRow label="Cost of Goods Sold" isHeader />
        {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
            <ReportRow key={category} label={category} amount={amount} isSubItem />
        ))}
        <ReportRow
          label="Total Cost of Goods Sold"
          amount={costOfGoodsSold.totalCogs}
          isTotal
        />

        {/* Gross Profit */}
        <div className="mt-8">
            <ReportRow label="Gross Profit (Margin)" amount={grossProfit} isTotal isGrossProfit />
        </div>
        
        {/* Operating Expense */}
        <ReportRow label="Operating Expenses" isHeader />
        {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
            <ReportRow key={category} label={category} amount={amount} isSubItem />
        ))}
         <ReportRow
          label="Total Operating Expenses"
          amount={operatingExpenses.totalExpenses}
          isTotal
        />

        {/* Net Income */}
        <div className="mt-12 flex justify-between bg-black text-white p-6 items-center">
          <span className="text-xl font-black uppercase tracking-tighter">Net Income (Final Profit)</span>
          <span className="text-2xl font-black">{formatCurrency(netIncome)}</span>
        </div>
      </div>

      <footer className="mt-20 pt-8 border-t-4 border-black text-center">
          <p className="text-[10px] font-black text-black uppercase tracking-[0.5em]">
              OFFICIAL AUDIT DOCUMENT • BUSINESS INTELLIGENCE NODE
          </p>
          <p className="text-[8px] font-bold text-black mt-2">
            Generated on: {format(new Date(), "PPPP p")}
          </p>
      </footer>
    </div>
  );
}