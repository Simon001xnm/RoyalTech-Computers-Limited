'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Users, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CrmMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Solutions</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              A CRM that puts <br/><span className="text-primary">relationships first</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              Manage every interaction, automate your sales process, and grow your customer base with our enterprise-grade CRM platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Contact Management</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Store detailed profiles, interaction history, and preferences for every client in one secure place.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Target className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Lead Tracking</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Never lose a prospect. Track leads through your custom sales funnel with real-time status updates.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
