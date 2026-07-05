'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { ShieldCheck, Lock, EyeOff, Key, Database, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SecurityCompliancePage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4">
            <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Privacy</Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Security & <br/>Compliance</h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              We treat your business data with the highest level of security. Multi-tenant isolation is built into our core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="bg-primary/5 p-4 rounded-2xl"><Lock className="h-8 w-8 text-primary" /></div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Encryption at Rest</h3>
                        <p className="text-muted-foreground font-medium mt-2 leading-relaxed">All sensitive data, including customer records and financial ledgers, are encrypted using industry-standard AES-256 protocols.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-primary/5 p-4 rounded-2xl"><Database className="h-8 w-8 text-primary" /></div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Isolated Tenancy</h3>
                        <p className="text-muted-foreground font-medium mt-2 leading-relaxed">Our infrastructure ensures that data from different workspaces never touches. Your business logic is cryptographically siloed.</p>
                    </div>
                </div>
            </div>
            <div className="bg-black text-white p-10 rounded-[48px] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="h-32 w-32" /></div>
                <h4 className="text-2xl font-black uppercase tracking-tighter">Compliance Standards</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm font-bold uppercase tracking-widest">GDPR COMPLIANT</span></div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm font-bold uppercase tracking-widest">SOC 2 TYPE II (PENDING)</span></div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm font-bold uppercase tracking-widest">KRA COMPLIANT REPORTING</span></div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
