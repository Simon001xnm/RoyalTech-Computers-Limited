'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Users, Target, Zap, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CrmMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Solutions</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">
              A CRM that puts <br/><span className="text-primary">relationships first</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Manage every interaction, automate your sales process, and grow your customer base with our enterprise-grade CRM platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <Users className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Contact Management</h3>
              <p className="text-muted-foreground font-medium">Store detailed profiles, interaction history, and preferences for every client in one secure place.</p>
            </div>
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <Target className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Lead Tracking</h3>
              <p className="text-muted-foreground font-medium">Never lose a prospect. Track leads through your custom sales funnel with real-time status updates.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
