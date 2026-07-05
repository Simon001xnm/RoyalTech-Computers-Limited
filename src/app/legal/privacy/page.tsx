'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Legal</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-tight">Privacy Policy</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Last updated: October 2026</p>
          </div>

          <div className="space-y-6 font-medium text-muted-foreground leading-relaxed text-sm">
            <div className="p-6 bg-muted/30 rounded-2xl border border-black/5 space-y-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-black uppercase tracking-tight text-black">Our Commitment</h3>
                <p className="text-xs">We do not own or sell your data. We make money from software license fees, not from advertising. Your business information is your property, and we treat it with the absolute highest level of confidentiality.</p>
            </div>

            <section className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">1. Information We Collect</h2>
                <p className="text-xs">We collect information necessary to provide our services, including business name, contact details, and transaction data stored in your workspace. We do not access your transaction content except for automated processing and technical support requested by you.</p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">2. How We Use Data</h2>
                <p className="text-xs">Data is used exclusively to facilitate your shop's operations, generate your requested reports, and improve the platform's security and performance. We use aggregated, anonymized data for system-wide analytics to optimize our infrastructure.</p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">3. Data Security</h2>
                <p className="text-xs">We implement multi-tenant isolation at the database level. Each workspace is a cryptographically distinct node. Data is encrypted in transit using TLS 1.3 and at rest using AES-256.</p>
            </section>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
