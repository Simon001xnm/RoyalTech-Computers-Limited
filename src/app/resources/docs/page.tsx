'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Book, Search, FileText, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DocsPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Resources</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Everything you need to set up, manage, and scale your shop using our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer">
              <Book className="h-8 w-8 text-primary mb-4" />
              <h4 className="font-black uppercase tracking-tight">Getting Started</h4>
              <p className="text-sm text-muted-foreground mt-2">Learn the basics of shop setup and user management.</p>
            </div>
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h4 className="font-black uppercase tracking-tight">Module Guides</h4>
              <p className="text-sm text-muted-foreground mt-2">Deep dives into POS, Inventory, and Accounting.</p>
            </div>
            <div className="p-6 border rounded-2xl hover:border-primary transition-colors cursor-pointer">
              <Code className="h-8 w-8 text-primary mb-4" />
              <h4 className="font-black uppercase tracking-tight">API Reference</h4>
              <p className="text-sm text-muted-foreground mt-2">Integrate our platform with your existing tools.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
