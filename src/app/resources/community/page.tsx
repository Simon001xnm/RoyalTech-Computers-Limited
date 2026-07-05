'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';

export default function CommunityPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Social</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Community</h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium">
              Join thousands of business owners. Share experiences, ask questions, and grow together.
            </p>
          </div>

          <div className="p-8 md:p-12 bg-black text-white rounded-[32px] text-center space-y-6 overflow-hidden relative shadow-xl">
             <div className="relative z-10 space-y-3">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Connect with peers</h2>
                <p className="text-gray-400 font-medium text-sm max-w-xl mx-auto leading-relaxed">
                    The ShopManager User Community is the best place to find tips from real-world business owners who use our platform every day.
                </p>
                <div className="pt-4">
                    <button className="h-12 px-10 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/90 transition-all">Join the Forum</button>
                </div>
             </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
