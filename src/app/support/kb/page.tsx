'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { HelpCircle, Search, LifeBuoy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function KnowledgeBasePage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Help Center</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Knowledge Base</h1>
            <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input placeholder="Search for articles, guides, or solutions..." className="h-16 pl-12 text-lg rounded-2xl shadow-xl border-none ring-1 ring-black/5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="p-8 border rounded-[32px] space-y-4 hover:border-primary transition-colors cursor-pointer">
                <LifeBuoy className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight">Troubleshooting</h3>
                <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                    <li className="hover:text-primary">Printer configuration</li>
                    <li className="hover:text-primary">M-Pesa payment issues</li>
                    <li className="hover:text-primary">Login problems</li>
                </ul>
            </div>
            <div className="p-8 border rounded-[32px] space-y-4 hover:border-primary transition-colors cursor-pointer">
                <Zap className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight">Best Practices</h3>
                <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                    <li className="hover:text-primary">Optimizing inventory</li>
                    <li className="hover:text-primary">Daily cash-up tips</li>
                    <li className="hover:text-primary">Managing staff roles</li>
                </ul>
            </div>
            <div className="p-8 border rounded-[32px] space-y-4 hover:border-primary transition-colors cursor-pointer">
                <HelpCircle className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight">FAQ</h3>
                <ul className="space-y-2 text-sm text-muted-foreground font-medium">
                    <li className="hover:text-primary">Billing & Plans</li>
                    <li className="hover:text-primary">Data Exporting</li>
                    <li className="hover:text-primary">Security Features</li>
                </ul>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
