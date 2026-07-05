'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Legal</Badge>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight">Terms of Service</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Last updated: October 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-12 font-medium text-muted-foreground leading-relaxed">
            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">1. Acceptance of Terms</h2>
                <p>By creating an account and using the ShopManager platform, you agree to be bound by these terms. If you are using the platform on behalf of a business, that business also accepts these terms.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">2. Service Usage</h2>
                <p>You are responsible for all activity that occurs under your account. You must keep your credentials secure. We grant you a limited, non-exclusive license to use the platform for your business operations.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">3. Subscription & Billing</h2>
                <p>Fees are billed in advance on a monthly or annual basis. Failure to pay fees will result in account suspension. We offer a "Legacy Pro" protection for early adopters, which may be modified with 30 days notice.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">4. Termination</h2>
                <p>We reserve the right to suspend or terminate accounts that violate our security policies or legal requirements. You may cancel your subscription at any time.</p>
            </section>

            <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-primary shrink-0" />
                <p className="text-sm italic font-bold">"Goods once sold cannot be returned" is our platform-wide standard for retail transactions processed through our system, subject to your local jurisdiction's laws.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
