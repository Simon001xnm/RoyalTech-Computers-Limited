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
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Our Evolution</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">About Our Journey</h1>
            <p className="text-sm text-muted-foreground font-medium max-w-xl mx-auto">
                What started as a simple script for a local computer shop has evolved into a global business operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tighter">The Vision</h2>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    We didn't set out to build a giant platform. We set out to solve a simple problem: local shops were struggling with manual receipts and messy stock tracking.
                </p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    By listening to real business owners, we discovered that they needed more than just a list of items—they needed a secure, professional, and reliable way to handle their entire life's work in the cloud.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">Stability First</div>
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">User Focused</div>
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest border">Secure Nodes</div>
                </div>
            </div>
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-sm border ring-8 ring-muted/20">
                <img src="https://picsum.photos/seed/evolution/600/600" alt="evolution" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">How we evolved</h3>
                <p className="text-xs text-muted-foreground font-medium">A timeline of software craftsmanship.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border rounded-2xl space-y-3 shadow-sm">
                    <div className="bg-primary/5 p-2 rounded-lg w-fit"><Zap className="h-4 w-4 text-primary" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">v1: The Core</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">The "Golden Version." We perfected serial number tracking and basic receipt printing. It was local, fast, and reliable for single-shop owners.</p>
                </div>
                <div className="p-6 bg-primary text-primary-foreground border rounded-2xl space-y-3 shadow-xl">
                    <div className="bg-white/10 p-2 rounded-lg w-fit"><Globe className="h-4 w-4 text-white" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">v2: The SaaS Shift</h4>
                    <p className="text-[10px] opacity-80 leading-relaxed">We moved to the cloud. We introduced multi-tenant isolation, ensuring that every shop has its own secure "node" that never touches anyone else's data.</p>
                </div>
                <div className="p-6 bg-white border rounded-2xl space-y-3 shadow-sm">
                    <div className="bg-primary/5 p-2 rounded-lg w-fit"><TrendingUp className="h-4 w-4 text-primary" /></div>
                    <h4 className="font-black uppercase text-xs tracking-tight">Now: The Suite</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Today, we are a full business suite. From M-Pesa automated payments to high-fidelity document generation and granular staff controls.</p>
                </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
