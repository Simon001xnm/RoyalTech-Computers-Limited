'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { Zap, ShieldCheck, TrendingUp, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Our Way</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Our Journey</h1>
            <p className="text-sm text-muted-foreground font-medium max-w-xl mx-auto">
                We started as a small tool for one shop, and now we help thousands of shops run easily every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tighter">Our Goal</h2>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    We didn't want to build something complex. We just wanted to help local shop owners who were tired of messy books and lost stock.
                </p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    By listening to real people like you, we learned that shops need a simple, safe way to keep their records online so they never lose track of their hard work.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">Stays Working</div>
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">Easy to Use</div>
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">Safe Folders</div>
                </div>
            </div>
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-sm border ring-8 ring-muted/20">
                <img src="/e67446fc8d42269a84b386aa69931b34.jpg" alt="evolution" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">How we grew</h3>
                <p className="text-xs text-muted-foreground font-medium">Built with care for shop owners.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border rounded-2xl space-y-3 shadow-sm">
                    <div className="bg-primary/5 p-2 rounded-lg w-fit"><Zap className="h-4 w-4 text-primary" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">Step 1: The Start</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">We made it easy to track serial numbers and print clean receipts. It was fast and simple for small shops.</p>
                </div>
                <div className="p-6 bg-primary text-primary-foreground border rounded-2xl space-y-3 shadow-xl">
                    <div className="bg-white/10 p-2 rounded-lg w-fit"><Globe className="h-4 w-4 text-white" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">Step 2: Moving Online</h4>
                    <p className="text-[10px] opacity-80 leading-relaxed">We moved everything to the cloud. This means you can see your shop from your phone, and your data is always backed up and safe.</p>
                </div>
                <div className="p-6 bg-white border rounded-2xl space-y-3 shadow-sm">
                    <div className="bg-primary/5 p-2 rounded-lg w-fit"><TrendingUp className="h-4 w-4 text-primary" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">Step 3: The Full Suite</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Today, we have everything. From M-Pesa automatic payments to clear reports and controls for your staff.</p>
                </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
