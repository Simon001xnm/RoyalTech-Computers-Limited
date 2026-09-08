'use client';

import { format, parseISO } from 'date-fns';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-Fidelity P&L and Statement Report
 * Implements Page 1 (P&L Summary) and Page 2 (Detailed Transaction Statement).
 * Optimized for professional A4 pagination.
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
      "flex justify-between py-2 border-b border-gray-100 min-h-[36px] items-center",
      isTotal ? 'font-black bg-gray-50/80 px-2 mt-1' : 'font-medium',
      isHeader ? 'text-[11px] font-black mt-6 uppercase tracking-wider' : 'text-[10px]',
      isSubItem ? 'pl-6' : ''
    )}
    style={isHeader ? { color: primaryColor } : {}}
  >
    <div className="flex-1 uppercase tracking-tight truncate">{label}</div>
    <div className="w-48 text-right font-mono">
      <span className="opacity-30 mr-2 text-[8px] font-sans">KES</span>
      {formatCurrency(amount)}
    </div>
  </div>
);

const ITEMS_PER_PAGE_STATEMENT = 24;

export function PnlReport({ data, dateRange }: PnlReportProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const { operatingIncome, costOfGoodsSold, operatingExpenses, netIncome, sales, expenses } = data;

  const primaryIndigo = "#7c3aed";
  const secondaryIndigo = "#f5f3ff";
  const companyName = company?.name || 'YOUR BUSINESS';
  const isNegative = netIncome < 0;

  // Combine sales and expenses for a unified ledger
  const unifiedLedger = [
      ...sales.map(s => ({ ...s, ledgerType: 'INCOME', label: s.customerName || 'Sale' })),
      ...expenses.map(e => ({ ...e, ledgerType: 'EXPENSE', label: e.category || 'Shop Expense' }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Statement Pagination
  const statementPages: any[][] = [];
  let currentItems = [...unifiedLedger];
  while (currentItems.length > 0) {
      statementPages.push(currentItems.slice(0, ITEMS_PER_PAGE_STATEMENT));
      currentItems = currentItems.slice(ITEMS_PER_PAGE_STATEMENT);
  }

  return (
    <div className="flex flex-col items-center gap-10">
      
      {/* PAGE 1: PROFIT & LOSS SUMMARY */}
      <div className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden">
        <header className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black/10">
            <div className="space-y-3">
                <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="space-y-1 text-[9px] font-bold text-black/60">
                    <p><span className="w-20 inline-block opacity-40 uppercase tracking-widest">Type</span> <span className="font-black text-black">SUMMARIZED STATEMENT</span></p>
                    <p><span className="w-20 inline-block opacity-40 uppercase tracking-widest">Period</span> <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yyyy') : '--'}</span></p>
                </div>
            </div>
            <div className="flex flex-col items-end">
            {company?.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
            ) : (
                <div className="h-12 w-12 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">Logo</div>
            )}
            </div>
        </header>

        <section className="p-4 rounded-xl space-y-1 mb-6 border border-indigo-100" style={{ backgroundColor: secondaryIndigo }}>
            <p className="font-black text-sm uppercase tracking-tight">{companyName}</p>
            <p className="text-[9px] font-medium opacity-60 leading-tight">{company?.address || 'Kenya'} &bull; {company?.email || 'N/A'}</p>
        </section>

        <div className="flex-grow">
            <div className="mb-6">
                <div className="text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-sm mb-1 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>1. Operating Income</span>
                    <span className="opacity-60 text-[7px]">Gross Revenue</span>
                </div>
                <ReportRow label="Total Shop Sales" amount={operatingIncome.totalSales} />
                <ReportRow label="Total Revenue" amount={operatingIncome.totalSales} isTotal />
            </div>

            <div className="mb-6">
                <div className="text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-sm mb-1 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>2. Direct Costs (COGS)</span>
                    <span className="opacity-60 text-[7px]">Stock Costs</span>
                </div>
                {Object.entries(costOfGoodsSold.cogsByCategory).length > 0 ? (
                    Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount} isSubItem />
                    ))
                ) : (
                    <p className="text-[9px] italic opacity-40 px-4 py-1.5">No direct costs recorded.</p>
                )}
                <ReportRow label="Total COGS" amount={costOfGoodsSold.totalCogs} isTotal />
            </div>

            <div className="mb-6">
                <div className="text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-sm mb-1 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>3. Indirect Operating Expenses</span>
                    <span className="opacity-60 text-[7px]">Overheads</span>
                </div>
                {Object.entries(operatingExpenses.expenseByCategory).length > 0 ? (
                    Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount} isSubItem />
                    ))
                ) : (
                    <p className="text-[9px] italic opacity-40 px-4 py-1.5">No overheads recorded.</p>
                )}
                <ReportRow label="Total Operating Expenses" amount={operatingExpenses.totalExpenses} isTotal />
            </div>

            <div className={cn(
                "mt-10 flex justify-between p-5 items-center rounded-xl border-4",
                isNegative ? "bg-red-600 border-red-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
            )}>
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Reporting Bottom Line</span>
                    <p className="text-lg font-black uppercase tracking-tighter">Net Profit for Period</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black tracking-tighter">
                        {netIncome < 0 ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                    </span>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-4 text-center border-t border-gray-100">
            <div className="flex justify-between items-center">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Profit & Loss Statement &bull; Generated by Workspace Node</p>
                <p className="text-[9px] font-black">PAGE 1 OF {statementPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* PAGE 2+: DETAILED TRANSACTION STATEMENT */}
      {statementPages.map((pageItems, pageIdx) => (
          <div key={pageIdx} className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden">
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-black/5">
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-gray-400">Transaction Audit Statement</h2>
                    <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Audit Ledger History</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase">{companyName}</p>
                    <p className="text-[8px] font-bold opacity-40">Period Analysis Continued</p>
                </div>
            </header>

            <div className="flex-grow">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left bg-gray-50 border-b border-black/5">
                            <th className="p-3 font-black text-[9px] uppercase tracking-widest w-24">DATE</th>
                            <th className="p-3 font-black text-[9px] uppercase tracking-widest">TRANSACTION / CLIENT</th>
                            <th className="p-3 font-black text-[9px] uppercase tracking-widest w-24">TYPE</th>
                            <th className="p-3 text-right font-black text-[9px] uppercase tracking-widest w-32">AMOUNT (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((item: any) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={item.id} className="border-b border-gray-50">
                                    <td className="p-3 font-mono text-[9px] opacity-70">
                                        {format(parseISO(item.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="p-3">
                                        <p className="font-bold text-[10px] uppercase truncate max-w-[280px]">
                                            {item.label}
                                        </p>
                                        <p className="text-[8px] font-mono opacity-40 truncate uppercase">REF: {item.id.slice(0, 12)}</p>
                                    </td>
                                    <td className="p-3">
                                        <span className={cn(
                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                            isIncome ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                        )}>
                                            {item.ledgerType}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "p-3 text-right font-black text-[10px] tabular-nums",
                                        isIncome ? "text-emerald-700" : "text-red-700"
                                    )}>
                                        {isIncome ? '+' : '-'}{formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {pageIdx === statementPages.length - 1 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Conclusion</p>
                        <p className="text-[9px] leading-relaxed text-gray-500 italic">
                            This ledger provides a verified breakdown of all activity within the selected period. Total entries processed: {unifiedLedger.length}.
                        </p>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-4 text-center border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Transaction Statement &bull; Verified Node Data</p>
                    <p className="text-[9px] font-black">PAGE {pageIdx + 2} OF {statementPages.length + 1}</p>
                </div>
            </footer>
          </div>
      ))}
    </div>
  );
}
