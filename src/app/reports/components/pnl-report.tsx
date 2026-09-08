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
  density = 'normal'
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
  isSubItem?: boolean;
  density?: 'normal' | 'compact' | 'ultra'
}) => {
  const isCompact = density === 'compact' || density === 'ultra';
  const isUltra = density === 'ultra';

  return (
    <div
      className={cn(
        "flex justify-between items-center border-b border-gray-100",
        isTotal ? 'bg-gray-50/80 font-black px-4' : 'font-medium',
        isSubItem ? 'pl-8 pr-4' : 'px-2',
        isUltra ? "py-1.5" : isCompact ? "py-2.5" : "py-3.5"
      )}
    >
      <div className={cn("uppercase tracking-tight truncate leading-none", isUltra ? "text-[10px]" : "text-[12px]")}>{label}</div>
      <div className={cn("text-right font-mono font-black leading-none", isUltra ? "text-[11px]" : "text-[13px]")}>
        <span className="opacity-30 mr-2 text-[9px] font-sans">KES</span>
        {formatCurrency(amount)}
      </div>
    </div>
  );
};

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

  // DYNAMIC DENSITY FOR REPORT
  const totalRows = unifiedLedger.length + Object.keys(operatingExpenses.expenseByCategory).length + Object.keys(costOfGoodsSold.cogsByCategory).length;
  const isUltraCompact = totalRows > 40;
  const isCompact = totalRows > 20;
  const density = isUltraCompact ? 'ultra' : isCompact ? 'compact' : 'normal';

  const primaryIndigo = "#1e3a8a"; 
  const secondaryIndigo = "#f8fafc";
  const companyName = company?.name || 'YOUR BUSINESS';
  const isNegative = netIncome < 0;

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8 no-scrollbar">
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className={cn("flex justify-between items-start border-b-4 border-black", isUltraCompact ? "mb-4 pb-4" : "mb-8 pb-8")}>
            <div className="flex flex-col gap-1">
                <h1 className={cn("font-black uppercase tracking-tighter m-0 p-0", isUltraCompact ? "text-2xl" : "text-4xl")} style={{ color: primaryIndigo }}>Profit & Loss</h1>
                <div className="flex flex-col gap-0.5 text-[10px] font-bold text-black/60">
                    <p className="m-0"><span className="w-20 inline-block opacity-40 uppercase tracking-widest text-[8px]">Period</span> <span className="font-black text-blue-900">{dateRange?.from ? format(dateRange.from, 'dd MMM yy') : '--'} — {dateRange?.to ? format(dateRange.to, 'dd MMM yy') : '--'}</span></p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className={cn("w-auto object-contain", isUltraCompact ? "h-12" : "h-20")} crossOrigin="anonymous" />
                ) : (
                    <div className="h-12 w-12 bg-gray-50 flex items-center justify-center text-[8px] font-black border border-dashed border-gray-200">LOGO</div>
                )}
            </div>
        </header>

        <div className="flex flex-col flex-grow overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* LEFT COLUMN: SUMMARY */}
                <div className="space-y-6 overflow-y-auto pr-4 border-r">
                    <div>
                        <div className="text-white text-[10px] font-black uppercase px-3 py-2 rounded-sm mb-2 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                            <span>1. Revenue</span>
                        </div>
                        <ReportRow label="Gross Sales" amount={operatingIncome.totalSales} density={density} />
                        <ReportRow label="Total Income" amount={operatingIncome.totalSales} isTotal density={density} />
                    </div>

                    <div>
                        <div className="text-white text-[10px] font-black uppercase px-3 py-2 rounded-sm mb-2 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                            <span>2. Direct Costs</span>
                        </div>
                        {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                            <ReportRow key={category} label={category} amount={amount as number} isSubItem density={density} />
                        ))}
                        <ReportRow label="Total COGS" amount={costOfGoodsSold.totalCogs} isTotal density={density} />
                    </div>

                    <div>
                        <div className="text-white text-[10px] font-black uppercase px-3 py-2 rounded-sm mb-2 flex justify-between items-center shadow-sm" style={{ backgroundColor: primaryIndigo }}>
                            <span>3. Overheads</span>
                        </div>
                        {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                            <ReportRow key={category} label={category} amount={amount as number} isSubItem density={density} />
                        ))}
                        <ReportRow label="Total Expenses" amount={operatingExpenses.totalExpenses} isTotal density={density} />
                    </div>

                    <div className={cn(
                        "mt-4 flex justify-between p-4 items-center rounded-xl border-2",
                        isNegative ? "bg-red-600 border-red-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
                    )}>
                        <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Final Outcome</span>
                            <p className="text-lg font-black uppercase tracking-tight">Net {isNegative ? 'Loss' : 'Profit'}</p>
                        </div>
                        <div className="text-right">
                            <span className={cn("font-black tracking-tighter tabular-nums", isUltraCompact ? "text-xl" : "text-2xl")}>
                                {isNegative ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: TRANSACTION AUDIT */}
                <div className="flex flex-col overflow-hidden">
                    <div className="text-slate-400 text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                        Audit Statement
                        <Badge variant="outline" className="text-[8px] h-4 uppercase">{unifiedLedger.length} Records</Badge>
                    </div>
                    <div className="flex-grow overflow-y-auto border rounded-sm">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                <tr className="text-left border-b">
                                    <th className="p-2 font-black text-[9px] uppercase text-slate-500">Date</th>
                                    <th className="p-2 font-black text-[9px] uppercase text-slate-500">Details</th>
                                    <th className="p-2 text-right font-black text-[9px] uppercase text-slate-500">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unifiedLedger.map((item: any) => {
                                    const isIncome = item.ledgerType === 'INCOME';
                                    const amount = Number(item.total || item.amount || 0);
                                    return (
                                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="p-2 font-mono text-[9px] font-bold opacity-60">{format(parseISO(item.date), 'dd/MM')}</td>
                                            <td className="p-2">
                                                <p className={cn("font-black uppercase truncate max-w-[120px]", isUltraCompact ? "text-[9px]" : "text-[11px]")}>{item.label}</p>
                                            </td>
                                            <td className={cn("p-2 text-right font-black tabular-nums", isUltraCompact ? "text-[9px]" : "text-[11px]", isIncome ? "text-emerald-700" : "text-red-700")}>
                                                {formatCurrency(amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-4 pt-4 border-t-2 border-black flex justify-between items-end bg-white">
            <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{companyName} &bull; Final Verified Audit</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[8px] font-bold opacity-30">{format(new Date(), 'dd MMM yyyy HH:mm')}</span>
                <p className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-sm">PAGE 1 OF 1</p>
            </div>
        </footer>
      </div>
    </div>
  );
}
