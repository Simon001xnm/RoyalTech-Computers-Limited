'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';

export default function OurStoryPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Journey</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Our Story</h1>
            <p className="text-base text-muted-foreground font-medium max-w-xl leading-relaxed">
                From a single shop in Nairobi to a cloud platform serving thousands of users globally. 
            </p>
          </div>

          <div className="space-y-10">
            <div className="border-l-2 border-primary pl-6 relative py-2">
                <div className="absolute left-[-5px] top-0 h-2 w-2 bg-primary rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tight">2020: The Spark</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">Started as a custom inventory script for a local computer shop, built to solve the frustration of manual receipts.</p>
            </div>
            <div className="border-l-2 border-primary pl-6 relative py-2">
                <div className="absolute left-[-5px] top-0 h-2 w-2 bg-primary rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tight">2022: Scaling Up</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">Launched our first cloud-based POS module with M-Pesa integration, allowing shops to accept digital payments instantly.</p>
            </div>
             <div className="border-l-2 border-primary pl-6 relative py-2">
                <div className="absolute left-[-5px] top-0 h-2 w-2 bg-primary rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tight">Today: The Platform</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">A unified business suite serving diverse industries, from tech retail to hardware leasing and professional services.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
