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
 * Paginated for professional A4 delivery with increased font sizes and narrow margins.
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
      isTotal ? 'font-black bg-gray-50 px-4 mt-2' : 'font-medium',
      isHeader ? 'text-[12px] font-black mt-8 uppercase tracking-widest' : 'text-[12px]',
      isSubItem ? 'pl-8' : ''
    )}
    style={isHeader ? { color: primaryColor } : {}}
  >
    <div className="flex-1 uppercase tracking-tight truncate">{label}</div>
    <div className="w-56 text-right font-mono text-[13px] font-black">
      <span className="opacity-30 mr-3 text-[10px] font-sans">KES</span>
      {formatCurrency(amount)}
    </div>
  </div>
);

const ITEMS_PER_PAGE_STATEMENT = 20;

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
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden">
        <header className="flex justify-between items-start mb-8 pb-6 border-b-4 border-black">
            <div className="space-y-4">
                <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="space-y-1.5 text-[11px] font-bold text-black/60">
                    <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest">Doc Type</span> <span className="font-black text-black">SUMMARIZED STATEMENT</span></p>
                    <p><span className="w-24 inline-block opacity-40 uppercase tracking-widest">Period</span> <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yyyy') : '--'}</span></p>
                </div>
            </div>
            <div className="flex flex-col items-end">
            {company?.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="h-28 w-auto object-contain" crossOrigin="anonymous" />
            ) : (
                <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
            )}
            </div>
        </header>

        <section className="p-6 rounded-2xl space-y-1.5 mb-8 border-2 border-indigo-100 shadow-sm" style={{ backgroundColor: secondaryIndigo }}>
            <p className="font-black text-lg uppercase tracking-tight">{companyName}</p>
            <p className="text-[11px] font-bold opacity-60 leading-tight uppercase tracking-widest">{company?.address || 'Kenya'} &bull; {company?.email || 'OFFICE RECORDS'}</p>
        </section>

        <div className="flex-grow px-2">
            <div className="mb-8">
                <div className="text-white text-[11px] font-black uppercase px-4 py-2.5 rounded shadow-lg mb-2 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>1. Operating Income</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Gross Revenue</span>
                </div>
                <ReportRow label="Total Shop Sales" amount={operatingIncome.totalSales} />
                <ReportRow label="Total Revenue" amount={operatingIncome.totalSales} isTotal />
            </div>

            <div className="mb-8">
                <div className="text-white text-[11px] font-black uppercase px-4 py-2.5 rounded shadow-lg mb-2 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>2. Direct Costs (COGS)</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Stock Costs</span>
                </div>
                {Object.entries(costOfGoodsSold.cogsByCategory).length > 0 ? (
                    Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount} isSubItem />
                    ))
                ) : (
                    <p className="text-[11px] italic opacity-40 px-6 py-3 font-medium">No direct inventory costs recorded for this period.</p>
                )}
                <ReportRow label="Total COGS" amount={costOfGoodsSold.totalCogs} isTotal />
            </div>

            <div className="mb-8">
                <div className="text-white text-[11px] font-black uppercase px-4 py-2.5 rounded shadow-lg mb-2 flex justify-between items-center" style={{ backgroundColor: primaryIndigo }}>
                    <span>3. Indirect Operating Expenses</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Overheads</span>
                </div>
                {Object.entries(operatingExpenses.expenseByCategory).length > 0 ? (
                    Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount} isSubItem />
                    ))
                ) : (
                    <p className="text-[11px] italic opacity-40 px-6 py-3 font-medium">No overhead expenses recorded for this period.</p>
                )}
                <ReportRow label="Total Operating Expenses" amount={operatingExpenses.totalExpenses} isTotal />
            </div>

            <div className={cn(
                "mt-12 flex justify-between p-8 items-center rounded-3xl border-8 shadow-2xl transition-all",
                isNegative ? "bg-red-600 border-red-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
            )}>
                <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70">Reporting Bottom Line</span>
                    <p className="text-2xl font-black uppercase tracking-tighter">Net Profit / Loss</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black tracking-tighter">
                        {netIncome < 0 ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                    </span>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-6 text-center border-t-2 border-gray-100">
            <div className="flex justify-between items-center px-2">
                <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Financial Statement &bull; Workspace Verified Data</p>
                    <p className="text-[8px] font-medium opacity-30">Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <p className="text-[12px] font-black bg-gray-100 px-4 py-1.5 rounded-full">PAGE 1 OF {statementPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* PAGE 2+: DETAILED TRANSACTION STATEMENT */}
      {statementPages.map((pageItems, pageIdx) => (
          <div key={pageIdx} className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-md overflow-hidden">
            <header className="flex justify-between items-center mb-8 pb-6 border-b-4 border-black/5">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-300">Transaction Audit Statement</h2>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">Audit Ledger History</p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[13px] font-black uppercase text-gray-400">{companyName}</p>
                    <p className="text-[10px] font-bold opacity-30 uppercase">Period Ledger Continued</p>
                </div>
            </header>

            <div className="flex-grow">
                <table className="w-full border-collapse border-2 border-gray-100">
                    <thead>
                        <tr className="text-left bg-gray-50 border-b-2 border-black/5">
                            <th className="p-4 font-black text-[11px] uppercase tracking-widest w-28">Date</th>
                            <th className="p-4 font-black text-[11px] uppercase tracking-widest">Transaction / Reference</th>
                            <th className="p-4 font-black text-[11px] uppercase tracking-widest w-28 text-center">Type</th>
                            <th className="p-4 text-right font-black text-[11px] uppercase tracking-widest w-40">Amount (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((item: any) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={item.id} className="border-b border-gray-50">
                                    <td className="p-4 font-mono text-[11px] font-bold opacity-60">
                                        {format(parseISO(item.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-black text-[13px] uppercase truncate max-w-[320px]">
                                            {item.label}
                                        </p>
                                        <p className="text-[10px] font-mono opacity-40 truncate uppercase mt-0.5">REF: {item.id.slice(0, 16)}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm",
                                            isIncome ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                        )}>
                                            {item.ledgerType}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "p-4 text-right font-black text-[13px] tabular-nums",
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
                    <div className="mt-10 p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Audit Conclusion</p>
                        <p className="text-[12px] leading-relaxed text-gray-500 font-medium italic">
                            This summarized ledger provides a verified shop-level audit of all activity within the selected timeframe. All entries correspond to verified workspace transactions. Total entries processed: {unifiedLedger.length}.
                        </p>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-6 text-center border-t-2 border-gray-100">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">Transaction Audit Statement &bull; Verified Node Output</p>
                    <p className="text-[12px] font-black bg-gray-100 px-4 py-1.5 rounded-full">PAGE {pageIdx + 2} OF {statementPages.length + 1}</p>
                </div>
            </footer>
          </div>
      ))}
    </div>
  );
}

