'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { Clock, Rocket, ShieldCheck, Zap } from 'lucide-react';

export default function OurStoryPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Timeline</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-tight">Our Story</h1>
            <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                From a single shop in Nairobi to a cloud platform serving business nodes globally. 
            </p>
          </div>

          <div className="space-y-0 relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />

            <div className="relative pl-12 pb-12">
                <div className="absolute left-0 top-0 h-8 w-8 bg-white border-2 border-muted rounded-full flex items-center justify-center z-10">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">2020: v1.0 Launch</Badge>
                    <h3 className="text-sm font-black uppercase tracking-tight">The Hardware Era</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        We built Version 1.0 as a focused tool for technical retailers. It introduced high-precision serial number tracking and bank-grade PDF receipts. It was "The Golden Version" for local shops.
                    </p>
                </div>
            </div>

            <div className="relative pl-12 pb-12">
                <div className="absolute left-0 top-0 h-8 w-8 bg-white border-2 border-primary rounded-full flex items-center justify-center z-10">
                    <Rocket className="h-3 w-3 text-primary" />
                </div>
                <div className="space-y-2">
                    <Badge className="text-[8px] font-black uppercase tracking-widest">2024: v2.0 Evolution</Badge>
                    <h3 className="text-sm font-black uppercase tracking-tight">Scaling to the Cloud</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        The platform evolved into a SaaS ecosystem. We implemented multi-tenant isolation, allowing any business to sign up and instantly get their own secure shop node without waiting for admin approval.
                    </p>
                </div>
            </div>

            <div className="relative pl-12 pb-12">
                <div className="absolute left-0 top-0 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center z-10 shadow-lg">
                    <ShieldCheck className="h-3 w-3" />
                </div>
                <div className="space-y-2">
                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest">Today: Enterprise Control</Badge>
                    <h3 className="text-sm font-black uppercase tracking-tight">The Modern Business Node</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Our latest iteration focuses on granular power. Admins can now provision staff with module-specific permissions, automate M-Pesa STK pushes, and generate professional documents in seconds.
                    </p>
                </div>
            </div>
          </div>

          <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-4">
             <h4 className="text-sm font-black uppercase tracking-widest text-primary">Ready to join the story?</h4>
             <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">Start your own shop node today and experience the evolution of business management.</p>
             <div className="pt-2">
                <button className="h-10 px-8 bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg active:scale-95 transition-all">Get Started Free</button>
             </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
