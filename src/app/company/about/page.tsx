'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { Zap, Heart, Rocket, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Our Company</Badge>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">About Us</h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                We build the software that builds your business. A team of engineers and dreamers obsessed with retail efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-6">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Our Mission</h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                    To provide every entrepreneur, from small retail nodes to large enterprises, with the tools they need to track, manage, and grow their life's work without technical barriers.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-muted/50 rounded-full text-xs font-black uppercase tracking-widest">Innovation</div>
                    <div className="px-6 py-3 bg-muted/50 rounded-full text-xs font-black uppercase tracking-widest">Reliability</div>
                    <div className="px-6 py-3 bg-muted/50 rounded-full text-xs font-black uppercase tracking-widest">Privacy</div>
                </div>
            </div>
            <div className="aspect-square bg-muted rounded-[48px] overflow-hidden">
                <img src="https://picsum.photos/seed/about/800/800" alt="team" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
