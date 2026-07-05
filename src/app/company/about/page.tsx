'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Our Company</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">About Us</h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                We build the software that builds your business. A team of engineers and dreamers obsessed with retail efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Our Mission</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    To provide every entrepreneur, from small retail nodes to large enterprises, with the tools they need to track, manage, and grow their life's work without technical barriers.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                    <div className="px-4 py-2 bg-muted/50 rounded-full text-[9px] font-black uppercase tracking-widest">Innovation</div>
                    <div className="px-4 py-2 bg-muted/50 rounded-full text-[9px] font-black uppercase tracking-widest">Reliability</div>
                    <div className="px-4 py-2 bg-muted/50 rounded-full text-[9px] font-black uppercase tracking-widest">Privacy</div>
                </div>
            </div>
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-sm">
                <img src="https://picsum.photos/seed/about/600/600" alt="team" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
