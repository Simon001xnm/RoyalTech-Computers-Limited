'use client';

import { format, parseISO } from 'date-fns';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * @fileOverview High-Fidelity P&L and Statement Report
 * PAGINATION: Strictly forced A4 pages (210mm x 297mm)
 * STABILITY: Block-based layout to prevent html2canvas overlapping.
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
  isSubItem = false,
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
  isSubItem?: boolean;
}) => (
  <div
    className={cn(
      "flex justify-between items-center border-b border-gray-100",
      isTotal ? 'bg-gray-50/80 font-black py-4 px-4' : 'font-medium py-3',
      isSubItem ? 'pl-8 pr-4' : 'px-2'
    )}
    style={{ minHeight: isTotal ? '56px' : '44px' }}
  >
    <div className="text-[12px] uppercase tracking-tight truncate leading-none">{label}</div>
    <div className="text-right font-mono text-[13px] font-black leading-none">
      <span className="opacity-30 mr-2 text-[10px] font-sans">KES</span>
      {formatCurrency(amount)}
    </div>
  </div>
);

const ITEMS_PER_PAGE_STATEMENT = 18;

export function PnlReport({ data, dateRange }: PnlReportProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const { operatingIncome, costOfGoodsSold, operatingExpenses, netIncome, sales, expenses } = data;

  const primaryIndigo = "#1e3a8a"; // Solid Professional Blue
  const secondaryIndigo = "#f8fafc";
  const companyName = company?.name || 'YOUR BUSINESS';
  const isNegative = netIncome < 0;

  const unifiedLedger = [
      ...sales.map((s: any) => ({ ...s, ledgerType: 'INCOME', label: s.customerName || 'Sale' })),
      ...expenses.map((e: any) => ({ ...e, ledgerType: 'EXPENSE', label: e.category || 'Shop Expense' }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const statementPages: any[][] = [];
  let currentItems = [...unifiedLedger];
  while (currentItems.length > 0) {
      statementPages.push(currentItems.slice(0, ITEMS_PER_PAGE_STATEMENT));
      currentItems = currentItems.slice(ITEMS_PER_PAGE_STATEMENT);
  }

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8 no-scrollbar">
      
      {/* PAGE 1: PROFIT & LOSS SUMMARY */}
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start mb-8 pb-8 border-b-4 border-black">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter m-0 p-0" style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="flex flex-col gap-1 text-[11px] font-bold text-black/60">
                    <p className="m-0"><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px]">Document</span> <span className="font-black text-black">SUMMARIZED STATEMENT</span></p>
                    <p className="m-0"><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px]">Period</span> <span className="font-black text-blue-900">{dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yyyy') : '--'}</span></p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
                )}
            </div>
        </header>

        <section className="p-6 rounded-xl mb-10 border-2 border-slate-100" style={{ backgroundColor: secondaryIndigo }}>
            <p className="font-black text-xl uppercase tracking-tight m-0 leading-tight">{companyName}</p>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-2">{company?.address || 'Kenya'} &bull; {company?.email || 'OFFICE RECORDS'}</p>
        </section>

        <div className="flex-grow space-y-12">
            <div>
                <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-4 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                    <span>1. Operating Income</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Gross Revenue</span>
                </div>
                <ReportRow label="Total Shop Sales" amount={operatingIncome.totalSales} />
                <ReportRow label="Total Revenue" amount={operatingIncome.totalSales} isTotal />
            </div>

            <div>
                <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-4 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                    <span>2. Direct Costs (COGS)</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Stock Costs</span>
                </div>
                {Object.entries(costOfGoodsSold.cogsByCategory).length > 0 ? (
                    Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))
                ) : (
                    <p className="text-[11px] italic opacity-40 px-6 py-4 font-medium border-b border-dashed">No direct inventory costs recorded for this period.</p>
                )}
                <ReportRow label="Total COGS" amount={costOfGoodsSold.totalCogs} isTotal />
            </div>

            <div>
                <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-4 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                    <span>3. Indirect Operating Expenses</span>
                    <span className="opacity-70 text-[9px] tracking-[0.2em]">Overheads</span>
                </div>
                {Object.entries(operatingExpenses.expenseByCategory).length > 0 ? (
                    Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))
                ) : (
                    <p className="text-[11px] italic opacity-40 px-6 py-4 font-medium border-b border-dashed">No overhead expenses recorded for this period.</p>
                )}
                <ReportRow label="Total Operating Expenses" amount={operatingExpenses.totalExpenses} isTotal />
            </div>

            <div className={cn(
                "mt-12 flex justify-between p-8 items-center rounded-2xl border-4 shadow-xl",
                isNegative ? "bg-red-600 border-red-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
            )}>
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Reporting Bottom Line</span>
                    <p className="text-3xl font-black uppercase tracking-tighter">Net {isNegative ? 'Loss' : 'Profit'}</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black tracking-tighter tabular-nums">
                        {isNegative ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                    </span>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-6 border-t-2 border-black flex justify-between items-end">
            <div className="text-left space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Financial Statement & bull; Verified Node Output</p>
                <p className="text-[8px] font-bold opacity-30 uppercase">Confidential Business Report</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[8px] font-bold opacity-30">{format(new Date(), 'dd MMM yyyy HH:mm')}</span>
                <p className="text-[12px] font-black bg-gray-100 px-4 py-2 rounded-sm border border-gray-200">PAGE 1 OF {statementPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* PAGE 2+: DETAILED TRANSACTION STATEMENT */}
      {statementPages.map((pageItems, pageIdx) => (
          <div key={pageIdx} className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
            <header className="flex justify-between items-center mb-10 pb-6 border-b-4 border-slate-100">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-300 m-0">Transaction Audit</h2>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">Full Period Ledger History</p>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <p className="text-[14px] font-black uppercase text-slate-400 m-0">{companyName}</p>
                    <Badge variant="outline" className="ml-auto text-[9px] font-bold uppercase py-0.5">{dateRange?.from ? format(dateRange.from, 'MMM yyyy') : 'Audit'}</Badge>
                </div>
            </header>

            <div className="flex-grow">
                <table className="w-full border-collapse border-2 border-slate-100">
                    <thead>
                        <tr className="text-left bg-slate-50 border-b-2 border-slate-200">
                            <th className="p-4 font-black text-[10px] uppercase tracking-widest w-28 text-slate-500">Date</th>
                            <th className="p-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Transaction Details</th>
                            <th className="p-4 font-black text-[10px] uppercase tracking-widest w-24 text-center text-slate-500">Node</th>
                            <th className="p-4 text-right font-black text-[10px] uppercase tracking-widest w-40 text-slate-500">Amount (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((item: any) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-mono text-[11px] font-bold opacity-60">
                                        {format(parseISO(item.date), 'dd/MM/yy')}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-black text-[13px] uppercase truncate max-w-[320px] leading-tight">
                                            {item.label}
                                        </p>
                                        <p className="text-[9px] font-mono opacity-40 truncate uppercase mt-1">ID: {item.id.slice(0, 16)}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-3 py-1 rounded-sm border",
                                            isIncome ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {isIncome ? 'CR' : 'DR'}
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
                    <div className="mt-12 p-8 bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Audit Conclusion</p>
                        <p className="text-[12px] leading-relaxed text-slate-500 font-medium italic m-0">
                            This summarized ledger provides a verified shop-level audit of all activity within the selected timeframe. All entries correspond to verified workspace transactions. End of detailed reporting for this period. Total transactions analyzed: {unifiedLedger.length}.
                        </p>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-6 border-t-2 border-slate-100 flex justify-between items-center">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Transaction Audit Statement & bull; High Fidelity Ledger Output</p>
                <p className="text-[12px] font-black bg-slate-50 px-4 py-2 rounded-sm border border-slate-100">PAGE {pageIdx + 2} OF {statementPages.length + 1}</p>
            </footer>
          </div>
      ))}
    </div>
  );
}