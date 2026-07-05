'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { MessageSquare, Users, Heart, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CommunityPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Social</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Community</h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Join thousands of business owners. Share experiences, ask questions, and grow together.
            </p>
          </div>

          <div className="p-12 bg-black text-white rounded-[48px] text-center space-y-8 overflow-hidden relative">
             <div className="relative z-10 space-y-4">
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Connect with peers</h2>
                <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto">
                    The ShopManager User Community is the best place to find tips from real-world business owners who use our platform every day.
                </p>
                <div className="pt-6">
                    <button className="h-16 px-12 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all">Join the Forum</button>
                </div>
             </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
