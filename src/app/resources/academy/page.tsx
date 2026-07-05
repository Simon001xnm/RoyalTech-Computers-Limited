'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { GraduationCap, PlayCircle, BookOpen, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AcademyPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Learning</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Academy</h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Master our platform with video tutorials, interactive courses, and certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
             <div className="flex gap-6 p-8 bg-primary/5 rounded-3xl border border-primary/10">
                <PlayCircle className="h-12 w-12 text-primary shrink-0" />
                <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">Video Tutorials</h3>
                    <p className="text-muted-foreground text-sm font-medium">Quick 2-minute guides on every feature from selling to reports.</p>
                </div>
             </div>
             <div className="flex gap-6 p-8 bg-primary/5 rounded-3xl border border-primary/10">
                <Award className="h-12 w-12 text-primary shrink-0" />
                <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">Certification</h3>
                    <p className="text-muted-foreground text-sm font-medium">Become a certified ShopManager Expert and grow your career.</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
