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

const SUMMARY_ITEMS_PER_PAGE = 18;
const LEDGER_ITEMS_PER_PAGE = 22;

export function PnlReport({ data, dateRange }: PnlReportProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => 
    tenant?.id ? doc(firestore, 'companies', tenant.id) : null,
    [firestore, tenant?.id]
  );
  const { data: company } = useDoc<any>(companyRef);

  const { sales, expenses, operatingIncome, costOfGoodsSold, operatingExpenses, netIncome } = data;

  const totalInput = operatingIncome.totalSales;
  const totalCost = costOfGoodsSold.totalCogs;
  const totalExpenses = operatingExpenses.totalExpenses;
  const totalOutflow = totalCost + totalExpenses;

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

  // PAGINATION FOR SUMMARY
  const summaryPages: any[][] = [];
  for (let i = 0; i < customerSummary.length; i += SUMMARY_ITEMS_PER_PAGE) {
      summaryPages.push(customerSummary.slice(i, i + SUMMARY_ITEMS_PER_PAGE));
  }
  if (summaryPages.length === 0) summaryPages.push([]);

  const unifiedLedger = [
      ...sales.map((s: any) => ({ 
        ...s, 
        isIncome: true,
        actualType: s.type || (Number(s.balance) > 0 ? 'Invoice' : 'Receipt'), 
        label: s.customerName || 'Sale' 
      })),
      ...expenses.map((e: any) => ({ 
        ...e, 
        isIncome: false,
        actualType: 'Expense', 
        label: e.category || 'Expense' 
      }))
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const ledgerPages: any[][] = [];
  for (let i = 0; i < unifiedLedger.length; i += LEDGER_ITEMS_PER_PAGE) {
      ledgerPages.push(unifiedLedger.slice(i, i + LEDGER_ITEMS_PER_PAGE));
  }

  const companyName = company?.name || 'MATESH TECHNOLOGIES';
  const jetBlack = "#000000";
  const primaryBlue = "#1e3a8a";

  return (
    <div className="flex flex-col items-center gap-0 bg-slate-200 no-scrollbar" style={{ color: jetBlack }}>
      
      {/* SUMMARY PAGES */}
      {summaryPages.map((pageData, sIdx) => (
        <div 
            key={`sum-${sIdx}`} 
            className="a4-pdf-page p-[12mm] font-sans bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
            style={{ color: jetBlack }}
        >
          <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
              <div className="flex items-center gap-6">
                {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="h-24 w-auto object-contain" crossOrigin="anonymous" />
                ) : (
                    <div className="h-16 w-16 bg-gray-50 flex items-center justify-center text-[10px] font-black border-2 border-dashed border-black text-black">LOGO</div>
                )}
                <div className="space-y-0.5">
                  <h1 className="text-[28px] font-black uppercase tracking-tighter" style={{ color: jetBlack }}>{companyName}</h1>
                  <p className="font-bold text-[10px] uppercase tracking-widest">Official Auditor Statement</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                  <p className="font-black text-[10px] uppercase">HEAD OFFICE</p>
                  <p className="text-[9px] font-bold leading-tight max-w-[200px] uppercase">{company?.address || 'Nairobi, Kenya'}</p>
                  <div className="pt-2">
                      <p className="text-[11px] font-black uppercase">
                          {dateRange?.from ? format(dateRange.from, 'dd MMM yy') : '--'} - {dateRange?.to ? format(dateRange.to, 'dd MMM yy') : '--'}
                      </p>
                  </div>
              </div>
          </header>

          {sIdx === 0 && (
            <section className="mb-8 p-6 border-2 border-black rounded-sm bg-slate-50 grid grid-cols-4 gap-4">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Input (Revenue)</p>
                    <p className="text-sm font-black">KES {formatCurrency(totalInput)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Purchase Cost</p>
                    <p className="text-sm font-black">KES {formatCurrency(totalCost)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Operating Exp</p>
                    <p className="text-sm font-black">KES {formatCurrency(totalExpenses)}</p>
                </div>
                <div className="space-y-1 border-l-2 border-black pl-4">
                    <p className="text-[9px] font-black uppercase text-black">Net Profit</p>
                    <p className="text-lg font-black underline underline-offset-4">KES {formatCurrency(netIncome)}</p>
                </div>
            </section>
          )}

          <div className="flex w-full mb-6 border border-black rounded-sm overflow-hidden">
              <div className="w-full p-2 bg-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">CUSTOMER ACCOUNT BALANCES (PAGE {sIdx + 1})</p>
              </div>
          </div>

          <div className="flex-grow overflow-hidden">
              <table className="w-full border-collapse border border-black">
                  <thead>
                      <tr className="text-left bg-black text-white">
                          <th className="p-3 font-black text-[9px] uppercase border border-black">CUSTOMER IDENTITY</th>
                          <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-black">OPENING</th>
                          <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-black">SALES</th>
                          <th className="p-3 text-right font-black text-[9px] uppercase w-28 border border-black">COLLECTED</th>
                          <th className="p-3 text-right font-black text-[9px] uppercase w-32 border border-black">CLOSING</th>
                      </tr>
                  </thead>
                  <tbody>
                      {pageData.map((c: any, idx: number) => (
                          <tr key={idx} className="border-b border-black">
                              <td className="p-3 font-bold uppercase text-[10px] truncate max-w-[200px] border-x border-black">{c.name}</td>
                              <td className="p-3 text-right font-bold text-[10px] border-r border-black">{formatCurrency(c.openingBalance)}</td>
                              <td className="p-3 text-right font-black text-[10px] border-r border-black">{formatCurrency(c.periodInvoiced)}</td>
                              <td className="p-3 text-right font-black text-[10px] border-r border-black">{formatCurrency(c.periodPaid)}</td>
                              <td className="p-3 text-right font-black text-[11px] bg-slate-50 border-r border-black">{formatCurrency(c.closingBalance)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          <footer className="mt-auto pt-6 border-t border-black flex flex-col gap-1">
              <div className="text-center space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-tight text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryBlue }}>{companyName}</p>
                  <p className="text-[8px] font-bold text-black">Phone: {company?.phone || '+254701694469'}. Email: {company?.email || 'mateshtechltd@gmail.com'}</p>
              </div>
              <div className="flex justify-between items-center pt-4">
                  <div className="text-left">
                      <p className="text-[8px] font-black text-black uppercase tracking-widest">GENERATED: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <p className="text-[10px] font-black text-black uppercase font-mono">PAGE {sIdx + 1} OF {summaryPages.length + ledgerPages.length}</p>
              </div>
          </footer>
        </div>
      ))}

      {/* LEDGER PAGES */}
      {ledgerPages.map((pageData, pIdx) => (
          <div 
            key={`ledger-${pIdx}`} 
            className="a4-pdf-page p-[12mm] font-sans bg-white w-[210mm] h-[297mm] flex flex-col box-border shadow-2xl relative overflow-hidden"
            style={{ color: jetBlack }}
          >
             <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <Badge className="bg-black text-white font-black uppercase text-[9px] px-3 h-6 border-none">AUDIT TRAIL</Badge>
                    <h3 className="text-lg font-black uppercase tracking-tighter m-0">Detailed Transaction Ledger</h3>
                </div>
                <div className="text-right"><p className="text-[12px] font-black uppercase opacity-40 m-0">{companyName}</p></div>
             </header>

             <div className="flex-grow overflow-hidden">
                <table className="w-full border-collapse border border-black">
                    <thead className="bg-black text-white">
                        <tr className="text-left">
                            <th className="p-4 font-black text-[9px] uppercase w-24 border border-black">Date</th>
                            <th className="p-4 font-black text-[9px] uppercase border border-black">Reference & Description</th>
                            <th className="p-4 font-black text-[9px] uppercase w-24 text-center border border-black">MAT</th>
                            <th className="p-4 text-right font-black text-[9px] uppercase w-36 border border-black">CASH (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item: any, i) => {
                            const isIncome = item.isIncome;
                            const amount = Number(item.total || item.amount || 0);
                            return (
                                <tr key={i} className="border-b border-black">
                                    <td className="p-4 font-mono text-[9px] font-black border-x border-black align-middle">{format(parseISO(item.date), 'dd/MM/yy')}</td>
                                    <td className="p-4 align-middle border-r border-black">
                                        <p className="font-black uppercase text-[10px] leading-tight tracking-tight">{item.label}</p>
                                    </td>
                                    <td className="p-4 text-center align-middle border-r border-black">
                                        <span className={cn("text-[8px] font-black uppercase px-2 py-1 rounded inline-block border border-black", isIncome ? "bg-slate-50" : "bg-slate-200")}>
                                            {item.actualType}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black tabular-nums text-[11px] align-middle border-r border-black">
                                        {formatCurrency(amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>

             <footer className="mt-auto pt-6 border-t border-black flex flex-col gap-1">
                <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-tight text-black">THIS RECEIPT IS ELECTRONICALLY GENERATED AND DOES NOT REQUIRE A SIGNATURE</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryBlue }}>{companyName}</p>
                    <p className="text-[8px] font-bold text-black">Phone: {company?.phone || '+254701694469'}. Email: {company?.email || 'mateshtechltd@gmail.com'}</p>
                </div>
                <div className="flex justify-between items-center pt-4">
                    <div className="text-left">
                        <p className="text-[8px] font-black text-black uppercase tracking-widest">GENERATED: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <p className="text-[10px] font-black text-black uppercase font-mono">PAGE {summaryPages.length + pIdx + 1} OF {summaryPages.length + ledgerPages.length}</p>
                </div>
             </footer>
          </div>
      ))}
    </div>
  );
}