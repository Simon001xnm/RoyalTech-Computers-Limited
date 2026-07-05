'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Smartphone, Zap, Cloud, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MobileMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Mobility</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">
              Your business, <br/><span className="text-primary">in your pocket</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Access your POS, stock list, and reports from any device. Optimized for mobile efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <Smartphone className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Responsive POS</h3>
              <p className="text-muted-foreground font-medium">Sell items and accept payments from your smartphone or tablet with our optimized mobile checkout.</p>
            </div>
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <Cloud className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Real-time Sync</h3>
              <p className="text-muted-foreground font-medium">All mobile actions are instantly reflected in your cloud database, keeping your inventory accurate.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
