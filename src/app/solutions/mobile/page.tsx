'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Smartphone, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MobileMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Mobility</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              Your business, <br/><span className="text-primary">in your pocket</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              Access your POS, stock list, and reports from any device. Optimized for mobile efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Smartphone className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Responsive POS</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Sell items and accept payments from your smartphone or tablet with our optimized mobile checkout.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Cloud className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Real-time Sync</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">All mobile actions are instantly reflected in your cloud database, keeping your inventory accurate.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
