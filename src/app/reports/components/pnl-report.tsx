'use client';

import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import type { PnlData } from './reports-client';
import type { DateRange } from 'react-day-picker';
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useSaaS } from '@/components/saas/saas-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

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

export function PnlReport({ data, dateRange }: PnlReportProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc(companyRef);

  const { sales, expenses } = data;

  // 1. Calculate Customer-wise Summary for the EXACT period selected
  const customerSummary = useMemo(() => {
    const summaryMap: Record<string, {
        name: string,
        openingBalance: number,
        periodInvoiced: number,
        periodPaid: number,
        closingBalance: number
    }> = {};

    sales.forEach(s => {
        const cId = s.customerId || 'walk-in';
        if (!summaryMap[cId]) {
            summaryMap[cId] = {
                name: s.customerName || 'GENERAL WALK-IN',
                openingBalance: Number(s.previousBalance || 0),
                periodInvoiced: 0,
                periodPaid: 0,
                closingBalance: 0
            };
        }
        summaryMap[cId].periodInvoiced += Number(s.total || 0);
        summaryMap[cId].periodPaid += Number(s.amountPaid || 0);
        summaryMap[cId].closingBalance = summaryMap[cId].openingBalance + summaryMap[cId].periodInvoiced - summaryMap[cId].periodPaid;
    });

    return Object.values(summaryMap).sort((a,b) => b.periodInvoiced - a.periodInvoiced);
  }, [sales]);

  // 2. Prepare detailed ledger (Transactions) for the interval
  const unifiedLedger = [
      ...sales.map((s: any) => ({ ...s, ledgerType: 'INFLOW', label: s.customerName || 'Sale' })),
      ...expenses.map((e: any) => ({ ...e, ledgerType: 'OUTFLOW', label: e.category || 'Expense' }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Pagination for Ledger
  const LEDGER_ITEMS_PER_PAGE = 22;
  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += LEDGER_ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + LEDGER_ITEMS_PER_PAGE));
  }

  const primaryBlue = "#1e3a8a";
  const companyName = company?.name || 'OFFICIAL BUSINESS';

  return (
    <div className="flex flex-col items-center gap-10 bg-slate-200 p-8 no-scrollbar">
      
      {/* PAGE 1: OFFICIAL STATEMENT OF ACCOUNTS (SUMMARY) */}
      <div className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4 w-1/4">
              {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
              ) : (
                  <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-bold border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
              )}
            </div>
            <div className="flex flex-col items-start justify-center flex-1 pt-2 px-4 overflow-hidden">
                <h1 className="text-[28px] font-bold uppercase tracking-tighter leading-none" style={{ color: primaryBlue }}>
                    {companyName}
                </h1>
                <p className="font-bold text-[10px] uppercase tracking-wide mt-1 opacity-70">Statement of Accounts / Summarized Period Audit</p>
            </div>
            <div className="text-right flex flex-col gap-1">
                <p className="text-[14px] font-black uppercase text-slate-400 m-0">{companyName}</p>
                <Badge variant="outline" className="ml-auto text-[9px] font-bold uppercase py-0.5">
                    {dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : 'Audit'}
                    {dateRange?.to && dateRange.to !== dateRange.from && ` - ${format(dateRange.to, 'dd MMM yyyy')}`}
                </Badge>
            </div>
        </header>

        <div className="h-0.5 w-full bg-black mb-8" />

        <div className="flex w-full mb-6 border border-black rounded-[8px] overflow-hidden">
            <div className="w-[100%] p-2 bg-[#e0f2fe]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-center">CUSTOMER FINANCIAL SUMMARY</p>
            </div>
        </div>

        <div className="flex-grow overflow-hidden">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-bold text-[9px] uppercase">CUSTOMER IDENTITY</th>
                        <th className="p-3 text-right font-bold text-[9px] uppercase w-28">OPENING</th>
                        <th className="p-3 text-right font-bold text-[9px] uppercase w-28">PERIOD SALES</th>
                        <th className="p-3 text-right font-bold text-[9px] uppercase w-28">COLLECTED</th>
                        <th className="p-3 text-right font-bold text-[9px] uppercase w-32">CLOSING BAL</th>
                    </tr>
                </thead>
                <tbody>
                    {customerSummary.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-100 h-11">
                            <td className="p-3 font-bold uppercase text-[10px] truncate max-w-[200px]">{c.name}</td>
                            <td className="p-3 text-right font-medium text-[10px] opacity-40">{formatCurrency(c.openingBalance)}</td>
                            <td className="p-3 text-right font-bold text-[10px] text-blue-700">{formatCurrency(c.periodInvoiced)}</td>
                            <td className="p-3 text-right font-bold text-[10px] text-green-700">{formatCurrency(c.periodPaid)}</td>
                            <td className="p-3 text-right font-black text-[11px] bg-slate-50">{formatCurrency(c.closingBalance)}</td>
                        </tr>
                    ))}
                    {customerSummary.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-[10px] font-bold uppercase opacity-30 italic">No activity recorded for this period</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        <footer className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-end">
            <div className="text-left text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                {companyName} &bull; Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
            <div className="text-right">
                <p className="text-[9px] font-bold bg-gray-50 text-gray-400 px-4 py-1.5 rounded-sm uppercase font-mono">PAGE 1 OF {ledgerPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* SUBSEQUENT PAGES: DETAILED TRANSACTION AUDIT LEDGER */}
      {ledgerPages.map((pageData, pIdx) => (
          <div key={pIdx} className="a4-pdf-page p-[10mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
             <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <Badge className="bg-black text-white font-bold uppercase text-[8px] px-2 h-5">AUDIT TRAIL</Badge>
                    <h3 className="text-lg font-bold uppercase tracking-tighter m-0">Detailed Transaction Ledger</h3>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <p className="text-[12px] font-bold uppercase text-slate-400 m-0">{companyName}</p>
                </div>
             </header>

             <div className="flex-grow overflow-hidden flex flex-col">
                <table className="w-full border-collapse">
                    <thead className="text-white" style={{ backgroundColor: primaryBlue }}>
                        <tr className="text-left">
                            <th className="p-3 font-bold text-[9px] uppercase w-24">Date</th>
                            <th className="p-3 font-bold text-[9px] uppercase">Reference & Description</th>
                            <th className="p-3 font-bold text-[9px] uppercase w-24 text-center">Protocol</th>
                            <th className="p-3 text-right font-bold text-[9px] uppercase w-36">Value (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any, i) => {
                            const isIncome = item.ledgerType === 'INFLOW';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={i} className="border-b border-gray-100 h-10">
                                    <td className="p-3 font-mono text-[9px] font-bold opacity-40">{format(parseISO(item.date), 'dd/MM/yy')}</td>
                                    <td className="p-3">
                                        <p className="font-bold uppercase text-[10px] truncate max-w-[320px] tracking-tight">{item.label}</p>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Badge variant="outline" className={cn("text-[7px] font-bold uppercase h-3.5 px-1.5 border-none", isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {item.ledgerType}
                                        </Badge>
                                    </td>
                                    <td className={cn("p-3 text-right font-bold tabular-nums text-[10px]", isIncome ? "text-green-700" : "text-red-700")}>
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center bg-white">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{companyName} &bull; Detailed Ledger Audit</p>
                <p className="text-[9px] font-bold bg-gray-50 text-gray-300 px-4 py-1.5 rounded-sm tracking-widest font-mono">PAGE {pIdx + 2} OF {ledgerPages.length + 1}</p>
             </footer>
          </div>
      ))}
    </div>
  );
}
