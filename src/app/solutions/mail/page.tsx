'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Mail, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MailMarketingPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Communication</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">
              Secure email for <br/><span className="text-primary">professional teams</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              A private, ad-free email service designed to keep your business communication secure and organized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <ShieldCheck className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Privacy First</h3>
              <p className="text-muted-foreground font-medium">We don't scan your emails for ads. Your data belongs to you, protected by industry-leading encryption.</p>
            </div>
            <div className="p-8 bg-muted/30 rounded-[32px] space-y-4">
              <Zap className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Team Collaboration</h3>
              <p className="text-muted-foreground font-medium">Integrated chat and task management alongside your inbox to keep your team in sync.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
