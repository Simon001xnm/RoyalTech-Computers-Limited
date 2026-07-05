'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { HelpCircle, Search, LifeBuoy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function KnowledgeBasePage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Help Center</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Knowledge Base</h1>
            <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search for articles, guides..." className="h-12 pl-10 text-sm rounded-xl shadow-lg border-none ring-1 ring-black/5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="p-6 border rounded-2xl space-y-3 hover:border-primary transition-colors cursor-pointer group bg-white shadow-sm">
                <LifeBuoy className="h-6 w-6 text-primary" />
                <h3 className="text-base font-black uppercase tracking-tight">Troubleshooting</h3>
                <ul className="space-y-1.5 text-[10px] text-muted-foreground font-medium">
                    <li className="hover:text-primary">• Printer configuration</li>
                    <li className="hover:text-primary">• M-Pesa payment issues</li>
                    <li className="hover:text-primary">• Login problems</li>
                </ul>
            </div>
            <div className="p-6 border rounded-2xl space-y-3 hover:border-primary transition-colors cursor-pointer group bg-white shadow-sm">
                <Zap className="h-6 w-6 text-primary" />
                <h3 className="text-base font-black uppercase tracking-tight">Best Practices</h3>
                <ul className="space-y-1.5 text-[10px] text-muted-foreground font-medium">
                    <li className="hover:text-primary">• Optimizing inventory</li>
                    <li className="hover:text-primary">• Daily cash-up tips</li>
                    <li className="hover:text-primary">• Managing staff roles</li>
                </ul>
            </div>
            <div className="p-6 border rounded-2xl space-y-3 hover:border-primary transition-colors cursor-pointer group bg-white shadow-sm">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h3 className="text-base font-black uppercase tracking-tight">FAQ</h3>
                <ul className="space-y-1.5 text-[10px] text-muted-foreground font-medium">
                    <li className="hover:text-primary">• Billing & Plans</li>
                    <li className="hover:text-primary">• Data Exporting</li>
                    <li className="hover:text-primary">• Security Features</li>
                </ul>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
