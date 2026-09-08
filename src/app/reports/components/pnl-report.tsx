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
      "flex justify-between items-center border-b border-gray-100 py-4",
      isTotal ? 'bg-gray-50 font-black px-4 border-b-2 border-black' : 'font-medium',
      isSubItem ? 'pl-8 pr-4' : 'px-2'
    )}
  >
    <div className="text-[11px] uppercase tracking-tight truncate leading-none">{label}</div>
    <div className="text-right font-mono text-sm font-black flex items-baseline">
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

  // Pagination for Ledger (Statements)
  const ITEMS_PER_PAGE = 20;
  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + ITEMS_PER_PAGE));
  }

  const primaryIndigo = "#1e3a8a"; 
  const companyName = company?.name || 'OFFICIAL BUSINESS';
  const isNegative = netIncome < 0;

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8 no-scrollbar">
      {/* PAGE 1: SUMMARIZED PROFIT & LOSS STATEMENT */}
      <div className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start border-b-[6px] border-black mb-12 pb-10">
            <div className="flex flex-col gap-3">
                <h1 className="text-5xl font-black uppercase tracking-tighter m-0 p-0" style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="flex flex-col gap-1.5 text-[12px] font-bold text-black/60">
                    <p className="m-0"><span className="w-28 inline-block opacity-40 uppercase tracking-widest text-[10px]">Document Type</span> <span className="font-black text-black">SUMMARIZED STATEMENT</span></p>
                    <p className="m-0"><span className="w-28 inline-block opacity-40 uppercase tracking-widest text-[10px]">Audit Period</span> <span className="font-black text-blue-900">{dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yyyy') : '--'}</span></p>
                </div>
            </div>
            <div className="text-right flex flex-col gap-2">
                <p className="text-[16px] font-black uppercase text-slate-400 m-0 tracking-widest">{companyName}</p>
                <div className="flex justify-end gap-2">
                    <Badge variant="outline" className="text-[10px] font-black uppercase py-1 px-3 border-2">AUDIT VALID</Badge>
                </div>
                <div className="mt-4">
                    {company?.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain ml-auto" crossOrigin="anonymous" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 ml-auto">LOGO</div>
                    )}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 flex-grow overflow-hidden">
            <div className="space-y-12">
                <div>
                    <div className="text-white text-[12px] font-black uppercase px-5 py-4 rounded-sm mb-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: primaryIndigo }}>
                        <span>1. Revenue (Inflow)</span>
                        <span className="opacity-60 text-[10px]">Gross Sales</span>
                    </div>
                    <ReportRow label="Operational Sales" amount={operatingIncome.totalSales} />
                    <ReportRow label="Total Invoiced Value" amount={operatingIncome.totalSales} isTotal />
                </div>

                <div>
                    <div className="text-white text-[12px] font-black uppercase px-5 py-4 rounded-sm mb-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: primaryIndigo }}>
                        <span>2. Direct Costs (COGS)</span>
                        <span className="opacity-60 text-[10px]">Acquisition</span>
                    </div>
                    {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Inventory Costs" amount={costOfGoodsSold.totalCogs} isTotal />
                </div>
            </div>

            <div className="space-y-12">
                <div>
                    <div className="text-white text-[12px] font-black uppercase px-5 py-4 rounded-sm mb-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: primaryIndigo }}>
                        <span>3. Overheads (Expenses)</span>
                        <span className="opacity-60 text-[10px]">Operating Spend</span>
                    </div>
                    {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Expenditures" amount={operatingExpenses.totalExpenses} isTotal />
                </div>

                <div className={cn(
                    "p-10 rounded-[32px] border-[6px] shadow-2xl flex flex-col gap-6 mt-auto",
                    isNegative ? "bg-red-50 border-red-600" : "bg-emerald-50 border-emerald-600"
                )}>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Period Performance</span>
                            <h2 className={cn("text-3xl font-black uppercase tracking-tighter m-0", isNegative ? "text-red-700" : "text-emerald-700")}>
                                Net {isNegative ? 'Deficit' : 'Surplus'}
                            </h2>
                        </div>
                        <div className={cn("px-4 py-2 rounded-full", isNegative ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}>
                            <span className="text-xs font-black uppercase tracking-widest">{isNegative ? 'LOSS' : 'PROFIT'}</span>
                        </div>
                    </div>
                    <div className="pt-6 border-t-2 border-black/5">
                        <span className={cn("text-5xl font-black tracking-tighter tabular-nums", isNegative ? "text-red-800" : "text-emerald-800")}>
                            {isNegative ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                        </span>
                        <p className="text-[11px] font-black uppercase mt-3 opacity-50 tracking-wider">Official Financial Outcome</p>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-8 border-t-4 border-black flex justify-between items-end bg-white">
            <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-900">{companyName} &bull; Summarized Statement</p>
                <p className="text-[10px] font-bold opacity-30 mt-1 uppercase">Cloud Sync Timestamp: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
            </div>
            <div className="text-right">
                <p className="text-[13px] font-black bg-slate-900 text-white px-5 py-2 rounded-sm uppercase tracking-widest">PAGE 1 OF {ledgerPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* PAGE 2+: DETAILED AUDIT LEDGER (STATEMENTS) */}
      {ledgerPages.map((pageData, pIdx) => (
          <div key={pIdx} className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
             <header className="flex justify-between items-center mb-8 pb-6 border-b-4 border-slate-100">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter m-0">Detailed Audit Ledger</h3>
                    <p className="text-[11px] font-bold opacity-40 uppercase tracking-[0.2em]">Full Transaction Statement &bull; Page {pIdx + 2}</p>
                </div>
                <div className="text-right font-black uppercase text-[12px] opacity-40 tracking-widest">
                    {companyName}
                </div>
             </header>

             <div className="flex-grow overflow-hidden border-2 border-black rounded-sm shadow-inner">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-black">
                        <tr className="text-left">
                            <th className="p-4 font-black text-[11px] uppercase text-slate-600 w-24">Date</th>
                            <th className="p-4 font-black text-[11px] uppercase text-slate-600">Reference & Description</th>
                            <th className="p-4 font-black text-[11px] uppercase text-slate-600 w-32">Ledger Type</th>
                            <th className="p-4 text-right font-black text-[11px] uppercase text-slate-600 w-40">Value (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-mono text-[11px] font-bold opacity-60">{format(parseISO(item.date), 'dd MMM yy')}</td>
                                    <td className="p-4">
                                        <p className="font-black uppercase text-[12px] truncate max-w-[280px] tracking-tight">{item.label}</p>
                                        <p className="text-[9px] opacity-40 font-mono mt-1 uppercase">ID: {item.id.slice(0, 12)}</p>
                                    </td>
                                    <td className="p-4">
                                        <Badge className={cn("text-[9px] font-black uppercase h-5 px-3 border-none shadow-sm", isIncome ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                                            {isIncome ? 'BUSINESS INFLOW' : 'SHOP OUTFLOW'}
                                        </Badge>
                                    </td>
                                    <td className={cn("p-4 text-right font-black tabular-nums text-[14px] tracking-tighter", isIncome ? "text-emerald-700" : "text-red-700")}>
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-8 pt-8 border-t-4 border-slate-100 flex justify-between items-center bg-white">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">{companyName} &bull; Detailed Statement</p>
                <p className="text-[13px] font-black bg-slate-100 px-5 py-2 rounded-sm tracking-widest">PAGE {pIdx + 2} OF {ledgerPages.length + 1}</p>
             </footer>
          </div>
      ))}
    </div>
  );
}
