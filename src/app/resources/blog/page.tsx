'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4 text-center md:text-left">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Updates</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Blog & News</h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              The latest platform updates, industry trends, and business growth strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
            {[1, 2, 3].map(i => (
                <div key={i} className="group cursor-pointer">
                    <div className="aspect-video bg-muted rounded-2xl mb-4 overflow-hidden border border-black/5 shadow-sm">
                        <img src={`https://picsum.photos/seed/blog${i}/600/400`} alt="blog" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                            <Calendar className="h-3 w-3" />
                            Oct {10 + i}, 2026
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">How to scale your retail shop in 2026</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">Discover the top strategies for managing multiple inventory nodes across different cities.</p>
                        <div className="pt-2 flex items-center text-xs font-bold uppercase tracking-widest group-hover:gap-2 transition-all">Read more <ArrowRight className="ml-2 h-4 w-4" /></div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
