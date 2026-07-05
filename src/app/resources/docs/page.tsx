'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Book, FileText, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DocsPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Resources</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Documentation</h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium">
              Everything you need to set up, manage, and scale your shop using our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer group shadow-sm bg-white">
              <Book className="h-6 w-6 text-primary mb-3" />
              <h4 className="font-black uppercase tracking-tight text-sm">Getting Started</h4>
              <p className="text-xs text-muted-foreground mt-2">Learn the basics of shop setup and user management.</p>
            </div>
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer group shadow-sm bg-white">
              <FileText className="h-6 w-6 text-primary mb-3" />
              <h4 className="font-black uppercase tracking-tight text-sm">Module Guides</h4>
              <p className="text-xs text-muted-foreground mt-2">Deep dives into POS, Inventory, and Accounting.</p>
            </div>
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer group shadow-sm bg-white">
              <Code className="h-6 w-6 text-primary mb-3" />
              <h4 className="font-black uppercase tracking-tight text-sm">API Reference</h4>
              <p className="text-xs text-muted-foreground mt-2">Integrate our platform with your existing tools.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
