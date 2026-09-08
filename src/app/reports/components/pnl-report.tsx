'use client';

import { format, parseISO } from 'date-fns';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
      "flex justify-between items-center border-b border-gray-100 py-3",
      isTotal ? 'bg-gray-50 font-black px-4' : 'font-medium',
      isSubItem ? 'pl-8 pr-4' : 'px-2'
    )}
  >
    <div className="text-xs uppercase tracking-tight truncate">{label}</div>
    <div className="text-right font-mono text-sm font-black">
      <span className="opacity-30 mr-2 text-[9px] font-sans">KES</span>
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

  const { operatingIncome, costOfGoodsSold, operatingExpenses, netIncome, sales, expenses } = data;

  const unifiedLedger = [
      ...sales.map((s: any) => ({ ...s, ledgerType: 'INCOME', label: s.customerName || 'Sale' })),
      ...expenses.map((e: any) => ({ ...e, ledgerType: 'EXPENSE', label: e.category || 'Shop Expense' }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Pagination for Ledger
  const ITEMS_PER_PAGE = 22;
  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + ITEMS_PER_PAGE));
  }

  const primaryIndigo = "#1e3a8a"; 
  const companyName = company?.name || 'YOUR BUSINESS';
  const isNegative = netIncome < 0;

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8">
      {/* PAGE 1: SUMMARIZED STATEMENT */}
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start border-b-4 border-black mb-10 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter m-0 p-0" style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="flex flex-col gap-1 text-[11px] font-bold text-black/60">
                    <p className="m-0"><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px]">Document</span> <span className="font-black text-black">SUMMARIZED STATEMENT</span></p>
                    <p className="m-0"><span className="w-24 inline-block opacity-40 uppercase tracking-widest text-[9px]">Period</span> <span className="font-black text-blue-900">{dateRange?.from ? format(dateRange.from, 'dd MMM yy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yy') : '--'}</span></p>
                </div>
            </div>
            <div className="text-right flex flex-col gap-1">
                <p className="text-[14px] font-black uppercase text-slate-400 m-0">{companyName}</p>
                <Badge variant="outline" className="ml-auto text-[9px] font-bold uppercase py-0.5">{dateRange?.from ? format(dateRange.from, 'MMM yyyy') : 'Audit'}</Badge>
                <div className="mt-4">
                    {company?.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="h-20 w-auto object-contain ml-auto" crossOrigin="anonymous" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 ml-auto">LOGO</div>
                    )}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-grow overflow-hidden mb-10">
            <div className="space-y-8">
                <div>
                    <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-3 flex justify-between items-center shadow-md" style={{ backgroundColor: primaryIndigo }}>
                        <span>1. Revenue</span>
                        <span className="opacity-60 text-[9px]">Income Inflow</span>
                    </div>
                    <ReportRow label="Gross Sales Volume" amount={operatingIncome.totalSales} />
                    <ReportRow label="Total Operating Income" amount={operatingIncome.totalSales} isTotal />
                </div>

                <div>
                    <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-3 flex justify-between items-center shadow-md" style={{ backgroundColor: primaryIndigo }}>
                        <span>2. Direct Costs</span>
                        <span className="opacity-60 text-[9px]">COGS Breakdown</span>
                    </div>
                    {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Cost of Goods Sold" amount={costOfGoodsSold.totalCogs} isTotal />
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <div className="text-white text-[11px] font-black uppercase px-4 py-3 rounded-sm mb-3 flex justify-between items-center shadow-md" style={{ backgroundColor: primaryIndigo }}>
                        <span>3. Overheads</span>
                        <span className="opacity-60 text-[9px]">Expense Categories</span>
                    </div>
                    {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Operating Overheads" amount={operatingExpenses.totalExpenses} isTotal />
                </div>

                <div className={cn(
                    "p-8 rounded-2xl border-4 shadow-xl flex flex-col gap-4 mt-auto",
                    isNegative ? "bg-red-50 border-red-600" : "bg-emerald-50 border-emerald-600"
                )}>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Final Analysis</span>
                            <h2 className={cn("text-2xl font-black uppercase tracking-tighter m-0", isNegative ? "text-red-700" : "text-emerald-700")}>
                                Net {isNegative ? 'Loss' : 'Profit'}
                            </h2>
                        </div>
                        <div className={cn("p-3 rounded-xl", isNegative ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}>
                            <span className="text-sm font-bold uppercase tracking-widest">{isNegative ? 'Deficit' : 'Surplus'}</span>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-black/5">
                        <span className={cn("text-4xl font-black tracking-tighter tabular-nums", isNegative ? "text-red-800" : "text-emerald-800")}>
                            {isNegative ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                        </span>
                        <p className="text-[10px] font-bold uppercase mt-2 opacity-50">Authorized Financial Output</p>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-6 border-t-2 border-black flex justify-between items-end bg-white">
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{companyName} &bull; Summarized Statement</p>
                <p className="text-[9px] font-medium opacity-30 mt-1">Generated: {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            </div>
            <div className="text-right">
                <p className="text-[12px] font-black bg-gray-100 px-4 py-1.5 rounded-sm">PAGE 1 OF {ledgerPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* SUBSEQUENT PAGES: AUDIT LEDGER */}
      {ledgerPages.map((pageData, pIdx) => (
          <div key={pIdx} className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
             <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-200">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-black uppercase tracking-tight m-0">Detailed Audit Ledger</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Transaction Statement Continued</p>
                </div>
                <div className="text-right font-black uppercase text-[10px] opacity-40 tracking-tighter">
                    {companyName}
                </div>
             </header>

             <div className="flex-grow overflow-hidden border rounded-sm">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b">
                        <tr className="text-left">
                            <th className="p-3 font-black text-[10px] uppercase text-slate-500 w-16">Date</th>
                            <th className="p-3 font-black text-[10px] uppercase text-slate-500">Transaction Details</th>
                            <th className="p-3 font-black text-[10px] uppercase text-slate-500 w-24">Type</th>
                            <th className="p-3 text-right font-black text-[10px] uppercase text-slate-500 w-32">Amount (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                    <td className="p-3 font-mono text-[10px] font-bold opacity-60">{format(parseISO(item.date), 'dd/MM')}</td>
                                    <td className="p-3">
                                        <p className="font-black uppercase text-xs truncate max-w-[250px]">{item.label}</p>
                                        <p className="text-[8px] opacity-30 font-mono mt-0.5">REF: {item.id.slice(0, 8).toUpperCase()}</p>
                                    </td>
                                    <td className="p-3">
                                        <Badge className={cn("text-[8px] font-black uppercase h-4 px-2 border-none", isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {isIncome ? 'INFLOW' : 'OUTFLOW'}
                                        </Badge>
                                    </td>
                                    <td className={cn("p-3 text-right font-black tabular-nums text-sm", isIncome ? "text-emerald-700" : "text-red-700")}>
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-6 pt-6 border-t-2 border-slate-100 flex justify-between items-center bg-white opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest">{companyName} &bull; Audit Trail Statement</p>
                <p className="text-[12px] font-black">PAGE {pIdx + 2} OF {ledgerPages.length + 1}</p>
             </footer>
          </div>
      ))}
    </div>
  );
}
