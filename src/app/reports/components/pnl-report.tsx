
'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';

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
    className={`flex justify-between py-2 border-b ${
      isTotal ? 'font-bold' : ''
    } ${isHeader ? 'text-lg font-semibold mt-4' : 'text-sm'} ${
      isSubItem ? 'pl-4' : ''
    } ${isGrossProfit ? 'border-t border-black pt-2' : 'border-gray-200'}`}
  >
    <div className="flex-1">{label}</div>
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
    <Card id="pnl-report" className="print-container shadow-lg bg-white text-gray-900 border-none">
      <CardHeader className="text-center p-8">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain mx-auto mb-4" />
        ) : (
          <div className="h-20 flex items-center justify-center text-muted-foreground italic mb-4">Company Logo</div>
        )}
        <h1 className="text-2xl font-bold uppercase">{companyName}</h1>
        <p className="text-xl">Profit and Loss Statement</p>
        <p className="text-sm text-muted-foreground">Basis: Accrual</p>
        {dateRange?.from && dateRange.to && (
          <p className="text-sm text-muted-foreground">
            From {format(dateRange.from, 'dd/MM/yyyy')} To{' '}
            {format(dateRange.to, 'dd/MM/yyyy')}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex justify-between font-bold text-sm text-muted-foreground pb-2 border-b-2 border-black">
          <div className="flex-1">Account</div>
          <div className="w-24 text-center">Account Code</div>
          <div className="w-48 text-right">Total</div>
        </div>

        {/* Operating Income */}
        <ReportRow label="Operating Income" isHeader />
        <ReportRow label="Sales" code={200} amount={operatingIncome.totalSales} isSubItem />
        <ReportRow
          label="Total for Operating Income"
          code={200}
          amount={operatingIncome.totalSales}
          isTotal
        />

        {/* Cost of Goods Sold */}
        <ReportRow label="Cost of Goods Sold" isHeader />
        {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
            <ReportRow key={category} label={category} amount={amount} isSubItem />
        ))}
        <ReportRow
          label="Total for Cost of Goods Sold"
          code={300}
          amount={costOfGoodsSold.totalCogs}
          isTotal
        />

        {/* Gross Profit */}
        <ReportRow label="Gross Profit" amount={grossProfit} isTotal isGrossProfit />
        
        {/* Operating Expense */}
        <ReportRow label="Operating Expense" isHeader />
        {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
            <ReportRow key={category} label={category} amount={amount} isSubItem />
        ))}
         <ReportRow
          label="Total Operating Expense"
          amount={operatingExpenses.totalExpenses}
          isTotal
        />


        {/* Net Income */}
        <div className="flex justify-between font-bold text-base py-2 border-t-2 border-black mt-4">
          <span>Net Income</span>
          <span className="text-right">{formatCurrency(netIncome)}</span>
        </div>

        <div className="mt-12 pt-4 border-t text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                powered by simonstyless technologies limited
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
