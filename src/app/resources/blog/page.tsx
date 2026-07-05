'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-3 text-center md:text-left">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Updates</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Blog & News</h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium">
              The latest platform updates, industry trends, and business growth strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="group cursor-pointer">
                    <div className="aspect-video bg-muted rounded-xl mb-3 overflow-hidden border border-black/5 shadow-sm">
                        <img src={`https://picsum.photos/seed/blog${i}/500/300`} alt="blog" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-primary">
                            <Calendar className="h-2.5 w-2.5" />
                            Oct {10 + i}, 2026
                        </div>
                        <h3 className="text-base font-black uppercase tracking-tight group-hover:text-primary transition-colors">How to scale your retail shop in 2026</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">Discover the top strategies for managing multiple inventory nodes across different cities.</p>
                        <div className="pt-1 flex items-center text-[10px] font-bold uppercase tracking-widest group-hover:gap-1.5 transition-all">Read more <ArrowRight className="ml-1 h-3 w-3" /></div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
