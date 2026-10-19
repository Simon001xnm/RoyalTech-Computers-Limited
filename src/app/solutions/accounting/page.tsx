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
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Money Tracking</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              Easy way to track <br/><span className="text-primary">your shop money</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              Keep your books clean, track what you spend, and see your profit with simple reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <DollarSign className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Online Books</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Your money records are updated instantly. See how much money is coming in from anywhere on your phone.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <PieChart className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Clear Reports</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Print simple profit and loss papers that are ready for your bank or tax office whenever you need them.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
