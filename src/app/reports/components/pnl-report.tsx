'use client';

import { format, parseISO } from 'date-fns';
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
  const { data: company } = useDoc<any>(companyRef);

  const { sales, expenses } = data;

  const customerSummary = useMemo(() => {
    const summaryMap: Record<string, any> = {};
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

  const unifiedLedger = [
      ...sales.map((s: any) => ({ ...s, ledgerType: 'INFLOW', label: s.customerName || 'Sale' })),
      ...expenses.map((e: any) => ({ ...e, ledgerType: 'OUTFLOW', label: e.category || 'Expense' }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const LEDGER_ITEMS_PER_PAGE = 24;
  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += LEDGER_ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + LEDGER_ITEMS_PER_PAGE));
  }

  const primaryBlue = "#1e3a8a";
  const companyName = company?.name || 'MATESH TECHNOLOGIES LTD';

  return (
    <div className="flex flex-col items-center gap-0 bg-slate-200 no-scrollbar">
      
      {/* PAGE 1: SUMMARY STATEMENT */}
      <div className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
        <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
            <div className="flex items-center gap-6">
              {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
              ) : (
                  <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-gray-200 text-gray-300">LOGO</div>
              )}
              <div className="space-y-0.5">
                <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: primaryBlue }}>{companyName}</h1>
                <p className="font-bold text-[10px] opacity-70 uppercase tracking-widest">Official Auditor Statement</p>
              </div>
            </div>
            <div className="text-right space-y-1">
                <p className="font-black text-[10px] uppercase">HEAD OFFICE</p>
                <p className="text-[9px] font-bold leading-tight max-w-[200px]">{company?.address || 'Nairobi, Kenya'}</p>
                <div className="pt-2">
                    <p className="text-[11px] font-black uppercase text-blue-900">
                        {dateRange?.from ? format(dateRange.from, 'dd MMM yy') : '--'} - {dateRange?.to ? format(dateRange.to, 'dd MMM yy') : '--'}
                    </p>
                </div>
            </div>
        </header>

        <div className="flex w-full mb-6 border border-black rounded-sm overflow-hidden">
            <div className="w-full p-2 bg-[#e0f2fe] text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">CUSTOMER ACCOUNT BALANCES (STATEMENT SUMMARY)</p>
            </div>
        </div>

        <div className="flex-grow overflow-hidden">
            <table className="w-full border-collapse border border-black/10">
                <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: primaryBlue }}>
                        <th className="p-3 font-black text-[9px] uppercase border border-blue-900">CUSTOMER IDENTITY</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-blue-900">OPENING</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-blue-900">SALES</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-blue-900">COLLECTED</th>
                        <th className="p-3 text-right font-black text-[9px] uppercase w-32 border border-blue-900">CLOSING</th>
                    </tr>
                </thead>
                <tbody>
                    {customerSummary.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-100 h-10">
                            <td className="p-2.5 font-bold uppercase text-[10px] truncate max-w-[200px]">{c.name}</td>
                            <td className="p-2.5 text-right font-medium text-[10px] opacity-40">{formatCurrency(c.openingBalance)}</td>
                            <td className="p-2.5 text-right font-black text-[10px] text-blue-700">{formatCurrency(c.periodInvoiced)}</td>
                            <td className="p-2.5 text-right font-black text-[10px] text-green-700">{formatCurrency(c.periodPaid)}</td>
                            <td className="p-2.5 text-right font-black text-[11px] bg-slate-50">{formatCurrency(c.closingBalance)}</td>
                        </tr>
                    ))}
                    {customerSummary.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-[10px] font-black uppercase opacity-30 italic">No activity recorded for this period</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        <footer className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-end">
            <div className="text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                {companyName} &bull; Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black bg-gray-50 text-gray-400 px-4 py-1.5 rounded-sm uppercase font-mono">PAGE 1 OF {ledgerPages.length + 1}</p>
            </div>
        </footer>
      </div>

      {/* LEDGER PAGES */}
      {ledgerPages.map((pageData, pIdx) => (
          <div key={pIdx} className="a4-pdf-page p-[12mm] font-sans text-black bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden">
             <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <Badge className="bg-black text-white font-black uppercase text-[9px] px-3 h-6">AUDIT TRAIL</Badge>
                    <h3 className="text-lg font-black uppercase tracking-tighter m-0">Detailed Transaction Ledger</h3>
                </div>
                <div className="text-right"><p className="text-[12px] font-black uppercase text-slate-300 m-0">{companyName}</p></div>
             </header>

             <div className="flex-grow overflow-hidden">
                <table className="w-full border-collapse border border-black/10">
                    <thead className="text-white" style={{ backgroundColor: primaryBlue }}>
                        <tr className="text-left">
                            <th className="p-3 font-black text-[9px] uppercase w-24 border border-blue-900">Date</th>
                            <th className="p-3 font-black text-[9px] uppercase border border-blue-900">Reference & Description</th>
                            <th className="p-3 font-black text-[9px] uppercase w-24 text-center border border-blue-900">Protocol</th>
                            <th className="p-3 text-right font-black text-[9px] uppercase w-36 border border-blue-900">Value (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any, i) => {
                            const isIncome = item.ledgerType === 'INFLOW';
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={i} className="border-b border-gray-100 h-10">
                                    <td className="p-2.5 font-mono text-[9px] font-bold opacity-40">{format(parseISO(item.date), 'dd/MM/yy')}</td>
                                    <td className="p-2.5">
                                        <p className="font-black uppercase text-[10px] truncate max-w-[320px] tracking-tight">{item.label}</p>
                                    </td>
                                    <td className="p-2.5 text-center">
                                        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {item.ledgerType}
                                        </span>
                                    </td>
                                    <td className={cn("p-2.5 text-right font-black tabular-nums text-[10px]", isIncome ? "text-green-700" : "text-red-700")}>
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{companyName} &bull; Detailed Ledger Audit</p>
                <p className="text-[10px] font-black bg-gray-50 text-gray-400 px-4 py-1.5 rounded-sm tracking-widest font-mono">PAGE {pIdx + 2} OF {ledgerPages.length + 1}</p>
             </footer>
          </div>
      ))}
    </div>
  );
}
