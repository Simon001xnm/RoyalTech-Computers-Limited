'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, EyeOff, Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Legal</Badge>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight">Privacy Policy</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Last updated: October 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 font-medium text-muted-foreground leading-relaxed">
            <div className="p-8 bg-muted/30 rounded-3xl border border-black/5 space-y-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight text-black">Our Commitment</h3>
                <p>We do not own or sell your data. We make money from software license fees, not from advertising. Your business information is your property, and we treat it with the absolute highest level of confidentiality.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">1. Information We Collect</h2>
                <p>We collect information necessary to provide our services, including business name, contact details, and transaction data stored in your workspace. We do not access your transaction content except for automated processing and technical support requested by you.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">2. How We Use Data</h2>
                <p>Data is used exclusively to facilitate your shop's operations, generate your requested reports, and improve the platform's security and performance. We use aggregated, anonymized data for system-wide analytics to optimize our infrastructure.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">3. Data Security</h2>
                <p>We implement multi-tenant isolation at the database level. Each workspace is a cryptographically distinct node. Data is encrypted in transit using TLS 1.3 and at rest using AES-256.</p>
            </section>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
