'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { DollarSign, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AccountingMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Finance</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              Accounting for the <br/><span className="text-primary">modern enterprise</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              Simplify your books, track expenses, and generate professional profit and loss reports with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <DollarSign className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Cloud Ledger</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Your financial data is synced across all nodes instantly. Monitor cash flow in real-time from anywhere.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <PieChart className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Audit-Ready Reports</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Generate high-fidelity P&L statements and balance sheets that are ready for your bank or tax authority.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
