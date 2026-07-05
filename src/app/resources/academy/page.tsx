'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { GraduationCap, PlayCircle, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AcademyPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Learning</Badge>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Academy</h1>
            <p className="text-base text-muted-foreground max-w-xl font-medium">
              Master our platform with video tutorials, interactive courses, and certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
             <div className="flex gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <PlayCircle className="h-8 w-8 text-primary shrink-0" />
                <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Video Tutorials</h3>
                    <p className="text-muted-foreground text-xs font-medium">Quick 2-minute guides on every feature from selling to reports.</p>
                </div>
             </div>
             <div className="flex gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <Award className="h-8 w-8 text-primary shrink-0" />
                <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Certification</h3>
                    <p className="text-muted-foreground text-xs font-medium">Become a certified ShopManager Expert and grow your career.</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
