'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { BookOpen, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AccountingMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Finance</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">
              Accounting for the <br/><span className="text-primary">modern enterprise</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Simplify your books, track expenses, and generate professional profit and loss reports with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <DollarSign className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Cloud Ledger</h3>
              <p className="text-muted-foreground font-medium">Your financial data is synced across all nodes instantly. Monitor cash flow in real-time from anywhere.</p>
            </div>
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <PieChart className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Audit-Ready Reports</h3>
              <p className="text-muted-foreground font-medium">Generate high-fidelity P&L statements and balance sheets that are ready for your bank or tax authority.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
