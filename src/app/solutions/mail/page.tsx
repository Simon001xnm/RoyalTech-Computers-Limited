'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MailMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Communication</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              Secure email for <br/><span className="text-primary">professional teams</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              A private, ad-free email service designed to keep your business communication secure and organized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Privacy First</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">We don't scan your emails for ads. Your data belongs to you, protected by industry-leading encryption.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Team Collaboration</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Integrated chat and task management alongside your inbox to keep your team in sync.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
