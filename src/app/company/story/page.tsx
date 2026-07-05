'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { History, Zap, TrendingUp, Globe } from 'lucide-react';

export default function OurStoryPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Journey</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Our Story</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                From a single shop in Nairobi to a cloud platform serving thousands of users globally. 
            </p>
          </div>

          <div className="space-y-12">
            <div className="border-l-4 border-primary pl-8 relative py-4">
                <div className="absolute left-[-10px] top-0 h-4 w-4 bg-primary rounded-full shadow-lg shadow-primary/20" />
                <h3 className="text-2xl font-black uppercase tracking-tight">2020: The Spark</h3>
                <p className="text-muted-foreground font-medium mt-2">Started as a custom inventory script for a local computer shop, built to solve the frustration of manual receipts.</p>
            </div>
            <div className="border-l-4 border-primary pl-8 relative py-4">
                <div className="absolute left-[-10px] top-0 h-4 w-4 bg-primary rounded-full shadow-lg shadow-primary/20" />
                <h3 className="text-2xl font-black uppercase tracking-tight">2022: Scaling Up</h3>
                <p className="text-muted-foreground font-medium mt-2">Launched our first cloud-based POS module with M-Pesa integration, allowing shops to accept digital payments instantly.</p>
            </div>
             <div className="border-l-4 border-primary pl-8 relative py-4">
                <div className="absolute left-[-10px] top-0 h-4 w-4 bg-primary rounded-full shadow-lg shadow-primary/20" />
                <h3 className="text-2xl font-black uppercase tracking-tight">Today: The Platform</h3>
                <p className="text-muted-foreground font-medium mt-2">A unified business suite serving diverse industries, from tech retail to hardware leasing and professional services.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
