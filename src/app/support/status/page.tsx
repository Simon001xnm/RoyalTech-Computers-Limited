'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { CheckCircle2, Zap, ShieldCheck, Globe, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ServiceStatusPage() {
  const systems = [
    { name: 'Core Cloud API', status: 'Operational' },
    { name: 'Document Engine', status: 'Operational' },
    { name: 'M-Pesa STK Push Gateway', status: 'Operational' },
    { name: 'User Authentication', status: 'Operational' },
    { name: 'Mail Servers', status: 'Operational' },
  ];

  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Badge className="bg-green-500 text-white uppercase font-black text-[10px] px-4">All Systems Online</Badge>
            <h1 className="text-5xl font-black uppercase tracking-tighter">Service Status</h1>
            <p className="text-xl text-muted-foreground font-medium">Real-time status updates for all ShopManager services.</p>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="bg-green-50 p-6 flex items-center justify-between border-b border-green-100">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span className="font-bold text-green-800">All systems are functioning normally.</span>
                </div>
                <span className="text-[10px] font-black uppercase text-green-600">Updated Oct 23, 10:45 AM</span>
            </div>
            <div className="divide-y">
                {systems.map(sys => (
                    <div key={sys.name} className="p-6 flex items-center justify-between">
                        <span className="font-black uppercase text-sm tracking-tight">{sys.name}</span>
                        <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-xs font-bold text-green-600 uppercase">{sys.status}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
          <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-muted/30 rounded-3xl space-y-2">
                <Activity className="h-6 w-6 text-primary" />
                <h4 className="font-black uppercase text-sm">99.9% Uptime</h4>
                <p className="text-xs text-muted-foreground font-medium">Industry leading reliability across our global data centers.</p>
            </div>
            <div className="p-8 bg-muted/30 rounded-3xl space-y-2">
                <Zap className="h-6 w-6 text-primary" />
                <h4 className="font-black uppercase text-sm">Response Time</h4>
                <p className="text-xs text-muted-foreground font-medium">Average API response time of 45ms for all core services.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
