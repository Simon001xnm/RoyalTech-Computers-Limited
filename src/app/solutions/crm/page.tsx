'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Users, Target, MessageSquare, ShieldCheck, CheckCircle2, UserPlus, Fingerprint, Activity, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function CrmSolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const steps = [
    { title: 'Identity Capture', desc: 'Create permanent profiles for client details, aliases, and contact points.', icon: Fingerprint },
    { title: 'Activity Stream', desc: 'Track every purchase, payment, and support ticket assigned to the client.', icon: Activity },
    { title: 'Debt Oversight', desc: 'Automated monitoring of credit terms and unpaid balances with aging reports.', icon: Target }
  ];

  return (
    <MarketingWrapper>
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        {/* HERO */}
        <section className="pt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-1.5 rounded-full shadow-xl ring-4 ring-blue-500/20">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Client Identity System</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Unified Client <br />
                    <span className="text-blue-500">& Debt Management.</span>
                </h1>
                
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl max-w-xl mx-auto lg:mx-0 group hover:bg-white/15 transition-all">
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed opacity-90 text-shadow-sm">
                        Never lose a client contact. Manage profiles, track outstanding balances, and nurture relationships with Nairobi's most intuitive CRM.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(59,130,246,0.3)] rounded-2xl bg-blue-500 hover:bg-blue-600 text-white border-none">Register Client Hub</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">Explore Features</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <Card className={cn(floatingGlass, "p-4 relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)]")}>
                    <img src={placeholderImages.branding.solutions_showcase.url} alt="CRM System" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-blue-200 text-blue-600 bg-white/50 shadow-sm">Identity Ledger</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How the CRM System Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">Centralizing every client interaction into one professional timeline.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-blue-500/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* CRM FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
             {[
                { title: 'Identity Ledger', desc: 'Secure storage for all your customer contact data.', icon: UserPlus },
                { title: 'Debt Tracking', desc: 'Automated monitoring of credit sales and aging debt.', icon: Target },
                { title: 'Engagement', desc: 'Integrated chat and communication logs for your team.', icon: MessageSquare },
            ].map((f, i) => (
                <div key={i} className={cn(floatingGlass, "p-8 space-y-4 hover:shadow-2xl transition-all group shadow-[0_15px_30px_rgba(0,0,0,0.1)]")}>
                    <div className="bg-blue-500/5 p-4 rounded-2xl w-fit group-hover:bg-blue-500 group-hover:text-white transition-colors mb-6 shadow-inner">
                        <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{f.desc}</p>
                </div>
            ))}
        </section>
      </div>
    </MarketingWrapper>
  );
}
