'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Activity } from 'lucide-react';
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
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge className="bg-green-500 text-white uppercase font-black text-[9px] px-3">All Systems Online</Badge>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Service Status</h1>
            <p className="text-sm text-muted-foreground font-medium">Real-time status updates for all ShopManager services.</p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-green-50 p-4 flex items-center justify-between border-b border-green-100">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-800 text-xs">All systems are functioning normally.</span>
                </div>
                <span className="text-[8px] font-black uppercase text-green-600">Updated Oct 23, 10:45 AM</span>
            </div>
            <div className="divide-y divide-black/5">
                {systems.map(sys => (
                    <div key={sys.name} className="p-4 flex items-center justify-between">
                        <span className="font-black uppercase text-xs tracking-tight">{sys.name}</span>
                        <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-bold text-green-600 uppercase">{sys.status}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-1 border border-black/5">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="font-black uppercase text-xs">99.9% Uptime</h4>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Industry leading reliability across our global data centers.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-2xl space-y-1 border border-black/5">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="font-black uppercase text-xs">Response Time</h4>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Average API response time of 45ms for all core services.</p>
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

function Zap(props: any) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
