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
      "flex justify-between items-center border-b border-gray-100 py-2",
      isTotal ? 'bg-slate-50 font-bold px-4 border-b border-black' : 'font-normal',
      isSubItem ? 'pl-8 pr-4' : 'px-2'
    )}
  >
    <div className="text-[11px] uppercase tracking-tight truncate leading-none">{label}</div>
    <div className="text-right font-mono text-[11px] font-medium flex items-baseline">
      <span className="opacity-30 mr-1.5 text-[9px] font-sans">KES</span>
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
  const ITEMS_PER_PAGE = 30;
  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + ITEMS_PER_PAGE));
  }

  const primaryBlue = "#1e3a8a";
  const primaryGreen = "#10b981";
  const companyName = company?.name || 'OFFICIAL BUSINESS';
  const isNegative = netIncome < 0;

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8 no-scrollbar">
      {/* PAGE 1: SUMMARIZED PROFIT & LOSS STATEMENT */}
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6 w-1/3">
              {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
              ) : (
                  <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-medium border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center text-center w-1/3 pt-4">
                <h1 className="text-[24px] font-bold uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>{companyName}</h1>
                <p className="font-medium text-[11px] uppercase tracking-wide mt-1" style={{ color: primaryGreen }}>Official P&L Statement</p>
            </div>
            <div className="text-right w-1/3 space-y-0.5">
                <p className="font-bold uppercase text-[11px]">HEAD OFFICE</p>
                <p className="text-[9px] font-normal leading-tight">{company?.address || 'Nairobi, Kenya'}</p>
                <p className="text-[9px] font-normal">Tel: {company?.phone || '+254 701 694 469'}</p>
                <div className="pt-3">
                    <Badge variant="outline" className="ml-auto text-[9px] font-medium uppercase py-0.5 border">AUDIT VALID</Badge>
                    <p className="text-[9px] font-normal text-muted-foreground mt-1">Audit: {dateRange?.from ? format(dateRange.from, 'MMM yyyy') : 'Current'}</p>
                </div>
            </div>
        </header>
        <div className="h-0.5 w-full bg-black mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-grow">
            <div className="space-y-10">
                <div className="bg-[#F4F7FF] p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900">1. Revenue (Inflow)</span>
                        <Badge className="bg-blue-100 text-blue-800 border-none h-5 text-[8px] font-medium">GROSS SALES</Badge>
                    </div>
                    <ReportRow label="Operational Sales" amount={operatingIncome.totalSales} />
                    <ReportRow label="Total Invoiced Value" amount={operatingIncome.totalSales} isTotal />
                </div>

                <div className="bg-[#FFFBF0] p-4 rounded-xl border border-orange-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-900">2. Direct Costs (COGS)</span>
                        <Badge className="bg-orange-100 text-orange-800 border-none h-5 text-[8px] font-medium">ACQUISITION</Badge>
                    </div>
                    {Object.entries(costOfGoodsSold.cogsByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Inventory Costs" amount={costOfGoodsSold.totalCogs} isTotal />
                </div>
            </div>

            <div className="space-y-10">
                <div className="bg-[#F4F4F5] p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">3. Overheads (Expenses)</span>
                        <Badge className="bg-slate-200 text-slate-800 border-none h-5 text-[8px] font-medium">OPERATING SPEND</Badge>
                    </div>
                    {Object.entries(operatingExpenses.expenseByCategory).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount as number} isSubItem />
                    ))}
                    <ReportRow label="Total Expenditures" amount={operatingExpenses.totalExpenses} isTotal />
                </div>

                <div className={cn(
                    "p-8 rounded-[24px] border-[2px] shadow-xl flex flex-col gap-4 mt-auto",
                    isNegative ? "bg-red-50 border-red-600" : "bg-emerald-50 border-emerald-600"
                )}>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] opacity-40">Period Performance</span>
                        <div className={cn("px-3 py-0.5 rounded-full", isNegative ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}>
                            <span className="text-[8px] font-bold uppercase tracking-widest">{isNegative ? 'LOSS' : 'PROFIT'}</span>
                        </div>
                    </div>
                    <h2 className={cn("text-xl font-bold uppercase tracking-tighter m-0", isNegative ? "text-red-700" : "text-emerald-700")}>
                        Net {isNegative ? 'Deficit' : 'Surplus'} Outcome
                    </h2>
                    <div className="pt-4 border-t border-black/5">
                        <span className={cn("text-3xl font-bold tracking-tighter tabular-nums", isNegative ? "text-red-800" : "text-emerald-800")}>
                            {isNegative ? '-' : ''}KES {formatCurrency(Math.abs(netIncome))}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-end">
            <div className="text-left text-[9px] font-normal text-gray-500 uppercase tracking-widest">
                {companyName} &bull; Summarized Statement &bull; {format(new Date(), 'dd/MM/yy HH:mm')}
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold bg-slate-900 text-white px-4 py-1.5 rounded-sm uppercase">PAGE 1 OF {ledgerPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* PAGE 2+: DETAILED AUDIT LEDGER */}
      {ledgerPages.map((pageData, pIdx) => (
          <div key={pIdx} className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
             <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold uppercase tracking-tighter m-0">Detailed Audit Ledger</h3>
                <div className="text-right font-medium uppercase text-[9px] opacity-40 tracking-widest">
                    {companyName}
                </div>
             </header>

             <div className="flex-grow overflow-hidden flex flex-col">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-900 text-white">
                        <tr className="text-left">
                            <th className="p-3 font-bold text-[9px] uppercase w-24">Date</th>
                            <th className="p-3 font-bold text-[9px] uppercase">Reference & Description</th>
                            <th className="p-3 font-bold text-[9px] uppercase w-32">Type</th>
                            <th className="p-3 text-right font-bold text-[9px] uppercase w-40">Value (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any, i) => {
                            const isIncome = item.ledgerType === 'INCOME';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="p-2 font-mono text-[9px] font-normal opacity-60">{format(parseISO(item.date), 'dd MMM yy')}</td>
                                    <td className="p-2">
                                        <p className="font-normal uppercase text-[10px] truncate max-w-[280px] tracking-tight">{item.label}</p>
                                        <p className="text-[7px] opacity-40 font-mono mt-0.5 uppercase">ID: {item.id.slice(0, 12)}</p>
                                    </td>
                                    <td className="p-2">
                                        <Badge className={cn("text-[7px] font-medium uppercase h-3.5 px-1.5 border-none", isIncome ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                                            {isIncome ? 'INFLOW' : 'OUTFLOW'}
                                        </Badge>
                                    </td>
                                    <td className={cn("p-2 text-right font-medium tabular-nums text-[10px] tracking-tighter", isIncome ? "text-emerald-700" : "text-red-700")}>
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center bg-white">
                <p className="text-[8px] font-normal text-gray-500 uppercase tracking-widest opacity-40">{companyName} &bull; Detailed Statement</p>
                <p className="text-[10px] font-bold bg-slate-100 px-4 py-1.5 rounded-sm tracking-widest">PAGE {pIdx + 2} OF {ledgerPages.length + 1}</p>
             </footer>
          </div>
      ))}
    </div>
  );
}
