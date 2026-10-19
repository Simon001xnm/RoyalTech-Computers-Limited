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
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Client List</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
              Keep your customers <br/><span className="text-primary">happy and organized</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
              Manage every person who buys from you, see who owes you money, and grow your shop with an easy client list.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Customer Profiles</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">Store names, phone numbers, and what they bought in one safe place. Never lose a contact again.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-black/5">
              <Target className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase tracking-tight">Track Debts</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">See exactly who owes you money and for how long. Send them reminders easily from the system.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
